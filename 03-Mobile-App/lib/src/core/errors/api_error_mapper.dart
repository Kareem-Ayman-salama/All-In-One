import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:ain_mobile/src/core/api/api_error.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final apiErrorMapperProvider = Provider<ApiErrorMapper>((ref) {
  return const ApiErrorMapper();
});

class ApiErrorMapper {
  const ApiErrorMapper();

  ApiError map(Object error) {
    if (error is DioException) {
      return _fromDio(error);
    }

    return ApiError(
      code: 'UNKNOWN_CLIENT_ERROR',
      message: error.toString(),
      retryable: false,
    );
  }

  ApiError _fromDio(DioException error) {
    final responseData = error.response?.data;
    if (responseData is Map || responseData is Map<String, Object?>) {
      final body = readJsonObject(responseData);
      final envelope = body['error'];
      if (envelope is Map || envelope is Map<String, Object?>) {
        final errorJson = readJsonObject(envelope);
        final catalog = _readCatalog(errorJson['catalog']);

        return ApiError(
          code: errorJson['code'] as String? ?? 'HTTP_ERROR',
          message: errorJson['message'] as String? ??
              catalog?.messageEn ??
              'The request failed.',
          messageAr: catalog?.messageAr,
          retryable: catalog?.retryable ?? _isRetryableStatus(error),
          details: _readDetails(errorJson['details']),
          requestId: errorJson['requestId'] as String? ??
              error.response?.headers.value('X-Request-ID'),
          category: catalog?.category,
        );
      }
    }

    return ApiError(
      code: _fallbackCode(error),
      message: error.message ?? 'The request failed.',
      retryable: _isRetryableStatus(error),
      requestId: error.response?.headers.value('X-Request-ID'),
    );
  }

  ErrorCatalogEntry? _readCatalog(Object? value) {
    if (value == null) {
      return null;
    }
    final json = readJsonObject(value);

    return ErrorCatalogEntry(
      category: json['category'] as String? ?? 'unknown',
      retryable: json['retryable'] as bool? ?? false,
      messageEn: json['messageEn'] as String? ?? '',
      messageAr: json['messageAr'] as String? ?? '',
    );
  }

  Map<String, Object?> _readDetails(Object? value) {
    if (value == null) {
      return const <String, Object?>{};
    }

    return readJsonObject(value);
  }

  String _fallbackCode(DioException error) {
    return switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.receiveTimeout ||
      DioExceptionType.sendTimeout =>
        'NETWORK_TIMEOUT',
      DioExceptionType.cancel => 'REQUEST_CANCELLED',
      _ => 'HTTP_ERROR',
    };
  }

  bool _isRetryableStatus(DioException error) {
    final statusCode = error.response?.statusCode;
    return statusCode == null ||
        statusCode == 408 ||
        statusCode == 429 ||
        statusCode >= 500;
  }
}

class ErrorCatalogEntry {
  const ErrorCatalogEntry({
    required this.category,
    required this.retryable,
    required this.messageEn,
    required this.messageAr,
  });

  final String category;
  final bool retryable;
  final String messageEn;
  final String messageAr;
}

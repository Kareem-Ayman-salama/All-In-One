import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:ain_mobile/src/core/auth/secure_token_store.dart';
import 'package:dio/dio.dart';

class TokenRefreshCoordinator {
  TokenRefreshCoordinator({
    required Dio dio,
    required SecureTokenStore tokenStore,
  })  : _dio = dio,
        _tokenStore = tokenStore;

  static const skipRefreshExtraKey = 'skipAuthRefresh';
  static const retriedAfterRefreshExtraKey = 'retriedAfterRefresh';

  final Dio _dio;
  final SecureTokenStore _tokenStore;
  Future<String?>? _inFlightRefresh;

  Future<String?> refreshAccessToken() {
    final inFlight = _inFlightRefresh;
    if (inFlight != null) {
      return inFlight;
    }

    final refresh = _refreshAccessToken();
    _inFlightRefresh = refresh;
    refresh.whenComplete(() {
      _inFlightRefresh = null;
    });

    return refresh;
  }

  Future<String?> _refreshAccessToken() async {
    final refreshToken = await _tokenStore.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      await _tokenStore.clearSession();
      return null;
    }

    try {
      final response = await _dio.post<Object?>(
        '/auth/refresh',
        data: <String, Object?>{
          'refreshToken': refreshToken,
        },
        options: Options(
          extra: const <String, Object?>{
            skipRefreshExtraKey: true,
          },
        ),
      );
      final envelope = ApiEnvelope<Map<String, Object?>>.fromJson(
        readJsonObject(response.data),
        readJsonObject,
      );
      final accessToken = envelope.data['accessToken'] as String? ?? '';
      final rotatedRefreshToken = envelope.data['refreshToken'] as String? ?? '';

      if (accessToken.isEmpty || rotatedRefreshToken.isEmpty) {
        await _tokenStore.clearSession();
        return null;
      }

      await _tokenStore.writeTokens(
        accessToken: accessToken,
        refreshToken: rotatedRefreshToken,
      );

      return accessToken;
    } on Object {
      await _tokenStore.clearSession();
      return null;
    }
  }

  bool shouldAttemptRefresh(DioException error) {
    final options = error.requestOptions;
    if (error.response?.statusCode != 401) {
      return false;
    }

    return options.extra[skipRefreshExtraKey] != true &&
        options.extra[retriedAfterRefreshExtraKey] != true;
  }
}


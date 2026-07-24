import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationBookingRepositoryProvider =
    Provider<OrganizationBookingRepository>((ref) {
  return OrganizationBookingRepository(dio: ref.watch(dioProvider));
});

class OrganizationBookingRepository {
  const OrganizationBookingRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<OrganizationBookingSummary>> listBookings({
    required String organizationId,
    String? status,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/bookings',
      queryParameters: <String, Object?>{
        'perPage': perPage,
        if (_hasText(status)) 'status': status,
      },
    );
    final envelope = ApiEnvelope<List<OrganizationBookingSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(
        value,
      ).map(OrganizationBookingSummary.fromJson).toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationBookingSummary> confirmBooking({
    required String organizationId,
    required String bookingId,
    bool markAsPaid = false,
    String? internalNote,
  }) {
    return _bookingDecision(
      organizationId: organizationId,
      bookingId: bookingId,
      action: 'confirm',
      data: <String, Object?>{
        'markAsPaid': markAsPaid,
        if (_hasText(internalNote)) 'internalNote': internalNote!.trim(),
      },
    );
  }

  Future<OrganizationBookingSummary> rejectBooking({
    required String organizationId,
    required String bookingId,
    String? internalNote,
  }) {
    return _bookingDecision(
      organizationId: organizationId,
      bookingId: bookingId,
      action: 'reject',
      data: <String, Object?>{
        if (_hasText(internalNote)) 'internalNote': internalNote!.trim(),
      },
    );
  }

  Future<OrganizationBookingSummary> cancelBooking({
    required String organizationId,
    required String bookingId,
    String? internalNote,
  }) {
    return _bookingDecision(
      organizationId: organizationId,
      bookingId: bookingId,
      action: 'cancel',
      data: <String, Object?>{
        if (_hasText(internalNote)) 'internalNote': internalNote!.trim(),
      },
    );
  }

  Future<OrganizationBookingSummary> _bookingDecision({
    required String organizationId,
    required String bookingId,
    required String action,
    required Map<String, Object?> data,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/bookings/$bookingId/$action',
      data: data,
    );
    final envelope = ApiEnvelope<OrganizationBookingSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationBookingSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class OrganizationBookingSummary {
  const OrganizationBookingSummary({
    required this.id,
    required this.studentName,
    required this.email,
    required this.phone,
    required this.status,
    required this.paymentStatus,
    required this.amountMinor,
    required this.currency,
    this.course,
    this.batch,
    this.note,
    this.internalNote,
    this.createdAt,
  });

  factory OrganizationBookingSummary.fromJson(Map<String, Object?> json) {
    return OrganizationBookingSummary(
      id: _readString(json, 'id'),
      studentName: _readString(json, 'studentName', snakeKey: 'student_name'),
      email: _readString(json, 'email'),
      phone: _readString(json, 'phone'),
      status: _readString(json, 'status', fallback: 'pending_confirmation'),
      paymentStatus: _readString(
        json,
        'paymentStatus',
        snakeKey: 'payment_status',
        fallback: 'unpaid',
      ),
      amountMinor: _readInt(json, 'amountMinor', snakeKey: 'amount_minor'),
      currency: _readString(json, 'currency', fallback: 'EGP'),
      course: OrganizationBookingCourse.fromNullableJson(json['course']),
      batch: OrganizationBookingBatch.fromNullableJson(json['batch']),
      note: _readNullableString(json, 'note'),
      internalNote: _readNullableString(
        json,
        'internalNote',
        snakeKey: 'internal_note',
      ),
      createdAt: _readNullableString(json, 'createdAt', snakeKey: 'created_at'),
    );
  }

  final String id;
  final String studentName;
  final String email;
  final String phone;
  final String status;
  final String paymentStatus;
  final int amountMinor;
  final String currency;
  final OrganizationBookingCourse? course;
  final OrganizationBookingBatch? batch;
  final String? note;
  final String? internalNote;
  final String? createdAt;

  bool get isPending => status == 'pending_confirmation';
}

class OrganizationBookingCourse {
  const OrganizationBookingCourse({required this.id, required this.title});

  factory OrganizationBookingCourse.fromJson(Map<String, Object?> json) {
    final titleAr = _readString(json, 'titleAr', snakeKey: 'title_ar');
    return OrganizationBookingCourse(
      id: _readString(json, 'id'),
      title: _readString(json, 'title', fallback: titleAr),
    );
  }

  static OrganizationBookingCourse? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }

    return OrganizationBookingCourse.fromJson(readJsonObject(value));
  }

  final String id;
  final String title;
}

class OrganizationBookingBatch {
  const OrganizationBookingBatch({
    required this.id,
    required this.title,
    this.startDate,
  });

  factory OrganizationBookingBatch.fromJson(Map<String, Object?> json) {
    final titleAr = _readString(json, 'titleAr', snakeKey: 'title_ar');
    return OrganizationBookingBatch(
      id: _readString(json, 'id'),
      title: _readString(json, 'title', fallback: titleAr),
      startDate: _readNullableString(json, 'startDate', snakeKey: 'start_date'),
    );
  }

  static OrganizationBookingBatch? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }

    return OrganizationBookingBatch.fromJson(readJsonObject(value));
  }

  final String id;
  final String title;
  final String? startDate;
}

String _readString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  String fallback = '',
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value == null) {
    return fallback;
  }

  return value.toString();
}

String? _readNullableString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  return value?.toString();
}

int _readInt(Map<String, Object?> json, String key, {String? snakeKey}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '') ?? 0;
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

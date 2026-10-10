import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationAttendanceRepositoryProvider =
    Provider<OrganizationAttendanceRepository>((ref) {
  return OrganizationAttendanceRepository(dio: ref.watch(dioProvider));
});

class OrganizationAttendanceRepository {
  const OrganizationAttendanceRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<OrganizationLearningSessionSummary>> listSessions({
    required String organizationId,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/learning-sessions',
      queryParameters: <String, Object?>{'perPage': perPage},
    );
    final envelope =
        ApiEnvelope<List<OrganizationLearningSessionSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(OrganizationLearningSessionSummary.fromJson)
          .toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationAttendanceSheet> getAttendance({
    required String organizationId,
    required String sessionId,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/learning-sessions/$sessionId/attendance',
    );
    final envelope = ApiEnvelope<OrganizationAttendanceSheet>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationAttendanceSheet.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<List<OrganizationAttendanceRecordSummary>> markAttendance({
    required String organizationId,
    required String sessionId,
    required List<OrganizationAttendanceMarkRecord> records,
  }) async {
    final response = await _dio.put<Object?>(
      '/organizations/$organizationId/learning-sessions/$sessionId/attendance',
      data: <String, Object?>{
        'records': records.map((record) => record.toJson()).toList(),
      },
    );
    final envelope =
        ApiEnvelope<List<OrganizationAttendanceRecordSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(OrganizationAttendanceRecordSummary.fromJson)
          .toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationLearningSessionSummary> lockAttendance({
    required String organizationId,
    required String sessionId,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/learning-sessions/$sessionId/attendance/lock',
    );
    final envelope = ApiEnvelope<OrganizationLearningSessionSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationLearningSessionSummary.fromJson(
        readJsonObject(value),
      ),
    );

    return envelope.data;
  }

  Future<OrganizationAttendanceQrCode> generateQr({
    required String organizationId,
    required String sessionId,
    int validForMinutes = 10,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/learning-sessions/$sessionId/attendance/qr',
      data: <String, Object?>{'validForMinutes': validForMinutes},
    );
    final envelope = ApiEnvelope<OrganizationAttendanceQrCode>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationAttendanceQrCode.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class OrganizationLearningSessionSummary {
  const OrganizationLearningSessionSummary({
    required this.id,
    required this.title,
    required this.startsAt,
    required this.endsAt,
    required this.status,
    required this.attendanceRecordsCount,
    this.titleAr,
    this.attendanceLockedAt,
    this.batch,
    this.instructor,
  });

  factory OrganizationLearningSessionSummary.fromJson(
    Map<String, Object?> json,
  ) {
    return OrganizationLearningSessionSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
      startsAt: _readString(json, 'startsAt', snakeKey: 'starts_at'),
      endsAt: _readString(json, 'endsAt', snakeKey: 'ends_at'),
      status: _readString(json, 'status', fallback: 'scheduled'),
      attendanceLockedAt: _readNullableString(
        json,
        'attendanceLockedAt',
        snakeKey: 'attendance_locked_at',
      ),
      attendanceRecordsCount: _readInt(
        json,
        'attendanceRecordsCount',
        snakeKey: 'attendance_records_count',
      ),
      batch: OrganizationAttendanceBatchSummary.fromNullableJson(
        json['batch'],
      ),
      instructor: OrganizationAttendanceUserSummary.fromNullableJson(
        json['instructor'],
      ),
    );
  }

  final String id;
  final String title;
  final String? titleAr;
  final String startsAt;
  final String endsAt;
  final String status;
  final String? attendanceLockedAt;
  final int attendanceRecordsCount;
  final OrganizationAttendanceBatchSummary? batch;
  final OrganizationAttendanceUserSummary? instructor;

  bool get isLocked => _hasText(attendanceLockedAt);

  String localizedTitle(bool isArabic) {
    return isArabic && _hasText(titleAr) ? titleAr! : title;
  }
}

class OrganizationAttendanceSheet {
  const OrganizationAttendanceSheet({
    required this.session,
    required this.participants,
    required this.locked,
  });

  factory OrganizationAttendanceSheet.fromJson(Map<String, Object?> json) {
    return OrganizationAttendanceSheet(
      session: OrganizationLearningSessionSummary.fromJson(
        _readObject(json['session']),
      ),
      participants: readJsonObjectList(json['participants'])
          .map(OrganizationAttendanceParticipant.fromJson)
          .toList(growable: false),
      locked: _readBool(json, 'locked'),
    );
  }

  final OrganizationLearningSessionSummary session;
  final List<OrganizationAttendanceParticipant> participants;
  final bool locked;
}

class OrganizationAttendanceParticipant {
  const OrganizationAttendanceParticipant({
    required this.student,
    this.enrollmentId,
    this.lessonBookingId,
    this.record,
  });

  factory OrganizationAttendanceParticipant.fromJson(
    Map<String, Object?> json,
  ) {
    return OrganizationAttendanceParticipant(
      student: OrganizationAttendanceUserSummary.fromJson(
        _readObject(json['student']),
      ),
      enrollmentId: _readNullableString(
        json,
        'enrollmentId',
        snakeKey: 'enrollment_id',
      ),
      lessonBookingId: _readNullableString(
        json,
        'lessonBookingId',
        snakeKey: 'lesson_booking_id',
      ),
      record: OrganizationAttendanceRecordSummary.fromNullableJson(
        json['record'],
      ),
    );
  }

  final OrganizationAttendanceUserSummary student;
  final String? enrollmentId;
  final String? lessonBookingId;
  final OrganizationAttendanceRecordSummary? record;
}

class OrganizationAttendanceMarkRecord {
  const OrganizationAttendanceMarkRecord({
    required this.studentId,
    required this.status,
    this.guardianVisible = true,
    this.minutesLate,
    this.excuseReason,
    this.instructorNote,
  });

  final String studentId;
  final String status;
  final bool guardianVisible;
  final int? minutesLate;
  final String? excuseReason;
  final String? instructorNote;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'studentId': studentId,
      'status': status,
      'guardianVisible': guardianVisible,
      if (minutesLate != null) 'minutesLate': minutesLate,
      if (_hasText(excuseReason)) 'excuseReason': excuseReason!.trim(),
      if (_hasText(instructorNote)) 'instructorNote': instructorNote!.trim(),
    };
  }
}

class OrganizationAttendanceRecordSummary {
  const OrganizationAttendanceRecordSummary({
    required this.id,
    required this.status,
    required this.guardianVisible,
    this.markedAt,
    this.student,
  });

  factory OrganizationAttendanceRecordSummary.fromJson(
    Map<String, Object?> json,
  ) {
    return OrganizationAttendanceRecordSummary(
      id: _readString(json, 'id'),
      status: _readString(json, 'status', fallback: 'present'),
      guardianVisible: _readBool(
        json,
        'guardianVisible',
        snakeKey: 'guardian_visible',
        fallback: true,
      ),
      markedAt: _readNullableString(json, 'markedAt', snakeKey: 'marked_at'),
      student: OrganizationAttendanceUserSummary.fromNullableJson(
        json['student'],
      ),
    );
  }

  factory OrganizationAttendanceRecordSummary.fromNullableJson(Object? value) {
    final json = _readNullableObject(value);
    if (json == null) {
      return const OrganizationAttendanceRecordSummary(
        id: '',
        status: 'present',
        guardianVisible: true,
      );
    }

    return OrganizationAttendanceRecordSummary.fromJson(json);
  }

  final String id;
  final String status;
  final bool guardianVisible;
  final String? markedAt;
  final OrganizationAttendanceUserSummary? student;

  bool get exists => _hasText(id);
}

class OrganizationAttendanceQrCode {
  const OrganizationAttendanceQrCode({
    required this.sessionId,
    required this.token,
    required this.checkInUrl,
    this.expiresAt,
  });

  factory OrganizationAttendanceQrCode.fromJson(Map<String, Object?> json) {
    return OrganizationAttendanceQrCode(
      sessionId: _readString(json, 'sessionId', snakeKey: 'session_id'),
      token: _readString(json, 'token'),
      checkInUrl: _readString(json, 'checkInUrl', snakeKey: 'check_in_url'),
      expiresAt: _readNullableString(json, 'expiresAt', snakeKey: 'expires_at'),
    );
  }

  final String sessionId;
  final String token;
  final String checkInUrl;
  final String? expiresAt;
}

class OrganizationAttendanceBatchSummary {
  const OrganizationAttendanceBatchSummary({
    required this.id,
    required this.title,
    this.titleAr,
    this.course,
  });

  factory OrganizationAttendanceBatchSummary.fromJson(
    Map<String, Object?> json,
  ) {
    return OrganizationAttendanceBatchSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
      course: OrganizationAttendanceCourseSummary.fromNullableJson(
        json['course'],
      ),
    );
  }

  static OrganizationAttendanceBatchSummary? fromNullableJson(Object? value) {
    final json = _readNullableObject(value);
    return json == null
        ? null
        : OrganizationAttendanceBatchSummary.fromJson(json);
  }

  final String id;
  final String title;
  final String? titleAr;
  final OrganizationAttendanceCourseSummary? course;

  String localizedTitle(bool isArabic) {
    return isArabic && _hasText(titleAr) ? titleAr! : title;
  }
}

class OrganizationAttendanceCourseSummary {
  const OrganizationAttendanceCourseSummary({
    required this.id,
    required this.title,
    this.titleAr,
  });

  factory OrganizationAttendanceCourseSummary.fromJson(
    Map<String, Object?> json,
  ) {
    return OrganizationAttendanceCourseSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
    );
  }

  static OrganizationAttendanceCourseSummary? fromNullableJson(Object? value) {
    final json = _readNullableObject(value);
    return json == null
        ? null
        : OrganizationAttendanceCourseSummary.fromJson(json);
  }

  final String id;
  final String title;
  final String? titleAr;
}

class OrganizationAttendanceUserSummary {
  const OrganizationAttendanceUserSummary({
    required this.id,
    required this.name,
    this.email,
    this.nameAr,
  });

  factory OrganizationAttendanceUserSummary.fromJson(
    Map<String, Object?> json,
  ) {
    return OrganizationAttendanceUserSummary(
      id: _readString(json, 'id'),
      name: _readString(json, 'name', fallback: _readString(json, 'email')),
      email: _readNullableString(json, 'email'),
      nameAr: _readNullableString(json, 'nameAr', snakeKey: 'name_ar'),
    );
  }

  static OrganizationAttendanceUserSummary? fromNullableJson(Object? value) {
    final json = _readNullableObject(value);
    return json == null
        ? null
        : OrganizationAttendanceUserSummary.fromJson(json);
  }

  final String id;
  final String name;
  final String? email;
  final String? nameAr;

  String localizedName(bool isArabic) {
    return isArabic && _hasText(nameAr) ? nameAr! : name;
  }
}

Map<String, Object?> _readObject(Object? value) {
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    return Map<String, Object?>.from(value);
  }

  return const <String, Object?>{};
}

Map<String, Object?>? _readNullableObject(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    return Map<String, Object?>.from(value);
  }

  return null;
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

bool _readBool(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  bool fallback = false,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value is bool) {
    return value;
  }

  return value?.toString() == 'true' ? true : fallback;
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

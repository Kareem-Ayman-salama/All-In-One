import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository(dio: ref.watch(dioProvider));
});

class AttendanceRepository {
  const AttendanceRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<StudentAttendanceOverview> getStudentAttendance({
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/student/attendance',
      queryParameters: <String, Object?>{'perPage': perPage},
    );
    final envelope = ApiEnvelope<StudentAttendanceOverview>.fromJson(
      readJsonObject(response.data),
      (value) => StudentAttendanceOverview.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<GuardianAttendanceOverview> getGuardianAttendance({
    int perPage = 100,
  }) async {
    final studentsResponse = await _dio.get<Object?>('/guardian/students');
    final studentsEnvelope = ApiEnvelope<List<GuardianStudentSummary>>.fromJson(
      readJsonObject(studentsResponse.data),
      (value) => readJsonObjectList(
        value,
      ).map(GuardianStudentSummary.fromJson).toList(growable: false),
    );
    final students = studentsEnvelope.data;
    final attendance = await Future.wait(
      students.map((student) {
        return getGuardianStudentAttendance(
          student.studentId,
          perPage: perPage,
        );
      }),
    );

    return GuardianAttendanceOverview(
      students: students,
      attendance: attendance,
    );
  }

  Future<GuardianStudentAttendance> getGuardianStudentAttendance(
    String studentId, {
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/guardian/students/$studentId/attendance',
      queryParameters: <String, Object?>{'perPage': perPage},
    );
    final envelope = ApiEnvelope<GuardianStudentAttendance>.fromJson(
      readJsonObject(response.data),
      (value) => GuardianStudentAttendance.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class StudentAttendanceOverview {
  const StudentAttendanceOverview({
    required this.records,
    required this.summary,
  });

  factory StudentAttendanceOverview.fromJson(Map<String, Object?> json) {
    return StudentAttendanceOverview(
      records: readJsonObjectList(
        json['records'],
      ).map(AttendanceRecordSummary.fromJson).toList(growable: false),
      summary: AttendanceSummary.fromJson(readJsonObject(json['summary'])),
    );
  }

  final List<AttendanceRecordSummary> records;
  final AttendanceSummary summary;
}

class GuardianAttendanceOverview {
  const GuardianAttendanceOverview({
    required this.students,
    required this.attendance,
  });

  final List<GuardianStudentSummary> students;
  final List<GuardianStudentAttendance> attendance;
}

class GuardianStudentAttendance {
  const GuardianStudentAttendance({
    required this.student,
    required this.records,
    required this.summary,
  });

  factory GuardianStudentAttendance.fromJson(Map<String, Object?> json) {
    return GuardianStudentAttendance(
      student: AttendanceUserSummary.fromJson(readJsonObject(json['student'])),
      records: readJsonObjectList(
        json['records'],
      ).map(AttendanceRecordSummary.fromJson).toList(growable: false),
      summary: AttendanceSummary.fromJson(readJsonObject(json['summary'])),
    );
  }

  final AttendanceUserSummary student;
  final List<AttendanceRecordSummary> records;
  final AttendanceSummary summary;
}

class GuardianStudentSummary {
  const GuardianStudentSummary({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.organizationName,
    required this.relationship,
  });

  factory GuardianStudentSummary.fromJson(Map<String, Object?> json) {
    final student = _readObject(json['student']);
    final organization = _readObject(json['organization']);

    return GuardianStudentSummary(
      id: _readString(json, 'id'),
      studentId: _readString(student, 'id'),
      studentName: _readString(
        student,
        'name',
        fallback: _readString(student, 'email'),
      ),
      organizationName: _readString(organization, 'name'),
      relationship: _readString(json, 'relationship', fallback: 'guardian'),
    );
  }

  final String id;
  final String studentId;
  final String studentName;
  final String organizationName;
  final String relationship;
}

class AttendanceSummary {
  const AttendanceSummary({
    required this.total,
    required this.present,
    required this.absent,
    required this.late,
    required this.excused,
    required this.attendanceRate,
  });

  factory AttendanceSummary.fromJson(Map<String, Object?> json) {
    return AttendanceSummary(
      total: _readInt(json, 'total'),
      present: _readInt(json, 'present'),
      absent: _readInt(json, 'absent'),
      late: _readInt(json, 'late'),
      excused: _readInt(json, 'excused'),
      attendanceRate: _readDouble(
        json,
        'attendanceRate',
        snakeKey: 'attendance_rate',
      ),
    );
  }

  final int total;
  final int present;
  final int absent;
  final int late;
  final int excused;
  final double attendanceRate;
}

class AttendanceRecordSummary {
  const AttendanceRecordSummary({
    required this.id,
    required this.status,
    this.markedAt,
    this.instructorNote,
    this.excuseReason,
    this.session,
    this.markedBy,
  });

  factory AttendanceRecordSummary.fromJson(Map<String, Object?> json) {
    return AttendanceRecordSummary(
      id: _readString(json, 'id'),
      status: _readString(json, 'status', fallback: 'present'),
      markedAt: _readNullableString(json, 'markedAt', snakeKey: 'marked_at'),
      instructorNote: _readNullableString(
        json,
        'instructorNote',
        snakeKey: 'instructor_note',
      ),
      excuseReason: _readNullableString(
        json,
        'excuseReason',
        snakeKey: 'excuse_reason',
      ),
      session: AttendanceSessionSummary.fromNullableJson(json['session']),
      markedBy: AttendanceUserSummary.fromNullableJson(
        json['markedBy'] ?? json['marked_by'],
      ),
    );
  }

  final String id;
  final String status;
  final String? markedAt;
  final String? instructorNote;
  final String? excuseReason;
  final AttendanceSessionSummary? session;
  final AttendanceUserSummary? markedBy;
}

class AttendanceSessionSummary {
  const AttendanceSessionSummary({
    required this.id,
    required this.title,
    this.titleAr,
    this.startsAt,
    this.endsAt,
    this.batch,
    this.instructor,
  });

  factory AttendanceSessionSummary.fromJson(Map<String, Object?> json) {
    return AttendanceSessionSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
      startsAt: _readNullableString(json, 'startsAt', snakeKey: 'starts_at'),
      endsAt: _readNullableString(json, 'endsAt', snakeKey: 'ends_at'),
      batch: AttendanceBatchSummary.fromNullableJson(json['batch']),
      instructor: AttendanceUserSummary.fromNullableJson(json['instructor']),
    );
  }

  static AttendanceSessionSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }

    return AttendanceSessionSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String title;
  final String? titleAr;
  final String? startsAt;
  final String? endsAt;
  final AttendanceBatchSummary? batch;
  final AttendanceUserSummary? instructor;

  String localizedTitle(bool isArabic) {
    return isArabic && _hasText(titleAr) ? titleAr! : title;
  }
}

class AttendanceBatchSummary {
  const AttendanceBatchSummary({
    required this.id,
    required this.title,
    this.titleAr,
    this.course,
  });

  factory AttendanceBatchSummary.fromJson(Map<String, Object?> json) {
    return AttendanceBatchSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
      course: AttendanceCourseSummary.fromNullableJson(json['course']),
    );
  }

  static AttendanceBatchSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }

    return AttendanceBatchSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String title;
  final String? titleAr;
  final AttendanceCourseSummary? course;

  String localizedTitle(bool isArabic) {
    return isArabic && _hasText(titleAr) ? titleAr! : title;
  }
}

class AttendanceCourseSummary {
  const AttendanceCourseSummary({
    required this.id,
    required this.title,
    this.titleAr,
  });

  factory AttendanceCourseSummary.fromJson(Map<String, Object?> json) {
    return AttendanceCourseSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
    );
  }

  static AttendanceCourseSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }

    return AttendanceCourseSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String title;
  final String? titleAr;

  String localizedTitle(bool isArabic) {
    return isArabic && _hasText(titleAr) ? titleAr! : title;
  }
}

class AttendanceUserSummary {
  const AttendanceUserSummary({
    required this.id,
    required this.name,
    this.email,
    this.nameAr,
  });

  factory AttendanceUserSummary.fromJson(Map<String, Object?> json) {
    return AttendanceUserSummary(
      id: _readString(json, 'id'),
      name: _readString(json, 'name', fallback: _readString(json, 'email')),
      email: _readNullableString(json, 'email'),
      nameAr: _readNullableString(json, 'nameAr', snakeKey: 'name_ar'),
    );
  }

  static AttendanceUserSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }

    return AttendanceUserSummary.fromJson(readJsonObject(value));
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

String _readString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  String fallback = '',
}) {
  return (json[key] ?? (snakeKey == null ? null : json[snakeKey]))
          ?.toString() ??
      fallback;
}

String? _readNullableString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
}) {
  return (json[key] ?? (snakeKey == null ? null : json[snakeKey]))?.toString();
}

int _readInt(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  int fallback = 0,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value) ?? fallback;
  }

  return fallback;
}

double _readDouble(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  double fallback = 0,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value) ?? fallback;
  }

  return fallback;
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final studentLearningRepositoryProvider =
    Provider<StudentLearningRepository>((ref) {
  return StudentLearningRepository(dio: ref.watch(dioProvider));
});

class StudentLearningRepository {
  const StudentLearningRepository({
    required Dio dio,
  }) : _dio = dio;

  final Dio _dio;

  Future<StudentLearningOverview> getOverview({
    int perPage = 100,
  }) async {
    final responses = await Future.wait([
      _dio.get<Object?>(
        '/student/bookings',
        queryParameters: <String, Object?>{'perPage': perPage},
      ),
      _dio.get<Object?>(
        '/student/enrollments',
        queryParameters: <String, Object?>{'perPage': perPage},
      ),
    ]);
    final bookingEnvelope = ApiEnvelope<List<StudentBookingSummary>>.fromJson(
      readJsonObject(responses[0].data),
      (value) => readJsonObjectList(value)
          .map(StudentBookingSummary.fromJson)
          .toList(growable: false),
    );
    final enrollmentEnvelope =
        ApiEnvelope<List<StudentEnrollmentSummary>>.fromJson(
      readJsonObject(responses[1].data),
      (value) => readJsonObjectList(value)
          .map(StudentEnrollmentSummary.fromJson)
          .toList(growable: false),
    );

    return StudentLearningOverview(
      bookings: bookingEnvelope.data,
      enrollments: enrollmentEnvelope.data,
    );
  }

  Future<StudentEnrollmentDetail> getEnrollment(String enrollmentId) async {
    final response = await _dio.get<Object?>(
      '/student/enrollments/$enrollmentId',
    );
    final envelope = ApiEnvelope<StudentEnrollmentDetail>.fromJson(
      readJsonObject(response.data),
      (value) => StudentEnrollmentDetail.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class StudentLearningOverview {
  const StudentLearningOverview({
    required this.bookings,
    required this.enrollments,
  });

  final List<StudentBookingSummary> bookings;
  final List<StudentEnrollmentSummary> enrollments;

  int get pendingBookingCount {
    return bookings
        .where((booking) => booking.status == 'pending_confirmation')
        .length;
  }

  int get activeEnrollmentCount {
    return enrollments
        .where((enrollment) => enrollment.status == 'active')
        .length;
  }
}

class StudentBookingSummary {
  const StudentBookingSummary({
    required this.id,
    required this.courseId,
    required this.batchId,
    required this.studentName,
    required this.email,
    required this.status,
    required this.paymentStatus,
    required this.amountMinor,
    required this.currency,
    this.course,
    this.batch,
    this.enrollment,
    this.createdAt,
  });

  factory StudentBookingSummary.fromJson(Map<String, Object?> json) {
    return StudentBookingSummary(
      id: _readString(json, 'id'),
      courseId: _readString(json, 'courseId', snakeKey: 'course_id'),
      batchId: _readString(json, 'batchId', snakeKey: 'batch_id'),
      studentName: _readString(json, 'studentName', snakeKey: 'student_name'),
      email: _readString(json, 'email'),
      status: _readString(json, 'status', fallback: 'pending_confirmation'),
      paymentStatus: _readString(
        json,
        'paymentStatus',
        snakeKey: 'payment_status',
        fallback: 'unpaid',
      ),
      amountMinor: _readInt(json, 'amountMinor', snakeKey: 'amount_minor'),
      currency: _readString(json, 'currency', fallback: 'EGP'),
      course: StudentCourseSummary.fromNullableJson(json['course']),
      batch: StudentBatchSummary.fromNullableJson(json['batch']),
      enrollment: StudentEnrollmentSummary.fromNullableJson(json['enrollment']),
      createdAt: _readNullableString(json, 'createdAt', snakeKey: 'created_at'),
    );
  }

  final String id;
  final String courseId;
  final String batchId;
  final String studentName;
  final String email;
  final String status;
  final String paymentStatus;
  final int amountMinor;
  final String currency;
  final StudentCourseSummary? course;
  final StudentBatchSummary? batch;
  final StudentEnrollmentSummary? enrollment;
  final String? createdAt;

  bool get isPending => status == 'pending_confirmation';
}

class StudentEnrollmentSummary {
  const StudentEnrollmentSummary({
    required this.id,
    required this.organizationId,
    required this.courseId,
    required this.batchId,
    required this.bookingId,
    required this.status,
    this.course,
    this.batch,
    this.subscription,
    this.accessStartsAt,
    this.accessEndsAt,
  });

  factory StudentEnrollmentSummary.fromJson(Map<String, Object?> json) {
    return StudentEnrollmentSummary(
      id: _readString(json, 'id'),
      organizationId: _readString(
        json,
        'organizationId',
        snakeKey: 'organization_id',
      ),
      courseId: _readString(json, 'courseId', snakeKey: 'course_id'),
      batchId: _readString(json, 'batchId', snakeKey: 'batch_id'),
      bookingId: _readString(json, 'bookingId', snakeKey: 'booking_id'),
      status: _readString(json, 'status', fallback: 'active'),
      course: StudentCourseSummary.fromNullableJson(json['course']),
      batch: StudentBatchSummary.fromNullableJson(json['batch']),
      subscription:
          StudentSubscriptionSummary.fromNullableJson(json['subscription']),
      accessStartsAt:
          _readNullableString(json, 'accessStartsAt', snakeKey: 'access_starts_at'),
      accessEndsAt:
          _readNullableString(json, 'accessEndsAt', snakeKey: 'access_ends_at'),
    );
  }

  static StudentEnrollmentSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return StudentEnrollmentSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String organizationId;
  final String courseId;
  final String batchId;
  final String bookingId;
  final String status;
  final StudentCourseSummary? course;
  final StudentBatchSummary? batch;
  final StudentSubscriptionSummary? subscription;
  final String? accessStartsAt;
  final String? accessEndsAt;

  bool get isActive => status == 'active';
}

class StudentEnrollmentDetail {
  const StudentEnrollmentDetail({
    required this.enrollment,
    required this.access,
  });

  factory StudentEnrollmentDetail.fromJson(Map<String, Object?> json) {
    return StudentEnrollmentDetail(
      enrollment: StudentEnrollmentSummary.fromJson(
        readJsonObject(json['enrollment']),
      ),
      access: StudentEnrollmentAccess.fromJson(
        readJsonObject(json['access']),
      ),
    );
  }

  final StudentEnrollmentSummary enrollment;
  final StudentEnrollmentAccess access;
}

class StudentEnrollmentAccess {
  const StudentEnrollmentAccess({
    required this.allowed,
    required this.renewalRequired,
    this.reason,
  });

  factory StudentEnrollmentAccess.fromJson(Map<String, Object?> json) {
    return StudentEnrollmentAccess(
      allowed: json['allowed'] as bool? ?? false,
      reason: json['reason'] as String?,
      renewalRequired: json['renewalRequired'] as bool? ?? false,
    );
  }

  final bool allowed;
  final bool renewalRequired;
  final String? reason;
}

class StudentCourseSummary {
  const StudentCourseSummary({
    required this.id,
    required this.title,
    this.titleAr,
    this.slug,
    this.academy,
    this.instructor,
  });

  factory StudentCourseSummary.fromJson(Map<String, Object?> json) {
    return StudentCourseSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
      slug: _readNullableString(json, 'slug'),
      academy: StudentAcademySummary.fromNullableJson(
        json['academyProfile'] ?? json['academy_profile'] ?? json['academy'],
      ),
      instructor: StudentInstructorSummary.fromNullableJson(json['instructor']),
    );
  }

  static StudentCourseSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return StudentCourseSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String title;
  final String? titleAr;
  final String? slug;
  final StudentAcademySummary? academy;
  final StudentInstructorSummary? instructor;

  String localizedTitle(bool isArabic) {
    return isArabic && _hasText(titleAr) ? titleAr! : title;
  }
}

class StudentAcademySummary {
  const StudentAcademySummary({
    required this.id,
    required this.name,
    this.nameAr,
  });

  factory StudentAcademySummary.fromJson(Map<String, Object?> json) {
    return StudentAcademySummary(
      id: _readString(json, 'id'),
      name: _readString(
        json,
        'publicName',
        snakeKey: 'public_name',
        fallback: _readString(json, 'name'),
      ),
      nameAr: _readNullableString(
        json,
        'publicNameAr',
        snakeKey: 'public_name_ar',
      ) ?? _readNullableString(json, 'nameAr', snakeKey: 'name_ar'),
    );
  }

  static StudentAcademySummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return StudentAcademySummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String name;
  final String? nameAr;

  String localizedName(bool isArabic) {
    return isArabic && _hasText(nameAr) ? nameAr! : name;
  }
}

class StudentInstructorSummary {
  const StudentInstructorSummary({
    required this.id,
    required this.name,
    this.nameAr,
  });

  factory StudentInstructorSummary.fromJson(Map<String, Object?> json) {
    return StudentInstructorSummary(
      id: _readString(json, 'id'),
      name: _readString(json, 'name'),
      nameAr: _readNullableString(json, 'nameAr', snakeKey: 'name_ar'),
    );
  }

  static StudentInstructorSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return StudentInstructorSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String name;
  final String? nameAr;

  String localizedName(bool isArabic) {
    return isArabic && _hasText(nameAr) ? nameAr! : name;
  }
}

class StudentBatchSummary {
  const StudentBatchSummary({
    required this.id,
    required this.title,
    this.titleAr,
    this.schedule,
    this.startDate,
    this.room,
  });

  factory StudentBatchSummary.fromJson(Map<String, Object?> json) {
    return StudentBatchSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
      schedule: _readSchedule(json['schedule']),
      startDate: _readNullableString(json, 'startDate', snakeKey: 'start_date'),
      room: StudentRoomSummary.fromNullableJson(json['room']),
    );
  }

  static StudentBatchSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return StudentBatchSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String title;
  final String? titleAr;
  final String? schedule;
  final String? startDate;
  final StudentRoomSummary? room;

  String localizedTitle(bool isArabic) {
    return isArabic && _hasText(titleAr) ? titleAr! : title;
  }
}

class StudentRoomSummary {
  const StudentRoomSummary({
    required this.id,
    required this.name,
  });

  factory StudentRoomSummary.fromJson(Map<String, Object?> json) {
    return StudentRoomSummary(
      id: _readString(json, 'id'),
      name: _readString(json, 'name'),
    );
  }

  static StudentRoomSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return StudentRoomSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String name;
}

class StudentSubscriptionSummary {
  const StudentSubscriptionSummary({
    required this.id,
    required this.status,
    this.endsAt,
  });

  factory StudentSubscriptionSummary.fromJson(Map<String, Object?> json) {
    return StudentSubscriptionSummary(
      id: _readString(json, 'id'),
      status: _readString(json, 'status', fallback: 'active'),
      endsAt: _readNullableString(json, 'endsAt', snakeKey: 'ends_at'),
    );
  }

  static StudentSubscriptionSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return StudentSubscriptionSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String status;
  final String? endsAt;
}

String _readString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  String fallback = '',
}) {
  return (json[key] ?? (snakeKey == null ? null : json[snakeKey]))?.toString() ??
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

String? _readSchedule(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is String) {
    return value;
  }
  if (value is List) {
    return value.map((item) => item.toString()).join(' - ');
  }
  return value.toString();
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

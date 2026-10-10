import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationCourseRepositoryProvider =
    Provider<OrganizationCourseRepository>((ref) {
  return OrganizationCourseRepository(dio: ref.watch(dioProvider));
});

class OrganizationCourseRepository {
  const OrganizationCourseRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<OrganizationCoursesOverview> getOverview({
    required String organizationId,
    int perPage = 100,
  }) async {
    final responses = await Future.wait([
      _dio.get<Object?>(
        '/organizations/$organizationId/courses',
        queryParameters: <String, Object?>{'perPage': perPage},
      ),
      _dio.get<Object?>(
        '/organizations/$organizationId/batches',
        queryParameters: <String, Object?>{'perPage': perPage},
      ),
    ]);
    final courseEnvelope =
        ApiEnvelope<List<OrganizationCourseSummary>>.fromJson(
      readJsonObject(responses[0].data),
      (value) => readJsonObjectList(
        value,
      ).map(OrganizationCourseSummary.fromJson).toList(growable: false),
    );
    final batchEnvelope = ApiEnvelope<List<OrganizationBatchSummary>>.fromJson(
      readJsonObject(responses[1].data),
      (value) => readJsonObjectList(
        value,
      ).map(OrganizationBatchSummary.fromJson).toList(growable: false),
    );

    return OrganizationCoursesOverview(
      courses: courseEnvelope.data,
      batches: batchEnvelope.data,
    );
  }

  Future<OrganizationCourseSummary> createCourse({
    required String organizationId,
    required CreateOrganizationCourseCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/courses',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationCourseSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationCourseSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationCourseSummary> updateCourse({
    required String organizationId,
    required String courseId,
    required CreateOrganizationCourseCommand command,
  }) async {
    final response = await _dio.put<Object?>(
      '/organizations/$organizationId/courses/$courseId',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationCourseSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationCourseSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationCourseSummary> submitCourseForReview({
    required String organizationId,
    required String courseId,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/courses/$courseId/submit-review',
    );
    final envelope = ApiEnvelope<OrganizationCourseSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationCourseSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationBatchSummary> createBatch({
    required String organizationId,
    required CreateOrganizationBatchCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/batches',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationBatchSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationBatchSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationBatchSummary> updateBatch({
    required String organizationId,
    required String batchId,
    required CreateOrganizationBatchCommand command,
  }) async {
    final response = await _dio.patch<Object?>(
      '/organizations/$organizationId/batches/$batchId',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationBatchSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationBatchSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class OrganizationCoursesOverview {
  const OrganizationCoursesOverview({
    required this.courses,
    required this.batches,
  });

  final List<OrganizationCourseSummary> courses;
  final List<OrganizationBatchSummary> batches;

  int get publishedCourseCount {
    return courses.where((course) => course.status == 'published').length;
  }

  int get openBatchCount {
    return batches.where((batch) => batch.status == 'open').length;
  }

  List<OrganizationBatchSummary> batchesForCourse(String courseId) {
    return batches
        .where((batch) => batch.courseId == courseId)
        .toList(growable: false);
  }
}

class CreateOrganizationCourseCommand {
  const CreateOrganizationCourseCommand({
    required this.title,
    required this.deliveryType,
    required this.priceMinor,
    this.currency = 'EGP',
    this.shortDescription,
    this.description,
    this.subject,
  });

  final String title;
  final String deliveryType;
  final int priceMinor;
  final String currency;
  final String? shortDescription;
  final String? description;
  final String? subject;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'title': title.trim(),
      'deliveryType': deliveryType,
      'priceMinor': priceMinor,
      'currency': currency.trim().toUpperCase(),
      if (_hasText(shortDescription))
        'shortDescription': shortDescription!.trim(),
      if (_hasText(description)) 'description': description!.trim(),
      if (_hasText(subject)) 'subject': subject!.trim(),
    };
  }
}

class CreateOrganizationBatchCommand {
  const CreateOrganizationBatchCommand({
    required this.courseId,
    required this.roomId,
    required this.title,
    required this.startDate,
    required this.endDate,
    required this.deliveryType,
    required this.capacity,
    required this.schedule,
    this.status = 'open',
    this.location,
  });

  final String courseId;
  final String roomId;
  final String title;
  final String startDate;
  final String endDate;
  final String deliveryType;
  final int capacity;
  final List<OrganizationBatchScheduleSlot> schedule;
  final String status;
  final String? location;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'courseId': courseId,
      'roomId': roomId,
      'title': title.trim(),
      'startDate': startDate.trim(),
      'endDate': endDate.trim(),
      'deliveryType': deliveryType,
      'capacity': capacity,
      'schedule': schedule.map((slot) => slot.toJson()).toList(),
      'status': status,
      if (_hasText(location)) 'location': location!.trim(),
    };
  }
}

class OrganizationBatchScheduleSlot {
  const OrganizationBatchScheduleSlot({
    required this.day,
    required this.startTime,
    required this.endTime,
  });

  factory OrganizationBatchScheduleSlot.fromJson(Map<String, Object?> json) {
    return OrganizationBatchScheduleSlot(
      day: _readString(json, 'day'),
      startTime: _readString(json, 'startTime', snakeKey: 'start_time'),
      endTime: _readString(json, 'endTime', snakeKey: 'end_time'),
    );
  }

  final String day;
  final String startTime;
  final String endTime;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'day': day.trim(),
      'startTime': startTime.trim(),
      'endTime': endTime.trim(),
    };
  }
}

class OrganizationCourseSummary {
  const OrganizationCourseSummary({
    required this.id,
    required this.slug,
    required this.title,
    required this.status,
    required this.deliveryType,
    required this.priceMinor,
    required this.currency,
    this.shortDescription,
    this.description,
    this.subject,
    this.instructorName,
    this.categoryName,
  });

  factory OrganizationCourseSummary.fromJson(Map<String, Object?> json) {
    final instructor = _readOptionalObject(json['instructor']);
    final category = _readOptionalObject(json['category']);

    return OrganizationCourseSummary(
      id: _readString(json, 'id'),
      slug: _readString(json, 'slug'),
      title: _readString(
        json,
        'title',
        fallback: _readString(json, 'titleAr', snakeKey: 'title_ar'),
      ),
      status: _readString(json, 'status', fallback: 'draft'),
      deliveryType: _readString(
        json,
        'deliveryType',
        snakeKey: 'delivery_type',
        fallback: 'offline',
      ),
      priceMinor: _readInt(json, 'priceMinor', snakeKey: 'price_minor'),
      currency: _readString(json, 'currency', fallback: 'EGP'),
      shortDescription: _readNullableString(
        json,
        'shortDescription',
        snakeKey: 'short_description',
      ),
      description: _readNullableString(json, 'description'),
      subject: _readNullableString(json, 'subject'),
      instructorName: _readNullableString(instructor, 'name'),
      categoryName: _readNullableString(category, 'name'),
    );
  }

  final String id;
  final String slug;
  final String title;
  final String status;
  final String deliveryType;
  final int priceMinor;
  final String currency;
  final String? shortDescription;
  final String? description;
  final String? subject;
  final String? instructorName;
  final String? categoryName;
}

class OrganizationBatchSummary {
  const OrganizationBatchSummary({
    required this.id,
    required this.courseId,
    required this.roomId,
    required this.title,
    required this.status,
    required this.deliveryType,
    required this.capacity,
    required this.reservedSeats,
    required this.confirmedSeats,
    this.schedule = const <OrganizationBatchScheduleSlot>[],
    this.startDate,
    this.endDate,
    this.roomName,
  });

  factory OrganizationBatchSummary.fromJson(Map<String, Object?> json) {
    final course = _readOptionalObject(json['course']);
    final room = _readOptionalObject(json['room']);

    return OrganizationBatchSummary(
      id: _readString(json, 'id'),
      courseId: _readString(
        json,
        'courseId',
        snakeKey: 'course_id',
        fallback: _readString(course, 'id'),
      ),
      roomId: _readString(
        json,
        'roomId',
        snakeKey: 'room_id',
        fallback: _readString(room, 'id'),
      ),
      title: _readString(
        json,
        'title',
        fallback: _readString(json, 'titleAr', snakeKey: 'title_ar'),
      ),
      status: _readString(json, 'status', fallback: 'draft'),
      deliveryType: _readString(
        json,
        'deliveryType',
        snakeKey: 'delivery_type',
        fallback: 'offline',
      ),
      capacity: _readInt(json, 'capacity'),
      reservedSeats: _readInt(
        json,
        'reservedSeats',
        snakeKey: 'reserved_seats',
      ),
      confirmedSeats: _readInt(
        json,
        'confirmedSeats',
        snakeKey: 'confirmed_seats',
      ),
      startDate: _readNullableString(json, 'startDate', snakeKey: 'start_date'),
      endDate: _readNullableString(json, 'endDate', snakeKey: 'end_date'),
      schedule: readJsonObjectList(
        json['schedule'],
      ).map(OrganizationBatchScheduleSlot.fromJson).toList(growable: false),
      roomName: _readNullableString(room, 'name'),
    );
  }

  final String id;
  final String courseId;
  final String roomId;
  final String title;
  final String status;
  final String deliveryType;
  final int capacity;
  final int reservedSeats;
  final int confirmedSeats;
  final List<OrganizationBatchScheduleSlot> schedule;
  final String? startDate;
  final String? endDate;
  final String? roomName;

  int get remainingSeats {
    final occupied = reservedSeats + confirmedSeats;
    return capacity - occupied < 0 ? 0 : capacity - occupied;
  }
}

Map<String, Object?> _readOptionalObject(Object? value) {
  if (value == null) {
    return const <String, Object?>{};
  }

  return readJsonObject(value);
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

import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationInstructorRepositoryProvider =
    Provider<OrganizationInstructorRepository>((ref) {
  return OrganizationInstructorRepository(dio: ref.watch(dioProvider));
});

class OrganizationInstructorRepository {
  const OrganizationInstructorRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<OrganizationInstructorsOverview> getOverview({
    required String organizationId,
    int perPage = 100,
  }) async {
    final responses = await Future.wait([
      _dio.get<Object?>(
        '/organizations/$organizationId/instructors',
        queryParameters: <String, Object?>{'perPage': perPage},
      ),
      _dio.get<Object?>(
        '/organizations/$organizationId/instructor-slots',
        queryParameters: <String, Object?>{'perPage': perPage},
      ),
    ]);
    final instructorEnvelope =
        ApiEnvelope<List<OrganizationInstructorSummary>>.fromJson(
      readJsonObject(responses[0].data),
      (value) => readJsonObjectList(value)
          .map(OrganizationInstructorSummary.fromJson)
          .toList(growable: false),
    );
    final slotEnvelope =
        ApiEnvelope<List<OrganizationInstructorSlotSummary>>.fromJson(
      readJsonObject(responses[1].data),
      (value) => readJsonObjectList(value)
          .map(OrganizationInstructorSlotSummary.fromJson)
          .toList(growable: false),
    );

    return OrganizationInstructorsOverview(
      instructors: instructorEnvelope.data,
      slots: slotEnvelope.data,
    );
  }

  Future<OrganizationInstructorSummary> createInstructor({
    required String organizationId,
    required CreateOrganizationInstructorCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/instructors',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationInstructorSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationInstructorSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationInstructorSummary> updateInstructor({
    required String organizationId,
    required String instructorId,
    required CreateOrganizationInstructorCommand command,
  }) async {
    final response = await _dio.put<Object?>(
      '/organizations/$organizationId/instructors/$instructorId',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationInstructorSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationInstructorSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationInstructorSlotSummary> createSlot({
    required String organizationId,
    required CreateOrganizationInstructorSlotCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/instructor-slots',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationInstructorSlotSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationInstructorSlotSummary.fromJson(
        readJsonObject(value),
      ),
    );

    return envelope.data;
  }
}

class OrganizationInstructorsOverview {
  const OrganizationInstructorsOverview({
    required this.instructors,
    required this.slots,
  });

  final List<OrganizationInstructorSummary> instructors;
  final List<OrganizationInstructorSlotSummary> slots;

  int get activeInstructorCount {
    return instructors.where((instructor) => instructor.isActive).length;
  }

  int get openSlotCount {
    return slots.where((slot) => slot.status == 'open').length;
  }

  List<OrganizationInstructorSlotSummary> slotsForInstructor(
    String instructorId,
  ) {
    return slots
        .where((slot) => slot.instructorId == instructorId)
        .toList(growable: false);
  }
}

class CreateOrganizationInstructorCommand {
  const CreateOrganizationInstructorCommand({
    required this.name,
    this.userId,
    this.nameAr,
    this.bio,
    this.bioAr,
    this.specialties = const <String>[],
    this.socialLinks = const <String>[],
    this.status = 'active',
  });

  final String name;
  final String? userId;
  final String? nameAr;
  final String? bio;
  final String? bioAr;
  final List<String> specialties;
  final List<String> socialLinks;
  final String status;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      if (_hasText(userId)) 'userId': userId!.trim(),
      'name': name.trim(),
      if (_hasText(nameAr)) 'nameAr': nameAr!.trim(),
      if (_hasText(bio)) 'bio': bio!.trim(),
      if (_hasText(bioAr)) 'bioAr': bioAr!.trim(),
      'specialties': specialties
          .map((item) => item.trim())
          .where(_hasText)
          .toList(growable: false),
      'socialLinks': socialLinks
          .map((item) => item.trim())
          .where(_hasText)
          .toList(growable: false),
      'status': status,
    };
  }
}

class CreateOrganizationInstructorSlotCommand {
  const CreateOrganizationInstructorSlotCommand({
    required this.instructorId,
    required this.startsAt,
    required this.endsAt,
    required this.priceMinor,
    this.deliveryType = 'online',
    this.location,
    this.currency = 'EGP',
  });

  final String instructorId;
  final String startsAt;
  final String endsAt;
  final int priceMinor;
  final String deliveryType;
  final String? location;
  final String currency;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'instructorId': instructorId,
      'startsAt': startsAt,
      'endsAt': endsAt,
      'deliveryType': deliveryType,
      'priceMinor': priceMinor,
      'currency': currency.trim().toUpperCase(),
      if (_hasText(location)) 'location': location!.trim(),
    };
  }
}

class OrganizationInstructorSummary {
  const OrganizationInstructorSummary({
    required this.id,
    required this.name,
    required this.status,
    required this.coursesCount,
    this.userId,
    this.nameAr,
    this.bio,
    this.bioAr,
    this.specialties = const <String>[],
    this.socialLinks = const <String>[],
  });

  factory OrganizationInstructorSummary.fromJson(Map<String, Object?> json) {
    return OrganizationInstructorSummary(
      id: _readString(json, 'id'),
      userId: _readNullableString(json, 'userId', snakeKey: 'user_id'),
      name: _readString(json, 'name'),
      nameAr: _readNullableString(json, 'nameAr', snakeKey: 'name_ar'),
      bio: _readNullableString(json, 'bio'),
      bioAr: _readNullableString(json, 'bioAr', snakeKey: 'bio_ar'),
      specialties: _readStringList(json['specialties']),
      socialLinks: _readStringList(json['socialLinks'] ?? json['social_links']),
      status: _readString(json, 'status', fallback: 'active'),
      coursesCount: _readInt(json, 'coursesCount', snakeKey: 'courses_count'),
    );
  }

  static OrganizationInstructorSummary? fromNullableJson(Object? value) {
    final json = _readNullableObject(value);
    return json == null ? null : OrganizationInstructorSummary.fromJson(json);
  }

  final String id;
  final String? userId;
  final String name;
  final String? nameAr;
  final String? bio;
  final String? bioAr;
  final List<String> specialties;
  final List<String> socialLinks;
  final String status;
  final int coursesCount;

  bool get isActive => status == 'active';

  String localizedName(bool isArabic) {
    return isArabic && _hasText(nameAr) ? nameAr! : name;
  }
}

class OrganizationInstructorSlotSummary {
  const OrganizationInstructorSlotSummary({
    required this.id,
    required this.instructorId,
    required this.startsAt,
    required this.endsAt,
    required this.deliveryType,
    required this.priceMinor,
    required this.currency,
    required this.status,
    this.location,
    this.instructor,
  });

  factory OrganizationInstructorSlotSummary.fromJson(
    Map<String, Object?> json,
  ) {
    final instructor = _readOptionalObject(json['instructor']);

    return OrganizationInstructorSlotSummary(
      id: _readString(json, 'id'),
      instructorId: _readString(
        json,
        'instructorId',
        snakeKey: 'instructor_id',
        fallback: _readString(instructor, 'id'),
      ),
      startsAt: _readString(json, 'startsAt', snakeKey: 'starts_at'),
      endsAt: _readString(json, 'endsAt', snakeKey: 'ends_at'),
      deliveryType: _readString(
        json,
        'deliveryType',
        snakeKey: 'delivery_type',
        fallback: 'online',
      ),
      location: _readNullableString(json, 'location'),
      priceMinor: _readInt(json, 'priceMinor', snakeKey: 'price_minor'),
      currency: _readString(json, 'currency', fallback: 'EGP'),
      status: _readString(json, 'status', fallback: 'open'),
      instructor: OrganizationInstructorSummary.fromNullableJson(instructor),
    );
  }

  final String id;
  final String instructorId;
  final String startsAt;
  final String endsAt;
  final String deliveryType;
  final String? location;
  final int priceMinor;
  final String currency;
  final String status;
  final OrganizationInstructorSummary? instructor;
}

Map<String, Object?> _readOptionalObject(Object? value) {
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

List<String> _readStringList(Object? value) {
  if (value is! List) {
    return const <String>[];
  }

  return value.map((item) => item.toString()).toList(growable: false);
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

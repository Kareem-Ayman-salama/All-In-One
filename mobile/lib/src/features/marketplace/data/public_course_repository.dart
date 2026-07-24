import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:ain_mobile/src/core/api/request_id.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final publicCourseRepositoryProvider = Provider<PublicCourseRepository>((ref) {
  return PublicCourseRepository(dio: ref.watch(dioProvider));
});

class PublicCourseRepository {
  const PublicCourseRepository({
    required Dio dio,
  }) : _dio = dio;

  final Dio _dio;

  Future<PublicCoursePage> listCourses({
    PublicCourseQuery query = const PublicCourseQuery(),
  }) async {
    final response = await _dio.get<Object?>(
      '/public/courses',
      queryParameters: query.toQueryParameters(),
    );
    final envelope = ApiEnvelope<List<PublicCourseSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(PublicCourseSummary.fromJson)
          .toList(growable: false),
    );

    return PublicCoursePage(
      courses: envelope.data,
      pagination: PublicCoursePagination.fromJson(envelope.meta),
    );
  }

  Future<PublicCourseSummary> getCourse(String courseIdOrSlug) async {
    final response = await _dio.get<Object?>('/public/courses/$courseIdOrSlug');
    final envelope = ApiEnvelope<PublicCourseSummary>.fromJson(
      readJsonObject(response.data),
      (value) => PublicCourseSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<PublicBookingResult> createBooking(
    PublicBookingCommand command,
  ) async {
    final response = await _dio.post<Object?>(
      '/public/bookings',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<PublicBookingResult>.fromJson(
      readJsonObject(response.data),
      (value) => PublicBookingResult.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class PublicCourseQuery {
  const PublicCourseQuery({
    this.search,
    this.categorySlug,
    this.deliveryType,
    this.sort = PublicCourseSort.newest,
    this.page = 1,
    this.perPage = 12,
  });

  final String? search;
  final String? categorySlug;
  final String? deliveryType;
  final PublicCourseSort sort;
  final int page;
  final int perPage;

  Map<String, Object?> toQueryParameters() {
    return <String, Object?>{
      if (_hasText(search)) 'search': search!.trim(),
      if (_hasText(categorySlug)) 'category': categorySlug!.trim(),
      if (_hasText(deliveryType)) 'deliveryType': deliveryType!.trim(),
      'sort': sort.apiValue,
      'page': page,
      'perPage': perPage,
    };
  }

  PublicCourseQuery copyWith({
    String? search,
    String? categorySlug,
    String? deliveryType,
    PublicCourseSort? sort,
    int? page,
    int? perPage,
  }) {
    return PublicCourseQuery(
      search: search ?? this.search,
      categorySlug: categorySlug ?? this.categorySlug,
      deliveryType: deliveryType ?? this.deliveryType,
      sort: sort ?? this.sort,
      page: page ?? this.page,
      perPage: perPage ?? this.perPage,
    );
  }

  @override
  bool operator ==(Object other) {
    return other is PublicCourseQuery &&
        other.search == search &&
        other.categorySlug == categorySlug &&
        other.deliveryType == deliveryType &&
        other.sort == sort &&
        other.page == page &&
        other.perPage == perPage;
  }

  @override
  int get hashCode => Object.hash(
        search,
        categorySlug,
        deliveryType,
        sort,
        page,
        perPage,
      );
}

enum PublicCourseSort {
  newest('newest'),
  priceAsc('price_asc'),
  priceDesc('price_desc'),
  startingSoon('starting_soon');

  const PublicCourseSort(this.apiValue);

  final String apiValue;
}

class PublicCoursePage {
  const PublicCoursePage({
    required this.courses,
    required this.pagination,
  });

  final List<PublicCourseSummary> courses;
  final PublicCoursePagination pagination;
}

class PublicCoursePagination {
  const PublicCoursePagination({
    required this.currentPage,
    required this.lastPage,
    required this.perPage,
    required this.total,
  });

  factory PublicCoursePagination.fromJson(Map<String, Object?> json) {
    return PublicCoursePagination(
      currentPage: _readInt(json['currentPage'], fallback: 1),
      lastPage: _readInt(json['lastPage'], fallback: 1),
      perPage: _readInt(json['perPage'], fallback: 12),
      total: _readInt(json['total'], fallback: 0),
    );
  }

  final int currentPage;
  final int lastPage;
  final int perPage;
  final int total;
}

class PublicCourseSummary {
  const PublicCourseSummary({
    required this.id,
    required this.slug,
    required this.title,
    required this.effectivePriceMinor,
    required this.currency,
    required this.status,
    required this.batches,
    this.organizationId,
    this.titleAr,
    this.shortDescription,
    this.shortDescriptionAr,
    this.coverUrl,
    this.educationLevel,
    this.subject,
    this.deliveryType,
    this.priceMinor,
    this.discountedPriceMinor,
    this.academy,
    this.instructor,
    this.category,
    this.publishedAt,
    this.description,
    this.descriptionAr,
    this.learningOutcomes = const <String>[],
    this.requirements = const <String>[],
    this.duration,
    this.sessionsCount,
  });

  factory PublicCourseSummary.fromJson(Map<String, Object?> json) {
    final priceMinor = _readOptionalInt(json['priceMinor']);
    final discountedPriceMinor = _readOptionalInt(json['discountedPriceMinor']);

    return PublicCourseSummary(
      id: json['id'].toString(),
      organizationId: json['organizationId']?.toString(),
      slug: json['slug'] as String? ?? json['id'].toString(),
      title: json['title'] as String? ?? '',
      titleAr: json['titleAr'] as String?,
      shortDescription: json['shortDescription'] as String?,
      shortDescriptionAr: json['shortDescriptionAr'] as String?,
      coverUrl: json['cover'] as String?,
      educationLevel: json['educationLevel'] as String?,
      subject: json['subject'] as String?,
      deliveryType: json['deliveryType'] as String?,
      priceMinor: priceMinor,
      discountedPriceMinor: discountedPriceMinor,
      effectivePriceMinor: _readInt(
        json['effectivePriceMinor'],
        fallback: discountedPriceMinor ?? priceMinor ?? 0,
      ),
      currency: json['currency'] as String? ?? 'EGP',
      status: json['status'] as String? ?? 'published',
      publishedAt: json['publishedAt'] as String?,
      academy: PublicCourseAcademy.fromNullableJson(json['academy']),
      instructor: PublicCourseInstructor.fromNullableJson(json['instructor']),
      category: PublicCourseCategory.fromNullableJson(json['category']),
      batches: _readObjectList(json['batches'])
          .map(PublicCourseBatch.fromJson)
          .toList(growable: false),
      description: json['description'] as String?,
      descriptionAr: json['descriptionAr'] as String?,
      learningOutcomes: _readStringList(json['learningOutcomes']),
      requirements: _readStringList(json['requirements']),
      duration: json['duration'] as String?,
      sessionsCount: _readOptionalInt(json['sessionsCount']),
    );
  }

  final String id;
  final String? organizationId;
  final String slug;
  final String title;
  final String? titleAr;
  final String? shortDescription;
  final String? shortDescriptionAr;
  final String? coverUrl;
  final String? educationLevel;
  final String? subject;
  final String? deliveryType;
  final int? priceMinor;
  final int? discountedPriceMinor;
  final int effectivePriceMinor;
  final String currency;
  final String status;
  final String? publishedAt;
  final PublicCourseAcademy? academy;
  final PublicCourseInstructor? instructor;
  final PublicCourseCategory? category;
  final List<PublicCourseBatch> batches;
  final String? description;
  final String? descriptionAr;
  final List<String> learningOutcomes;
  final List<String> requirements;
  final String? duration;
  final int? sessionsCount;

  String localizedTitle(bool isArabic) {
    return isArabic && _hasText(titleAr) ? titleAr! : title;
  }

  String localizedDescription(bool isArabic) {
    final localized = isArabic ? shortDescriptionAr : shortDescription;
    return _hasText(localized) ? localized! : shortDescription ?? '';
  }

  String localizedFullDescription(bool isArabic) {
    final localized = isArabic ? descriptionAr : description;
    if (_hasText(localized)) {
      return localized!;
    }
    return localizedDescription(isArabic);
  }

  PublicCourseBatch? get nextOpenBatch {
    for (final batch in batches) {
      if (batch.status == 'open') {
        return batch;
      }
    }
    return batches.isEmpty ? null : batches.first;
  }
}

class PublicBookingCommand {
  PublicBookingCommand({
    required this.courseId,
    required this.batchId,
    required this.studentName,
    required this.email,
    required this.phone,
    required this.termsAccepted,
    this.note,
    String? idempotencyKey,
  }) : idempotencyKey = idempotencyKey ?? RequestIdFactory().create();

  final String courseId;
  final String batchId;
  final String studentName;
  final String email;
  final String phone;
  final String? note;
  final bool termsAccepted;
  final String idempotencyKey;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'courseId': courseId,
      'batchId': batchId,
      'studentName': studentName.trim(),
      'email': email.trim(),
      'phone': phone.trim(),
      'termsAccepted': termsAccepted,
      'idempotencyKey': idempotencyKey,
      if (_hasText(note)) 'note': note!.trim(),
    };
  }
}

class PublicBookingResult {
  const PublicBookingResult({
    required this.bookingId,
    required this.nextPath,
  });

  factory PublicBookingResult.fromJson(Map<String, Object?> json) {
    final booking = readJsonObject(json['booking']);

    return PublicBookingResult(
      bookingId: booking['id'].toString(),
      nextPath: json['next'] as String? ?? '',
    );
  }

  final String bookingId;
  final String nextPath;
}

class PublicCourseAcademy {
  const PublicCourseAcademy({
    required this.id,
    required this.slug,
    required this.name,
    required this.verified,
    this.nameAr,
  });

  factory PublicCourseAcademy.fromJson(Map<String, Object?> json) {
    return PublicCourseAcademy(
      id: json['id'].toString(),
      slug: json['slug'] as String? ?? json['id'].toString(),
      name: json['name'] as String? ?? '',
      nameAr: json['nameAr'] as String?,
      verified: json['verified'] as bool? ?? false,
    );
  }

  static PublicCourseAcademy? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return PublicCourseAcademy.fromJson(readJsonObject(value));
  }

  final String id;
  final String slug;
  final String name;
  final String? nameAr;
  final bool verified;

  String localizedName(bool isArabic) {
    return isArabic && _hasText(nameAr) ? nameAr! : name;
  }
}

class PublicCourseInstructor {
  const PublicCourseInstructor({
    required this.id,
    required this.name,
    this.nameAr,
    this.photoUrl,
  });

  factory PublicCourseInstructor.fromJson(Map<String, Object?> json) {
    return PublicCourseInstructor(
      id: json['id'].toString(),
      name: json['name'] as String? ?? '',
      nameAr: json['nameAr'] as String?,
      photoUrl: json['photo'] as String?,
    );
  }

  static PublicCourseInstructor? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return PublicCourseInstructor.fromJson(readJsonObject(value));
  }

  final String id;
  final String name;
  final String? nameAr;
  final String? photoUrl;

  String localizedName(bool isArabic) {
    return isArabic && _hasText(nameAr) ? nameAr! : name;
  }
}

class PublicCourseCategory {
  const PublicCourseCategory({
    required this.id,
    required this.slug,
    required this.name,
    this.nameAr,
  });

  factory PublicCourseCategory.fromJson(Map<String, Object?> json) {
    return PublicCourseCategory(
      id: json['id'].toString(),
      slug: json['slug'] as String? ?? json['id'].toString(),
      name: json['name'] as String? ?? '',
      nameAr: json['nameAr'] as String?,
    );
  }

  static PublicCourseCategory? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return PublicCourseCategory.fromJson(readJsonObject(value));
  }

  final String id;
  final String slug;
  final String name;
  final String? nameAr;

  String localizedName(bool isArabic) {
    return isArabic && _hasText(nameAr) ? nameAr! : name;
  }
}

class PublicCourseBatch {
  const PublicCourseBatch({
    required this.id,
    required this.title,
    required this.capacity,
    required this.remainingSeats,
    required this.status,
    this.titleAr,
    this.startDate,
    this.endDate,
    this.schedule,
    this.deliveryType,
    this.location,
  });

  factory PublicCourseBatch.fromJson(Map<String, Object?> json) {
    return PublicCourseBatch(
      id: json['id'].toString(),
      title: json['title'] as String? ?? '',
      titleAr: json['titleAr'] as String?,
      startDate: json['startDate'] as String?,
      endDate: json['endDate'] as String?,
      schedule: json['schedule'] as String?,
      deliveryType: json['deliveryType'] as String?,
      capacity: _readInt(json['capacity'], fallback: 0),
      remainingSeats: _readInt(json['remainingSeats'], fallback: 0),
      location: json['location'] as String?,
      status: json['status'] as String? ?? '',
    );
  }

  final String id;
  final String title;
  final String? titleAr;
  final String? startDate;
  final String? endDate;
  final String? schedule;
  final String? deliveryType;
  final int capacity;
  final int remainingSeats;
  final String? location;
  final String status;

  String localizedTitle(bool isArabic) {
    return isArabic && _hasText(titleAr) ? titleAr! : title;
  }
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

int _readInt(Object? value, {required int fallback}) {
  return _readOptionalInt(value) ?? fallback;
}

int? _readOptionalInt(Object? value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value);
  }
  return null;
}

List<Map<String, Object?>> _readObjectList(Object? value) {
  if (value == null) {
    return const <Map<String, Object?>>[];
  }
  return readJsonObjectList(value);
}

List<String> _readStringList(Object? value) {
  if (value is! List) {
    return const <String>[];
  }
  return value.map((item) => item.toString()).toList(growable: false);
}

import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final lessonBookingRepositoryProvider = Provider<LessonBookingRepository>((
  ref,
) {
  return LessonBookingRepository(dio: ref.watch(dioProvider));
});

class LessonBookingRepository {
  const LessonBookingRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<LessonBookingCatalog> getCatalog({int perPage = 100}) async {
    final responses = await Future.wait([
      _dio.get<Object?>(
        '/public/instructors',
        queryParameters: <String, Object?>{'perPage': perPage},
      ),
      _dio.get<Object?>(
        '/student/lesson-bookings',
        queryParameters: <String, Object?>{'perPage': perPage},
      ),
    ]);
    final instructorEnvelope =
        ApiEnvelope<List<LessonInstructorSummary>>.fromJson(
      readJsonObject(responses[0].data),
      (value) => readJsonObjectList(
        value,
      ).map(LessonInstructorSummary.fromJson).toList(growable: false),
    );
    final bookingEnvelope = ApiEnvelope<List<LessonBookingSummary>>.fromJson(
      readJsonObject(responses[1].data),
      (value) => readJsonObjectList(
        value,
      ).map(LessonBookingSummary.fromJson).toList(growable: false),
    );

    return LessonBookingCatalog(
      instructors: instructorEnvelope.data,
      bookings: bookingEnvelope.data,
    );
  }

  Future<LessonBookingSummary> reserveLesson({
    required ReserveLessonBookingCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/student/lesson-bookings',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<LessonBookingSummary>.fromJson(
      readJsonObject(response.data),
      (value) => LessonBookingSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<LessonBookingSummary> cancelLesson(String bookingId) async {
    final response = await _dio.post<Object?>(
      '/student/lesson-bookings/$bookingId/cancel',
    );
    final envelope = ApiEnvelope<LessonBookingSummary>.fromJson(
      readJsonObject(response.data),
      (value) => LessonBookingSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class LessonBookingCatalog {
  const LessonBookingCatalog({
    required this.instructors,
    required this.bookings,
  });

  final List<LessonInstructorSummary> instructors;
  final List<LessonBookingSummary> bookings;

  int get availableSlotCount {
    return instructors.fold<int>(
      0,
      (total, instructor) => total + instructor.openSlots.length,
    );
  }
}

class ReserveLessonBookingCommand {
  const ReserveLessonBookingCommand({
    required this.slotId,
    required this.subject,
    required this.studentPhone,
    this.note,
  });

  final String slotId;
  final String subject;
  final String studentPhone;
  final String? note;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'slotId': slotId,
      'subject': subject.trim(),
      'studentPhone': studentPhone.trim(),
      if (_hasText(note)) 'note': note!.trim(),
    };
  }
}

class LessonInstructorSummary {
  const LessonInstructorSummary({
    required this.id,
    required this.name,
    this.nameAr,
    this.bio,
    this.bioAr,
    this.specialties = const <String>[],
    this.availabilitySlots = const <LessonAvailabilitySlot>[],
  });

  factory LessonInstructorSummary.fromJson(Map<String, Object?> json) {
    return LessonInstructorSummary(
      id: _readString(json, 'id'),
      name: _readString(json, 'name'),
      nameAr: _readNullableString(json, 'nameAr', snakeKey: 'name_ar'),
      bio: _readNullableString(json, 'bio'),
      bioAr: _readNullableString(json, 'bioAr', snakeKey: 'bio_ar'),
      specialties: _readStringList(json['specialties']),
      availabilitySlots: readJsonObjectList(
        json['availabilitySlots'] ?? json['availability_slots'],
      ).map(LessonAvailabilitySlot.fromJson).toList(growable: false),
    );
  }

  static LessonInstructorSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return LessonInstructorSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String name;
  final String? nameAr;
  final String? bio;
  final String? bioAr;
  final List<String> specialties;
  final List<LessonAvailabilitySlot> availabilitySlots;

  List<LessonAvailabilitySlot> get openSlots {
    return availabilitySlots
        .where((slot) => slot.status == 'open')
        .toList(growable: false);
  }

  String localizedName(bool isArabic) {
    return isArabic && _hasText(nameAr) ? nameAr! : name;
  }

  String? localizedBio(bool isArabic) {
    return isArabic && _hasText(bioAr) ? bioAr : bio;
  }
}

class LessonAvailabilitySlot {
  const LessonAvailabilitySlot({
    required this.id,
    required this.startsAt,
    required this.endsAt,
    required this.deliveryType,
    required this.priceMinor,
    required this.currency,
    required this.status,
    this.location,
  });

  factory LessonAvailabilitySlot.fromJson(Map<String, Object?> json) {
    return LessonAvailabilitySlot(
      id: _readString(json, 'id'),
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
    );
  }

  static LessonAvailabilitySlot? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return LessonAvailabilitySlot.fromJson(readJsonObject(value));
  }

  final String id;
  final String startsAt;
  final String endsAt;
  final String deliveryType;
  final String? location;
  final int priceMinor;
  final String currency;
  final String status;
}

class LessonBookingSummary {
  const LessonBookingSummary({
    required this.id,
    required this.subject,
    required this.status,
    required this.paymentStatus,
    required this.amountMinor,
    required this.currency,
    this.studentPhone,
    this.studentNote,
    this.instructor,
    this.slot,
  });

  factory LessonBookingSummary.fromJson(Map<String, Object?> json) {
    return LessonBookingSummary(
      id: _readString(json, 'id'),
      subject: _readString(json, 'subject'),
      studentPhone: _readNullableString(
        json,
        'studentPhone',
        snakeKey: 'student_phone',
      ),
      studentNote: _readNullableString(
        json,
        'studentNote',
        snakeKey: 'student_note',
      ),
      status: _readString(json, 'status', fallback: 'confirmed'),
      paymentStatus: _readString(
        json,
        'paymentStatus',
        snakeKey: 'payment_status',
        fallback: 'unpaid',
      ),
      amountMinor: _readInt(json, 'amountMinor', snakeKey: 'amount_minor'),
      currency: _readString(json, 'currency', fallback: 'EGP'),
      instructor: LessonInstructorSummary.fromNullableJson(json['instructor']),
      slot: LessonAvailabilitySlot.fromNullableJson(json['slot']),
    );
  }

  final String id;
  final String subject;
  final String? studentPhone;
  final String? studentNote;
  final String status;
  final String paymentStatus;
  final int amountMinor;
  final String currency;
  final LessonInstructorSummary? instructor;
  final LessonAvailabilitySlot? slot;

  bool get canCancel => status == 'confirmed';
}

List<String> _readStringList(Object? value) {
  if (value is! List) {
    return const <String>[];
  }

  return value.map((item) => item.toString()).toList(growable: false);
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

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

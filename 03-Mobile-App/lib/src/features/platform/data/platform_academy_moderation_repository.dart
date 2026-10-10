import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformAcademyModerationRepositoryProvider =
    Provider<PlatformAcademyModerationRepository>((ref) {
  return PlatformAcademyModerationRepository(dio: ref.watch(dioProvider));
});

class PlatformAcademyModerationRepository {
  const PlatformAcademyModerationRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<PlatformAcademyModerationSummary>> listAcademies({
    String status = 'pending',
    int perPage = 30,
  }) async {
    final response = await _dio.get<Object?>(
      '/admin/academies',
      queryParameters: <String, Object?>{
        'status': status,
        'perPage': perPage,
      },
    );
    final envelope =
        ApiEnvelope<List<PlatformAcademyModerationSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(PlatformAcademyModerationSummary.fromJson)
          .toList(growable: false),
    );

    return envelope.data;
  }

  Future<PlatformAcademyModerationSummary> verifyAcademy({
    required String academyId,
    String? note,
  }) {
    return _moderate(
      path: '/admin/academies/$academyId/verify',
      note: note,
    );
  }

  Future<PlatformAcademyModerationSummary> rejectAcademy({
    required String academyId,
    required String note,
  }) {
    return _moderate(
      path: '/admin/academies/$academyId/reject',
      note: note,
    );
  }

  Future<PlatformAcademyModerationSummary> _moderate({
    required String path,
    String? note,
  }) async {
    final response = await _dio.post<Object?>(
      path,
      data: <String, Object?>{
        if (_hasText(note)) 'note': note!.trim(),
      },
    );
    final envelope = ApiEnvelope<PlatformAcademyModerationSummary>.fromJson(
      readJsonObject(response.data),
      (value) => PlatformAcademyModerationSummary.fromJson(
        readJsonObject(value),
      ),
    );

    return envelope.data;
  }
}

class PlatformAcademyModerationSummary {
  const PlatformAcademyModerationSummary({
    required this.id,
    required this.slug,
    required this.publicName,
    required this.description,
    required this.verificationStatus,
    required this.isPublic,
    required this.organizationName,
    this.publicNameAr,
    this.phone,
    this.email,
    this.website,
    this.location,
    this.verifiedAt,
  });

  factory PlatformAcademyModerationSummary.fromJson(
    Map<String, Object?> json,
  ) {
    final organization = _readObject(json['organization']);

    return PlatformAcademyModerationSummary(
      id: _readString(json, 'id'),
      slug: _readString(json, 'slug'),
      publicName: _readString(
        json,
        'publicName',
        snakeKey: 'public_name',
      ),
      publicNameAr: _readNullableString(
        json,
        'publicNameAr',
        snakeKey: 'public_name_ar',
      ),
      description: _readString(json, 'description'),
      phone: _readNullableString(json, 'phone'),
      email: _readNullableString(json, 'email'),
      website: _readNullableString(json, 'website'),
      location: _readNullableString(json, 'location'),
      verificationStatus: _readString(
        json,
        'verificationStatus',
        snakeKey: 'verification_status',
        fallback: 'pending',
      ),
      isPublic: _readBool(json, 'isPublic', snakeKey: 'is_public'),
      verifiedAt: _readNullableString(
        json,
        'verifiedAt',
        snakeKey: 'verified_at',
      ),
      organizationName: _readString(organization, 'name'),
    );
  }

  final String id;
  final String slug;
  final String publicName;
  final String? publicNameAr;
  final String description;
  final String? phone;
  final String? email;
  final String? website;
  final String? location;
  final String verificationStatus;
  final bool isPublic;
  final String? verifiedAt;
  final String organizationName;
}

class PlatformAcademyModerationCommand {
  const PlatformAcademyModerationCommand({
    required this.academyId,
    this.note,
  });

  final String academyId;
  final String? note;
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
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);

  return value?.toString() ?? fallback;
}

String? _readNullableString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);

  return value?.toString();
}

bool _readBool(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value is bool) {
    return value;
  }

  return value?.toString() == '1' || value?.toString() == 'true';
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

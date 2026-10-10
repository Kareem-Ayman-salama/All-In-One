import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformCategoryRepositoryProvider =
    Provider<PlatformCategoryRepository>((ref) {
  return PlatformCategoryRepository(dio: ref.watch(dioProvider));
});

class PlatformCategoryRepository {
  const PlatformCategoryRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<PlatformCategorySummary>> listCategories() async {
    final response = await _dio.get<Object?>('/admin/categories');
    final envelope = ApiEnvelope<List<PlatformCategorySummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(PlatformCategorySummary.fromJson)
          .toList(growable: false),
    );

    return envelope.data;
  }

  Future<PlatformCategorySummary> createCategory(
    PlatformCategoryCommand command,
  ) async {
    final response = await _dio.post<Object?>(
      '/admin/categories',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<PlatformCategorySummary>.fromJson(
      readJsonObject(response.data),
      (value) => PlatformCategorySummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<PlatformCategorySummary> updateCategory(
    PlatformCategoryCommand command,
  ) async {
    final response = await _dio.put<Object?>(
      '/admin/categories/${command.categoryId}',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<PlatformCategorySummary>.fromJson(
      readJsonObject(response.data),
      (value) => PlatformCategorySummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> deleteCategory(String categoryId) async {
    await _dio.delete<Object?>('/admin/categories/$categoryId');
  }
}

class PlatformCategorySummary {
  const PlatformCategorySummary({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.slug,
    required this.active,
    required this.sortOrder,
    required this.coursesCount,
    this.parentId,
  });

  factory PlatformCategorySummary.fromJson(Map<String, Object?> json) {
    return PlatformCategorySummary(
      id: _readString(json, 'id'),
      parentId: _readNullableString(json, 'parentId', snakeKey: 'parent_id'),
      name: _readString(json, 'name'),
      nameAr: _readString(json, 'nameAr', snakeKey: 'name_ar'),
      slug: _readString(json, 'slug'),
      active: _readBool(json, 'active', fallback: true),
      sortOrder: _readInt(json, 'sortOrder', snakeKey: 'sort_order'),
      coursesCount: _readInt(
        json,
        'coursesCount',
        snakeKey: 'courses_count',
      ),
    );
  }

  final String id;
  final String? parentId;
  final String name;
  final String nameAr;
  final String slug;
  final bool active;
  final int sortOrder;
  final int coursesCount;

  bool get canDelete => coursesCount == 0;
}

class PlatformCategoryCommand {
  const PlatformCategoryCommand({
    required this.name,
    required this.nameAr,
    required this.active,
    required this.sortOrder,
    this.categoryId,
    this.parentId,
    this.slug,
  });

  final String? categoryId;
  final String? parentId;
  final String name;
  final String nameAr;
  final String? slug;
  final bool active;
  final int sortOrder;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      if (_hasText(parentId)) 'parentId': parentId,
      'name': name.trim(),
      'nameAr': nameAr.trim(),
      if (_hasText(slug)) 'slug': slug!.trim(),
      'active': active,
      'sortOrder': sortOrder,
    };
  }
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

  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

bool _readBool(
  Map<String, Object?> json,
  String key, {
  bool fallback = false,
}) {
  final value = json[key];
  if (value is bool) {
    return value;
  }

  return value == null
      ? fallback
      : value.toString() == '1' || value.toString() == 'true';
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

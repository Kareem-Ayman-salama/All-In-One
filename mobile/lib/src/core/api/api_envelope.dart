class ApiEnvelope<T> {
  const ApiEnvelope({
    required this.data,
    required this.requestId,
    this.meta = const <String, Object?>{},
  });

  final T data;
  final String requestId;
  final Map<String, Object?> meta;

  static ApiEnvelope<T> fromJson<T>(
    Map<String, Object?> json,
    T Function(Object? value) readData,
  ) {
    return ApiEnvelope<T>(
      data: readData(json['data']),
      meta: _readObject(json['meta']),
      requestId: json['requestId'] as String? ?? '',
    );
  }

  static Map<String, Object?> _readObject(Object? value) {
    if (value is Map<String, Object?>) {
      return value;
    }
    if (value is Map) {
      return value.map((key, entry) => MapEntry(key.toString(), entry));
    }
    return const <String, Object?>{};
  }
}

Map<String, Object?> readJsonObject(Object? value) {
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, entry) => MapEntry(key.toString(), entry));
  }
  throw const FormatException('Expected JSON object.');
}

List<Map<String, Object?>> readJsonObjectList(Object? value) {
  if (value is! List) {
    throw const FormatException('Expected JSON array.');
  }

  return value.map(readJsonObject).toList(growable: false);
}

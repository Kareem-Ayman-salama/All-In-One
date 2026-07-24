class ApiError implements Exception {
  const ApiError({
    required this.code,
    required this.message,
    required this.retryable,
    this.messageAr,
    this.requestId,
    this.category,
    this.details = const <String, Object?>{},
  });

  final String code;
  final String message;
  final String? messageAr;
  final String? requestId;
  final String? category;
  final bool retryable;
  final Map<String, Object?> details;

  @override
  String toString() => 'ApiError(code: $code, message: $message)';
}

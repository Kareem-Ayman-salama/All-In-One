class PrivacyRedactor {
  const PrivacyRedactor();

  static const sensitiveKeys = <String>{
    'accessToken',
    'refreshToken',
    'authorization',
    'password',
    'token',
    'signedUrl',
    'url',
    'fileContent',
    'studentEmail',
    'studentPhone',
    'privateNote',
  };

  Map<String, Object?> redact(Map<String, Object?> input) {
    return input.map((key, value) {
      if (_isSensitiveKey(key)) {
        return MapEntry(key, '[REDACTED]');
      }

      return MapEntry(key, _redactValue(value));
    });
  }

  Object? _redactValue(Object? value) {
    if (value is Map<String, Object?>) {
      return redact(value);
    }
    if (value is Map) {
      return redact(
        value.map((key, entry) => MapEntry(key.toString(), entry)),
      );
    }
    if (value is List) {
      return value.map(_redactValue).toList(growable: false);
    }
    if (value is Uri) {
      return '[REDACTED_URI]';
    }
    if (value is String && _looksLikeSecret(value)) {
      return '[REDACTED]';
    }

    return value;
  }

  bool _isSensitiveKey(String key) {
    final normalized = key.toLowerCase();
    return sensitiveKeys.any((sensitive) {
      return normalized == sensitive.toLowerCase() ||
          normalized.contains(sensitive.toLowerCase());
    });
  }

  bool _looksLikeSecret(String value) {
    return value.startsWith('Bearer ') ||
        value.contains('/content-view/') ||
        value.contains('signature=') ||
        value.contains('X-Amz-Signature=') ||
        value.length > 512;
  }
}


import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses typed API envelopes and request metadata', () {
    final envelope = ApiEnvelope<String>.fromJson(<String, Object?>{
      'data': 'ready',
      'meta': <String, Object?>{'page': 1},
      'requestId': 'request-123',
    }, (value) => value as String);

    expect(envelope.data, 'ready');
    expect(envelope.meta, <String, Object?>{'page': 1});
    expect(envelope.requestId, 'request-123');
  });

  test('rejects non-object JSON payloads', () {
    expect(
      () => readJsonObject(<Object?>['not-an-object']),
      throwsA(isA<FormatException>()),
    );
  });
}

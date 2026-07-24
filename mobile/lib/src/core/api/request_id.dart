import 'dart:math';

class RequestIdFactory {
  RequestIdFactory({
    Random? random,
  }) : _random = random ?? Random.secure();

  final Random _random;

  String create() {
    final bytes = List<int>.generate(
      16,
      (_) => _random.nextInt(256),
      growable: false,
    );

    return bytes.map((value) => value.toRadixString(16).padLeft(2, '0')).join();
  }
}


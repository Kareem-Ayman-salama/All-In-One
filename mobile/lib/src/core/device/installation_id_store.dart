import 'dart:math';

import 'package:ain_mobile/src/core/auth/secure_token_store.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final installationIdProvider = FutureProvider<String>((ref) async {
  final tokenStore = ref.watch(secureTokenStoreProvider);
  final existing = await tokenStore.readInstallationId();
  if (existing != null && existing.isNotEmpty) {
    return existing;
  }

  final random = Random.secure();
  final generated = List<int>.generate(
    16,
    (_) => random.nextInt(256),
    growable: false,
  ).map((value) => value.toRadixString(16).padLeft(2, '0')).join();
  final installationId = 'ain-$generated';
  await tokenStore.writeInstallationId(installationId);

  return installationId;
});

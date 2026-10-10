import 'package:ain_mobile/src/core/device/installation_id_store.dart';
import 'package:ain_mobile/src/features/devices/data/device_repository.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final pushRegistrationServiceProvider = Provider<PushRegistrationService>((
  ref,
) {
  return PushRegistrationService(
    deviceRepository: ref.watch(deviceRepositoryProvider),
    installationIdReader: () => ref.read(installationIdProvider.future),
  );
});

class PushRegistrationService {
  const PushRegistrationService({
    required DeviceRepository deviceRepository,
    required Future<String> Function() installationIdReader,
  })  : _deviceRepository = deviceRepository,
        _installationIdReader = installationIdReader;

  final DeviceRepository _deviceRepository;
  final Future<String> Function() _installationIdReader;

  Future<void> registerFcmToken({
    required String token,
    String? deviceName,
    String? appVersion,
  }) async {
    final installationId = await _installationIdReader();
    await _deviceRepository.registerPushToken(
      PushDeviceTokenCommand(
        token: token,
        platform: _mobilePlatformName(),
        installationId: installationId,
        deviceName: deviceName,
        appVersion: appVersion,
      ),
    );
  }

  Future<void> revokeCurrentInstallation() async {
    final installationId = await _installationIdReader();
    await _deviceRepository.revokePushToken(installationId: installationId);
  }

  String _mobilePlatformName() {
    return switch (defaultTargetPlatform) {
      TargetPlatform.iOS => 'ios',
      TargetPlatform.android => 'android',
      _ => 'web',
    };
  }
}

import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final deviceRepositoryProvider = Provider<DeviceRepository>((ref) {
  return DeviceRepository(dio: ref.watch(dioProvider));
});

class DeviceRepository {
  const DeviceRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<PushDeviceToken> registerPushToken(
    PushDeviceTokenCommand command,
  ) async {
    final response = await _dio.post<Object?>(
      '/devices/push-tokens',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<PushDeviceToken>.fromJson(
      readJsonObject(response.data),
      (value) => PushDeviceToken.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> revokePushToken({String? token, String? installationId}) async {
    await _dio.delete<Object?>(
      '/devices/push-tokens',
      data: <String, Object?>{
        if (token != null) 'token': token,
        if (installationId != null) 'installationId': installationId,
      },
    );
  }
}

class PushDeviceTokenCommand {
  const PushDeviceTokenCommand({
    required this.token,
    required this.platform,
    required this.installationId,
    this.provider = 'fcm',
    this.deviceName,
    this.appVersion,
  });

  final String token;
  final String provider;
  final String platform;
  final String installationId;
  final String? deviceName;
  final String? appVersion;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'token': token,
      'provider': provider,
      'platform': platform,
      'installationId': installationId,
      if (deviceName != null) 'deviceName': deviceName,
      if (appVersion != null) 'appVersion': appVersion,
    };
  }
}

class PushDeviceToken {
  const PushDeviceToken({
    required this.id,
    required this.provider,
    required this.platform,
    required this.installationId,
    this.deviceName,
    this.appVersion,
    this.lastRegisteredAt,
  });

  factory PushDeviceToken.fromJson(Map<String, Object?> json) {
    return PushDeviceToken(
      id: json['id'].toString(),
      provider: json['provider'] as String? ?? 'fcm',
      platform: json['platform'] as String? ?? '',
      installationId: json['installationId'] as String? ?? '',
      deviceName: json['deviceName'] as String?,
      appVersion: json['appVersion'] as String?,
      lastRegisteredAt: json['lastRegisteredAt'] as String?,
    );
  }

  final String id;
  final String provider;
  final String platform;
  final String installationId;
  final String? deviceName;
  final String? appVersion;
  final String? lastRegisteredAt;
}

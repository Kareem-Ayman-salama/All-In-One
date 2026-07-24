import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:ain_mobile/src/core/auth/secure_token_store.dart';
import 'package:ain_mobile/src/core/auth/token_refresh_coordinator.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    dio: ref.watch(dioProvider),
    tokenStore: ref.watch(secureTokenStoreProvider),
  );
});

class AuthRepository {
  const AuthRepository({
    required Dio dio,
    required SecureTokenStore tokenStore,
  })  : _dio = dio,
        _tokenStore = tokenStore;

  final Dio _dio;
  final SecureTokenStore _tokenStore;

  Future<AuthSession> login(LoginCommand command) async {
    final response = await _dio.post<Object?>(
      '/auth/login',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<AuthSession>.fromJson(
      readJsonObject(response.data),
      (value) => AuthSession.fromJson(readJsonObject(value)),
    );

    await _persistSession(envelope.data);

    return envelope.data;
  }

  Future<RegistrationResult> register(RegisterCommand command) async {
    final response = await _dio.post<Object?>(
      '/auth/register',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<RegistrationResult>.fromJson(
      readJsonObject(response.data),
      (value) => RegistrationResult.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<AuthSession> verifyEmail(EmailCodeCommand command) async {
    final response = await _dio.post<Object?>(
      '/auth/verify-email',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<AuthSession>.fromJson(
      readJsonObject(response.data),
      (value) => AuthSession.fromJson(readJsonObject(value)),
    );

    await _persistSession(envelope.data);

    return envelope.data;
  }

  Future<AcceptedDeliveryResult> resendVerification(String email) async {
    return _postAcceptedDelivery(
      '/auth/resend-verification',
      data: <String, Object?>{'email': _normalizeEmail(email)},
    );
  }

  Future<AcceptedDeliveryResult> requestPasswordReset(String email) async {
    return _postAcceptedDelivery(
      '/auth/forgot-password',
      data: <String, Object?>{'email': _normalizeEmail(email)},
    );
  }

  Future<PasswordResetResult> resetPassword(
    ResetPasswordCommand command,
  ) async {
    final response = await _dio.post<Object?>(
      '/auth/reset-password',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<PasswordResetResult>.fromJson(
      readJsonObject(response.data),
      (value) => PasswordResetResult.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<InvitationPreview> previewInvitation(String token) async {
    final response = await _dio.get<Object?>(
      '/public/invitations/${Uri.encodeComponent(token)}',
    );
    final envelope = ApiEnvelope<InvitationPreview>.fromJson(
      readJsonObject(response.data),
      (value) => InvitationPreview.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<InvitationAcceptance> acceptInvitation(String token) async {
    final response = await _dio.post<Object?>(
      '/invitations/accept',
      data: <String, Object?>{'token': token},
    );
    final envelope = ApiEnvelope<InvitationAcceptance>.fromJson(
      readJsonObject(response.data),
      (value) => InvitationAcceptance.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> logout() async {
    await _dio.post<Object?>('/auth/logout');
    await _tokenStore.clearSession();
  }

  Future<AuthSession?> refreshSession() async {
    final refreshToken = await _tokenStore.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      await _tokenStore.clearSession();
      return null;
    }

    final response = await _dio.post<Object?>(
      '/auth/refresh',
      data: <String, Object?>{
        'refreshToken': refreshToken,
      },
      options: Options(
        extra: const <String, Object?>{
          TokenRefreshCoordinator.skipRefreshExtraKey: true,
        },
      ),
    );
    final envelope = ApiEnvelope<AuthSession>.fromJson(
      readJsonObject(response.data),
      (value) => AuthSession.fromJson(readJsonObject(value)),
    );

    await _persistSession(envelope.data);

    return envelope.data;
  }

  Future<AcceptedDeliveryResult> _postAcceptedDelivery(
    String path, {
    required Map<String, Object?> data,
  }) async {
    final response = await _dio.post<Object?>(path, data: data);
    final envelope = ApiEnvelope<AcceptedDeliveryResult>.fromJson(
      readJsonObject(response.data),
      (value) => AcceptedDeliveryResult.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> _persistSession(AuthSession session) async {
    await _tokenStore.writeTokens(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );
  }
}

class LoginCommand {
  const LoginCommand({
    required this.email,
    required this.password,
    this.deviceName,
    this.installationId,
    this.platform,
    this.appVersion,
  });

  final String email;
  final String password;
  final String? deviceName;
  final String? installationId;
  final String? platform;
  final String? appVersion;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'email': email,
      'password': password,
      if (deviceName != null) 'deviceName': deviceName,
      if (installationId != null) 'installationId': installationId,
      if (platform != null) 'platform': platform,
      if (appVersion != null) 'appVersion': appVersion,
    };
  }
}

class RegisterCommand {
  const RegisterCommand({
    required this.name,
    required this.email,
    required this.password,
    required this.passwordConfirmation,
  });

  final String name;
  final String email;
  final String password;
  final String passwordConfirmation;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'name': name.trim(),
      'email': _normalizeEmail(email),
      'password': password,
      'password_confirmation': passwordConfirmation,
    };
  }
}

class EmailCodeCommand {
  const EmailCodeCommand({
    required this.email,
    required this.code,
  });

  final String email;
  final String code;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'email': _normalizeEmail(email),
      'code': code.trim(),
    };
  }
}

class ResetPasswordCommand {
  const ResetPasswordCommand({
    required this.email,
    required this.code,
    required this.password,
    required this.passwordConfirmation,
  });

  final String email;
  final String code;
  final String password;
  final String passwordConfirmation;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'email': _normalizeEmail(email),
      'code': code.trim(),
      'password': password,
      'password_confirmation': passwordConfirmation,
    };
  }
}

class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthSession.fromJson(Map<String, Object?> json) {
    return AuthSession(
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      user: readJsonObject(json['user']),
    );
  }

  final String accessToken;
  final String refreshToken;
  final Map<String, Object?> user;
}

class RegistrationResult {
  const RegistrationResult({
    required this.user,
    required this.delivery,
    this.debugCode,
  });

  factory RegistrationResult.fromJson(Map<String, Object?> json) {
    return RegistrationResult(
      user: readJsonObject(json['user']),
      delivery: json['delivery'] as String? ?? 'email',
      debugCode: json['debugCode'] as String?,
    );
  }

  final Map<String, Object?> user;
  final String delivery;
  final String? debugCode;
}

class AcceptedDeliveryResult {
  const AcceptedDeliveryResult({
    required this.accepted,
    required this.delivery,
    this.debugCode,
  });

  factory AcceptedDeliveryResult.fromJson(Map<String, Object?> json) {
    return AcceptedDeliveryResult(
      accepted: json['accepted'] as bool? ?? false,
      delivery: json['delivery'] as String? ?? 'email',
      debugCode: json['debugCode'] as String?,
    );
  }

  final bool accepted;
  final String delivery;
  final String? debugCode;
}

class PasswordResetResult {
  const PasswordResetResult({required this.passwordChanged});

  factory PasswordResetResult.fromJson(Map<String, Object?> json) {
    return PasswordResetResult(
      passwordChanged: json['passwordChanged'] as bool? ?? false,
    );
  }

  final bool passwordChanged;
}

class InvitationPreview {
  const InvitationPreview({
    required this.organization,
    required this.role,
    required this.status,
    required this.expiresAt,
    this.rooms = const <Map<String, Object?>>[],
    this.inviter,
    this.note,
  });

  factory InvitationPreview.fromJson(Map<String, Object?> json) {
    return InvitationPreview(
      organization: readJsonObject(json['organization']),
      role: json['role'] as String? ?? '',
      status: json['status'] as String? ?? '',
      expiresAt: json['expiresAt'] as String? ?? '',
      rooms: readJsonObjectList(json['rooms']),
      inviter: json['inviter'] == null ? null : readJsonObject(json['inviter']),
      note: json['note'] as String?,
    );
  }

  final Map<String, Object?> organization;
  final String role;
  final String status;
  final String expiresAt;
  final List<Map<String, Object?>> rooms;
  final Map<String, Object?>? inviter;
  final String? note;
}

class InvitationAcceptance {
  const InvitationAcceptance({
    required this.membershipId,
    required this.organization,
    required this.role,
    required this.permissions,
    required this.next,
  });

  factory InvitationAcceptance.fromJson(Map<String, Object?> json) {
    return InvitationAcceptance(
      membershipId: json['membershipId']?.toString() ?? '',
      organization: readJsonObject(json['organization']),
      role: json['role'] as String? ?? '',
      permissions: _readJsonArray(json['permissions'])
          .map((value) => value.toString())
          .toList(growable: false),
      next: json['next'] as String? ?? '',
    );
  }

  final String membershipId;
  final Map<String, Object?> organization;
  final String role;
  final List<String> permissions;
  final String next;
}

String _normalizeEmail(String value) {
  return value.trim().toLowerCase();
}

List<Object?> _readJsonArray(Object? value) {
  if (value is List) {
    return value;
  }

  return const <Object?>[];
}

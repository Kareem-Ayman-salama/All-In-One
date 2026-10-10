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
  const AuthRepository({required Dio dio, required SecureTokenStore tokenStore})
      : _dio = dio,
        _tokenStore = tokenStore;

  final Dio _dio;
  final SecureTokenStore _tokenStore;

  Future<LoginResult> login(LoginCommand command) async {
    final response = await _dio.post<Object?>(
      '/auth/login',
      data: command.toJson(),
    );
    final rawData = readJsonObject(readJsonObject(response.data)['data']);
    final isMfaRequired = rawData['mfaRequired'] as bool? ?? false;

    if (isMfaRequired) {
      return LoginResult(
        mfaRequired: true,
        mfaMethod: rawData['method']?.toString() ?? 'email_otp',
        mfaExpiresInSeconds:
            (rawData['expiresInSeconds'] as num?)?.toInt() ?? 900,
        debugCode: rawData['debugCode']?.toString(),
      );
    }

    final session = AuthSession.fromJson(rawData);
    await _persistSession(session);

    return LoginResult(session: session);
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String newPasswordConfirmation,
  }) async {
    await _dio.post<Object?>(
      '/auth/change-password',
      data: <String, Object?>{
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'newPassword_confirmation': newPasswordConfirmation,
      },
    );
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

  Future<CurrentUserProfile> currentUser() async {
    final response = await _dio.get<Object?>('/auth/me');
    final envelope = ApiEnvelope<CurrentUserProfile>.fromJson(
      readJsonObject(response.data),
      (value) => CurrentUserProfile.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<CurrentUserProfile> updateProfile(
    UpdateUserProfileCommand command,
  ) async {
    final response = await _dio.patch<Object?>(
      '/auth/me',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<CurrentUserProfile>.fromJson(
      readJsonObject(response.data),
      (value) => CurrentUserProfile.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<List<UserSessionSummary>> listSessions() async {
    final response = await _dio.get<Object?>('/auth/sessions');
    final envelope = ApiEnvelope<List<UserSessionSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(
        value,
      ).map(UserSessionSummary.fromJson).toList(growable: false),
    );

    return envelope.data;
  }

  Future<void> revokeSession(String sessionId) async {
    await _dio.delete<Object?>(
      '/auth/sessions/${Uri.encodeComponent(sessionId)}',
    );
  }

  Future<void> revokeOtherSessions() async {
    await _dio.delete<Object?>('/auth/sessions/others');
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
      data: <String, Object?>{'refreshToken': refreshToken},
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
    this.mfaCode,
  });

  final String email;
  final String password;
  final String? deviceName;
  final String? installationId;
  final String? platform;
  final String? appVersion;
  final String? mfaCode;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'email': email,
      'password': password,
      if (deviceName != null) 'deviceName': deviceName,
      if (installationId != null) 'installationId': installationId,
      if (platform != null) 'platform': platform,
      if (appVersion != null) 'appVersion': appVersion,
      if (mfaCode != null && mfaCode!.trim().isNotEmpty)
        'mfaCode': mfaCode!.trim(),
    };
  }
}

class LoginResult {
  const LoginResult({
    this.session,
    this.mfaRequired = false,
    this.mfaMethod,
    this.mfaExpiresInSeconds,
    this.debugCode,
  });

  final AuthSession? session;
  final bool mfaRequired;
  final String? mfaMethod;
  final int? mfaExpiresInSeconds;
  final String? debugCode;

  bool get isAuthenticated =>
      session != null && session!.accessToken.isNotEmpty;
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
  const EmailCodeCommand({required this.email, required this.code});

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

class UpdateUserProfileCommand {
  const UpdateUserProfileCommand({
    required this.name,
    required this.locale,
    required this.timezone,
    this.phone,
    this.bio,
    this.location,
  });

  final String name;
  final String locale;
  final String timezone;
  final String? phone;
  final String? bio;
  final String? location;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'name': name.trim(),
      'locale': locale,
      'timezone': timezone.trim(),
      if (phone != null) 'phone': phone!.trim(),
      if (bio != null) 'bio': bio!.trim(),
      if (location != null) 'location': location!.trim(),
    };
  }
}

class CurrentUserProfile {
  const CurrentUserProfile({
    required this.user,
  });

  factory CurrentUserProfile.fromJson(Map<String, Object?> json) {
    return CurrentUserProfile(
      user: AuthUserProfile.fromJson(readJsonObject(json['user'])),
    );
  }

  final AuthUserProfile user;
}

class AuthUserProfile {
  const AuthUserProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.roleLabel,
    required this.company,
    required this.workspaceStatus,
    required this.permissions,
    required this.emailVerified,
    required this.workspaces,
    this.avatar,
    this.platformRole,
    this.tenantId,
    this.locale,
    this.timezone,
    this.phone,
    this.bio,
    this.location,
  });

  factory AuthUserProfile.fromJson(Map<String, Object?> json) {
    return AuthUserProfile(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      avatar: json['avatar']?.toString(),
      platformRole: json['platformRole']?.toString(),
      role: json['role']?.toString() ?? 'end-user',
      roleLabel: json['roleLabel']?.toString() ?? 'member',
      company: json['company']?.toString() ?? '',
      tenantId: json['tenantId']?.toString(),
      workspaceStatus: json['workspaceStatus']?.toString() ?? 'none',
      permissions: _readJsonArray(
        json['permissions'],
      ).map((value) => value.toString()).toList(growable: false),
      emailVerified: json['emailVerified'] as bool? ?? false,
      locale: json['locale']?.toString(),
      timezone: json['timezone']?.toString(),
      phone: json['phone']?.toString(),
      bio: json['bio']?.toString(),
      location: json['location']?.toString(),
      workspaces: _readJsonArray(json['workspaces'])
          .map((value) => AuthUserWorkspace.fromJson(readJsonObject(value)))
          .toList(growable: false),
    );
  }

  final String id;
  final String name;
  final String email;
  final String? avatar;
  final String? platformRole;
  final String role;
  final String roleLabel;
  final String company;
  final String? tenantId;
  final String workspaceStatus;
  final List<String> permissions;
  final bool emailVerified;
  final String? locale;
  final String? timezone;
  final String? phone;
  final String? bio;
  final String? location;
  final List<AuthUserWorkspace> workspaces;
}

class AuthUserWorkspace {
  const AuthUserWorkspace({
    required this.membershipId,
    required this.organizationId,
    required this.name,
    required this.slug,
    required this.type,
    required this.role,
    required this.permissions,
  });

  factory AuthUserWorkspace.fromJson(Map<String, Object?> json) {
    return AuthUserWorkspace(
      membershipId: json['membershipId']?.toString() ?? '',
      organizationId: json['organizationId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      permissions: _readJsonArray(
        json['permissions'],
      ).map((value) => value.toString()).toList(growable: false),
    );
  }

  final String membershipId;
  final String organizationId;
  final String name;
  final String slug;
  final String type;
  final String role;
  final List<String> permissions;
}

class UserSessionSummary {
  const UserSessionSummary({
    required this.id,
    required this.name,
    this.installationId,
    this.platform,
    this.appVersion,
    this.ipAddress,
    this.userAgent,
    this.lastUsedAt,
    this.expiresAt,
  });

  factory UserSessionSummary.fromJson(Map<String, Object?> json) {
    return UserSessionSummary(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      installationId: json['installationId']?.toString(),
      platform: json['platform']?.toString(),
      appVersion: json['appVersion']?.toString(),
      ipAddress: json['ipAddress']?.toString(),
      userAgent: json['userAgent']?.toString(),
      lastUsedAt: json['lastUsedAt']?.toString(),
      expiresAt: json['expiresAt']?.toString(),
    );
  }

  final String id;
  final String name;
  final String? installationId;
  final String? platform;
  final String? appVersion;
  final String? ipAddress;
  final String? userAgent;
  final String? lastUsedAt;
  final String? expiresAt;

  String get displayName => name.isEmpty ? id : name;
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
      permissions: _readJsonArray(
        json['permissions'],
      ).map((value) => value.toString()).toList(growable: false),
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

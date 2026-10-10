import 'package:ain_mobile/src/core/auth/secure_token_store.dart';
import 'package:ain_mobile/src/core/device/installation_id_store.dart';
import 'package:ain_mobile/src/core/errors/api_error_mapper.dart';
import 'package:ain_mobile/src/core/notifications/firebase_push_token_service.dart';
import 'package:ain_mobile/src/core/telemetry/telemetry_service.dart';
import 'package:ain_mobile/src/features/auth/data/auth_repository.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final authControllerProvider = NotifierProvider<AuthController, AuthState>(
  AuthController.new,
);

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    return const AuthState.restoring();
  }

  Future<void> restoreSession() async {
    try {
      final tokenStore = ref.read(secureTokenStoreProvider);
      final accessToken = await tokenStore.readAccessToken().timeout(
            const Duration(seconds: 2),
            onTimeout: () => null,
          );
      state = accessToken == null || accessToken.isEmpty
          ? const AuthState.unauthenticated()
          : const AuthState.authenticated();
    } catch (e) {
      debugPrint('Session restore failed or timed out: $e');
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> signIn({
    required String email,
    required String password,
    String? mfaCode,
  }) async {
    state = const AuthState.submitting();

    try {
      final installationId = await ref.read(installationIdProvider.future);
      final loginResult = await ref.read(authRepositoryProvider).login(
            LoginCommand(
              email: email,
              password: password,
              deviceName: defaultTargetPlatform.name,
              installationId: installationId,
              platform: _mobilePlatformName(),
              appVersion: const String.fromEnvironment(
                'AIN_APP_VERSION',
                defaultValue: '0.1.0',
              ),
              mfaCode: mfaCode,
            ),
          );

      if (loginResult.mfaRequired) {
        state = AuthState.mfaChallenge(
          email: email,
          password: password,
          method: loginResult.mfaMethod ?? 'email_otp',
          debugCode: loginResult.debugCode,
        );
        return;
      }

      await ref.read(telemetryServiceProvider).track(
        TelemetryEvent.loginSuccess,
        properties: <String, Object?>{'platform': _mobilePlatformName()},
      );
      await ref.read(firebasePushTokenServiceProvider).registerCurrentDevice();
      state = const AuthState.authenticated();
    } on Object catch (error) {
      final apiError = ref.read(apiErrorMapperProvider).map(error);
      state = AuthState.unauthenticatedWithError(apiError.message);
    }
  }

  Future<void> submitMfa(String mfaCode) async {
    final email = state.mfaEmail;
    final password = state.mfaPassword;
    if (email == null || password == null) {
      state = const AuthState.unauthenticated();
      return;
    }
    await signIn(email: email, password: password, mfaCode: mfaCode);
  }

  void cancelMfa() {
    state = const AuthState.unauthenticated();
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
    required String newPasswordConfirmation,
  }) async {
    state = const AuthState.submitting();
    try {
      await ref.read(authRepositoryProvider).changePassword(
            currentPassword: currentPassword,
            newPassword: newPassword,
            newPasswordConfirmation: newPasswordConfirmation,
          );
      state = const AuthState.unauthenticatedWithMessage('password_changed');
      return true;
    } on Object catch (error) {
      final apiError = ref.read(apiErrorMapperProvider).map(error);
      state = AuthState.unauthenticatedWithError(apiError.message);
      return false;
    }
  }

  Future<RegistrationResult?> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    state = const AuthState.submitting();

    try {
      final result = await ref.read(authRepositoryProvider).register(
            RegisterCommand(
              name: name,
              email: email,
              password: password,
              passwordConfirmation: passwordConfirmation,
            ),
          );
      state = const AuthState.unauthenticatedWithMessage(
        'verification_required',
      );
      return result;
    } on Object catch (error) {
      final apiError = ref.read(apiErrorMapperProvider).map(error);
      state = AuthState.unauthenticatedWithError(apiError.message);
      return null;
    }
  }

  Future<void> verifyEmail({
    required String email,
    required String code,
  }) async {
    state = const AuthState.submitting();

    try {
      await ref
          .read(authRepositoryProvider)
          .verifyEmail(EmailCodeCommand(email: email, code: code));
      await ref.read(telemetryServiceProvider).track(
        TelemetryEvent.loginSuccess,
        properties: <String, Object?>{
          'method': 'email_verification',
          'platform': _mobilePlatformName(),
        },
      );
      await ref.read(firebasePushTokenServiceProvider).registerCurrentDevice();
      state = const AuthState.authenticated();
    } on Object catch (error) {
      final apiError = ref.read(apiErrorMapperProvider).map(error);
      state = AuthState.unauthenticatedWithError(apiError.message);
    }
  }

  Future<AcceptedDeliveryResult?> resendVerification(String email) async {
    try {
      return ref.read(authRepositoryProvider).resendVerification(email);
    } on Object catch (error) {
      final apiError = ref.read(apiErrorMapperProvider).map(error);
      state = AuthState.unauthenticatedWithError(apiError.message);
      return null;
    }
  }

  Future<AcceptedDeliveryResult?> requestPasswordReset(String email) async {
    state = const AuthState.submitting();

    try {
      final result =
          await ref.read(authRepositoryProvider).requestPasswordReset(email);
      state = const AuthState.unauthenticatedWithMessage('reset_requested');
      return result;
    } on Object catch (error) {
      final apiError = ref.read(apiErrorMapperProvider).map(error);
      state = AuthState.unauthenticatedWithError(apiError.message);
      return null;
    }
  }

  Future<bool> resetPassword({
    required String email,
    required String code,
    required String password,
    required String passwordConfirmation,
  }) async {
    state = const AuthState.submitting();

    try {
      final result = await ref.read(authRepositoryProvider).resetPassword(
            ResetPasswordCommand(
              email: email,
              code: code,
              password: password,
              passwordConfirmation: passwordConfirmation,
            ),
          );
      state = const AuthState.unauthenticatedWithMessage('password_changed');
      return result.passwordChanged;
    } on Object catch (error) {
      final apiError = ref.read(apiErrorMapperProvider).map(error);
      state = AuthState.unauthenticatedWithError(apiError.message);
      return false;
    }
  }

  Future<InvitationPreview?> previewInvitation(String token) async {
    try {
      return ref.read(authRepositoryProvider).previewInvitation(token);
    } on Object catch (error) {
      final apiError = ref.read(apiErrorMapperProvider).map(error);
      state = AuthState.unauthenticatedWithError(apiError.message);
      return null;
    }
  }

  Future<InvitationAcceptance?> acceptInvitation(String token) async {
    try {
      final result =
          await ref.read(authRepositoryProvider).acceptInvitation(token);
      await ref.read(telemetryServiceProvider).track(
        TelemetryEvent.workspaceSelected,
        properties: <String, Object?>{
          'source': 'invitation',
          'organizationId': result.organization['id'],
        },
      );
      return result;
    } on Object catch (error) {
      final apiError = ref.read(apiErrorMapperProvider).map(error);
      state = AuthState.unauthenticatedWithError(apiError.message);
      return null;
    }
  }

  Future<void> signOut() async {
    try {
      await ref.read(authRepositoryProvider).logout();
    } finally {
      state = const AuthState.unauthenticated();
    }
  }

  String _mobilePlatformName() {
    return switch (defaultTargetPlatform) {
      TargetPlatform.iOS => 'ios',
      TargetPlatform.android => 'android',
      _ => 'web',
    };
  }

  void markUnauthenticated() {
    state = const AuthState.unauthenticated();
  }
}

class AuthState {
  const AuthState._({
    required this.isRestoring,
    required this.isAuthenticated,
    required this.isSubmitting,
    this.isMfaChallenge = false,
    this.mfaEmail,
    this.mfaPassword,
    this.mfaMethod,
    this.debugCode,
    this.errorMessage,
    this.successMessage,
  });

  const AuthState.restoring()
      : this._(isRestoring: true, isAuthenticated: false, isSubmitting: false);

  const AuthState.unauthenticated()
      : this._(isRestoring: false, isAuthenticated: false, isSubmitting: false);

  const AuthState.submitting()
      : this._(isRestoring: false, isAuthenticated: false, isSubmitting: true);

  const AuthState.mfaChallenge({
    required String email,
    required String password,
    required String method,
    String? debugCode,
  }) : this._(
          isRestoring: false,
          isAuthenticated: false,
          isSubmitting: false,
          isMfaChallenge: true,
          mfaEmail: email,
          mfaPassword: password,
          mfaMethod: method,
          debugCode: debugCode,
        );

  const AuthState.unauthenticatedWithError(String errorMessage)
      : this._(
          isRestoring: false,
          isAuthenticated: false,
          isSubmitting: false,
          errorMessage: errorMessage,
        );

  const AuthState.unauthenticatedWithMessage(String successMessage)
      : this._(
          isRestoring: false,
          isAuthenticated: false,
          isSubmitting: false,
          successMessage: successMessage,
        );

  const AuthState.authenticated()
      : this._(isRestoring: false, isAuthenticated: true, isSubmitting: false);

  final bool isRestoring;
  final bool isAuthenticated;
  final bool isSubmitting;
  final bool isMfaChallenge;
  final String? mfaEmail;
  final String? mfaPassword;
  final String? mfaMethod;
  final String? debugCode;
  final String? errorMessage;
  final String? successMessage;
}

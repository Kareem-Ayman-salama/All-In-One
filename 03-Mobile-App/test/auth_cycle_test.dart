import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/auth/data/auth_repository.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Auth Cycle Models & Commands', () {
    test('LoginCommand serializes credentials and optional MFA code', () {
      const basicCommand = LoginCommand(
        email: 'USER@example.com',
        password: 'Password123!',
      );
      final json = basicCommand.toJson();
      expect(json['email'], 'USER@example.com');
      expect(json['password'], 'Password123!');
      expect(json.containsKey('mfaCode'), isFalse);

      const mfaCommand = LoginCommand(
        email: 'admin@example.com',
        password: 'Password123!',
        mfaCode: ' 123456 ',
      );
      final mfaJson = mfaCommand.toJson();
      expect(mfaJson['mfaCode'], '123456');
    });

    test('RegisterCommand trims name and normalizes email', () {
      const command = RegisterCommand(
        name: '  Kareem Ayman  ',
        email: '  Kareem@Example.COM ',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      );
      final json = command.toJson();
      expect(json['name'], 'Kareem Ayman');
      expect(json['email'], 'kareem@example.com');
      expect(json['password'], 'Password123!');
      expect(json['password_confirmation'], 'Password123!');
    });

    test('EmailCodeCommand and ResetPasswordCommand normalize inputs', () {
      const verifyCmd = EmailCodeCommand(
        email: ' STUDENT@test.com ',
        code: ' 654321 ',
      );
      expect(verifyCmd.toJson()['email'], 'student@test.com');
      expect(verifyCmd.toJson()['code'], '654321');

      const resetCmd = ResetPasswordCommand(
        email: ' STUDENT@test.com ',
        code: ' 112233 ',
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      );
      final resetJson = resetCmd.toJson();
      expect(resetJson['email'], 'student@test.com');
      expect(resetJson['code'], '112233');
      expect(resetJson['password'], 'NewPassword123!');
      expect(resetJson['password_confirmation'], 'NewPassword123!');
    });

    test('LoginResult distinguishes authenticated session from MFA challenge',
        () {
      const sessionResult = LoginResult(
        session: AuthSession(
          accessToken: 'token-abc',
          refreshToken: 'refresh-xyz',
          user: <String, Object?>{'id': 'u1', 'name': 'Ahmed'},
        ),
      );
      expect(sessionResult.isAuthenticated, isTrue);
      expect(sessionResult.mfaRequired, isFalse);

      const mfaResult = LoginResult(
        mfaRequired: true,
        mfaMethod: 'email_otp',
        debugCode: '998877',
      );
      expect(mfaResult.isAuthenticated, isFalse);
      expect(mfaResult.mfaRequired, isTrue);
      expect(mfaResult.mfaMethod, 'email_otp');
      expect(mfaResult.debugCode, '998877');
    });

    test('AuthState transitions cleanly across states', () {
      const restoring = AuthState.restoring();
      expect(restoring.isRestoring, isTrue);
      expect(restoring.isAuthenticated, isFalse);

      const unauthenticated = AuthState.unauthenticated();
      expect(unauthenticated.isRestoring, isFalse);
      expect(unauthenticated.isAuthenticated, isFalse);
      expect(unauthenticated.isSubmitting, isFalse);

      const mfaState = AuthState.mfaChallenge(
        email: 'user@test.com',
        password: 'secretPassword',
        method: 'email_otp',
        debugCode: '554433',
      );
      expect(mfaState.isMfaChallenge, isTrue);
      expect(mfaState.mfaEmail, 'user@test.com');
      expect(mfaState.debugCode, '554433');

      const authenticated = AuthState.authenticated();
      expect(authenticated.isAuthenticated, isTrue);
      expect(authenticated.isMfaChallenge, isFalse);
    });
  });
}

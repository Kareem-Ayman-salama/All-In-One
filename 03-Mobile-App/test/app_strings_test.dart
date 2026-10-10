import 'dart:ui';
import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppStrings Localization', () {
    test('provides Arabic strings when locale is Arabic', () async {
      const delegate = AppStringsDelegate();
      final strings = await delegate.load(const Locale('ar'));

      expect(strings.isArabic, isTrue);
      expect(strings.appName, 'منصة عين');
      expect(strings.signIn, 'تسجيل الدخول');
      expect(strings.createAccount, 'إنشاء حساب جديد');
      expect(strings.verifyEmail, 'تأكيد البريد الإلكتروني');
      expect(strings.changePasswordTitle, 'تغيير كلمة المرور');
      expect(strings.mfaVerificationTitle, 'التحقق بخطوتين (MFA)');
      expect(strings.continueAsStudent, 'المتابعة كطالب / متعلّم');
      expect(strings.passwordsDoNotMatch, 'كلمتا المرور غير متطابقتين.');
      expect(strings.resendInSeconds(45), 'إعادة الإرسال خلال 45 ثانية');
      expect(strings.exploreCourses, 'استكشف الدورات');
      expect(strings.watermarkProtected, 'محمي بعلامة مائية رقمية');
      expect(strings.paymentMethod, 'طريقة الدفع');
      expect(strings.proceedToPayment, 'المتابعة للدفع الإلكتروني');
    });

    test('provides English strings when locale is English', () async {
      const delegate = AppStringsDelegate();
      final strings = await delegate.load(const Locale('en'));

      expect(strings.isArabic, isFalse);
      expect(strings.appName, 'AIN Platform');
      expect(strings.signIn, 'Sign in');
      expect(strings.createAccount, 'Create account');
      expect(strings.verifyEmail, 'Verify email');
      expect(strings.changePasswordTitle, 'Change password');
      expect(strings.mfaVerificationTitle, 'Two-Factor Authentication (MFA)');
      expect(strings.continueAsStudent, 'Continue as Student');
      expect(strings.passwordsDoNotMatch, 'Passwords do not match.');
      expect(strings.resendInSeconds(45), 'Resend in 45 seconds');
      expect(strings.exploreCourses, 'Explore courses');
      expect(strings.watermarkProtected, 'Watermark protected');
      expect(strings.paymentMethod, 'Payment method');
      expect(strings.proceedToPayment, 'Proceed to payment');
    });

    test('supports expected locales', () {
      const delegate = AppStringsDelegate();
      expect(delegate.isSupported(const Locale('ar')), isTrue);
      expect(delegate.isSupported(const Locale('en')), isTrue);
      expect(delegate.isSupported(const Locale('fr')), isFalse);
    });
  });
}

import 'package:ain_mobile/src/app/configuration/app_environment.dart';
import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/auth/presentation/auth_flow_pages.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  static const routePath = '/login';

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _mfaCodeController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _mfaCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final strings = AppStrings.of(context);
    final allowMockData = () {
      try {
        return ref.watch(appEnvironmentProvider).allowMockData;
      } catch (_) {
        return false;
      }
    }();

    if (authState.isMfaChallenge) {
      return AinAuthScaffold(
        title: strings.mfaVerificationTitle,
        subtitle: strings.mfaVerificationSubtitle,
        child: _buildMfaForm(context, authState, strings),
      );
    }

    return AinAuthScaffold(
      title: strings.welcomeBackToAin,
      subtitle: strings.isArabic
          ? 'أدخل بيانات حسابك للوصول إلى كورساتك ومساحتك التعليمية'
          : 'Access courses, bookings, and academy workspace.',
      footer: TextButton(
        onPressed: authState.isSubmitting
            ? null
            : () => context.go(RegisterPage.routePath),
        child: Text(
          strings.dontHaveAccountCreate,
          style: const TextStyle(
            color: AinColors.brand,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      child: AutofillGroup(
        child: Semantics(
          label: strings.signIn,
          explicitChildNodes: true,
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AinTextField(
                  controller: _emailController,
                  label: strings.email,
                  icon: Icons.alternate_email,
                  autofillHints: const [AutofillHints.email],
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: (value) {
                    final email = value?.trim() ?? '';
                    return email.contains('@') ? null : strings.invalidEmail;
                  },
                ),
                const SizedBox(height: AinSpacing.md),
                AinTextField(
                  controller: _passwordController,
                  label: strings.password,
                  icon: Icons.lock_outline,
                  autofillHints: const [AutofillHints.password],
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  suffix: IconButton(
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      size: 20,
                      color: AinColors.muted,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                  validator: (value) {
                    return (value?.length ?? 0) >= 8
                        ? null
                        : strings.invalidPassword;
                  },
                ),
                const SizedBox(height: AinSpacing.xs),
                Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: TextButton(
                    onPressed: authState.isSubmitting
                        ? null
                        : () => context.go(ForgotPasswordPage.routePath),
                    child: Text(
                      strings.forgotPassword,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AinColors.muted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                if (authState.errorMessage != null) ...[
                  const SizedBox(height: AinSpacing.sm),
                  _AuthMessage(
                    icon: Icons.error_outline,
                    message: authState.errorMessage!,
                    color: Theme.of(context).colorScheme.error,
                  ),
                ],
                if (authState.successMessage != null) ...[
                  const SizedBox(height: AinSpacing.sm),
                  _AuthMessage(
                    icon: Icons.check_circle_outline,
                    message: authState.successMessage!,
                    color: AinColors.success,
                  ),
                ],
                const SizedBox(height: AinSpacing.md),
                AinPrimaryButton(
                  label: strings.signIn,
                  icon: Icons.login,
                  loading: authState.isSubmitting,
                  onPressed: _submit,
                ),
                if (allowMockData) ...[
                  const SizedBox(height: AinSpacing.lg),
                  _buildDemoAccountsSection(context, authState, strings),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDemoAccountsSection(
    BuildContext context,
    AuthState authState,
    AppStrings strings,
  ) {
    final demoAccounts = [
      (
        title: strings.isArabic ? 'مسؤول المنصة' : 'Platform Admin',
        email: 'super@ain.test',
        icon: Icons.admin_panel_settings_rounded,
        color: AinColors.brand,
      ),
      (
        title: strings.isArabic ? 'مسؤول الشركة' : 'Company Admin',
        email: 'admin@techcorp.test',
        icon: Icons.business_center_rounded,
        color: AinColors.teal,
      ),
      (
        title: strings.isArabic ? 'مستخدم نهائي' : 'Employee',
        email: 'employee@techcorp.test',
        icon: Icons.person_rounded,
        color: AinColors.violet,
      ),
      (
        title: strings.isArabic ? 'طالب' : 'Student',
        email: 'student@ain.test',
        icon: Icons.school_rounded,
        color: AinColors.goldDark,
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(AinSpacing.md),
      decoration: BoxDecoration(
        color: AinColors.canvasSubtle,
        borderRadius: BorderRadius.circular(AinRadii.lg),
        border: Border.all(color: AinColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(
                Icons.flash_on_rounded,
                size: 18,
                color: AinColors.gold,
              ),
              const SizedBox(width: AinSpacing.xs),
              Text(
                strings.isArabic
                    ? 'حسابات التجربة السريعة'
                    : 'Quick Demo Accounts',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AinColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: AinSpacing.sm),
          Wrap(
            spacing: AinSpacing.xs,
            runSpacing: AinSpacing.xs,
            children: demoAccounts.map((account) {
              return InkWell(
                borderRadius: BorderRadius.circular(AinRadii.md),
                onTap: authState.isSubmitting
                    ? null
                    : () {
                        setState(() {
                          _emailController.text = account.email;
                          _passwordController.text = 'password';
                        });
                        _submit();
                      },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AinSpacing.sm,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: account.color.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(AinRadii.md),
                    border: Border.all(
                      color: account.color.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(account.icon, size: 15, color: account.color),
                      const SizedBox(width: 4),
                      Text(
                        account.title,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: account.color,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    TextInput.finishAutofillContext();
    await ref.read(authControllerProvider.notifier).signIn(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
  }

  Widget _buildMfaForm(
    BuildContext context,
    AuthState authState,
    AppStrings strings,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(AinSpacing.md),
          decoration: BoxDecoration(
            color: AinColors.brand.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(AinRadii.md),
            border: Border.all(color: AinColors.brand.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.shield_outlined,
                color: AinColors.brand,
                size: 28,
              ),
              const SizedBox(width: AinSpacing.md),
              Expanded(
                child: Text(
                  strings.codeSentToEmail(authState.mfaEmail ?? ''),
                  style: const TextStyle(
                    fontSize: 13,
                    color: AinColors.textPrimary,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (authState.debugCode != null) ...[
          const SizedBox(height: AinSpacing.md),
          _DebugCodeBanner(
            code: authState.debugCode!,
            onTap: () {
              _mfaCodeController.text = authState.debugCode!;
            },
          ),
        ],
        const SizedBox(height: AinSpacing.lg),
        AinTextField(
          controller: _mfaCodeController,
          label: strings.verificationCode,
          icon: Icons.lock_clock_outlined,
          keyboardType: TextInputType.number,
          autofillHints: const [AutofillHints.oneTimeCode],
          textInputAction: TextInputAction.done,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(6),
          ],
          onFieldSubmitted: (_) {
            final code = _mfaCodeController.text.trim();
            if (code.length == 6) {
              ref.read(authControllerProvider.notifier).submitMfa(code);
            }
          },
          validator: (value) {
            return (value?.trim().length ?? 0) == 6
                ? null
                : strings.invalidVerificationCode;
          },
        ),
        if (authState.errorMessage != null) ...[
          const SizedBox(height: AinSpacing.sm),
          _AuthMessage(
            icon: Icons.error_outline,
            message: authState.errorMessage!,
            color: Theme.of(context).colorScheme.error,
          ),
        ],
        const SizedBox(height: AinSpacing.lg),
        AinPrimaryButton(
          label: strings.submitVerification,
          icon: Icons.check_circle_outline,
          loading: authState.isSubmitting,
          onPressed: () {
            final code = _mfaCodeController.text.trim();
            if (code.length == 6) {
              ref.read(authControllerProvider.notifier).submitMfa(code);
            }
          },
        ),
        const SizedBox(height: AinSpacing.md),
        TextButton(
          onPressed: () {
            _mfaCodeController.clear();
            ref.read(authControllerProvider.notifier).cancelMfa();
          },
          child: Text(
            strings.isArabic ? 'إلغاء والرجوع' : 'Cancel & Go Back',
            style: const TextStyle(
              color: AinColors.muted,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

class _DebugCodeBanner extends StatelessWidget {
  const _DebugCodeBanner({required this.code, required this.onTap});

  final String code;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AinRadii.md),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AinSpacing.md,
          vertical: AinSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: AinColors.accent.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(AinRadii.md),
          border: Border.all(color: AinColors.accent.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.code, size: 18, color: AinColors.brand),
            const SizedBox(width: AinSpacing.xs),
            Text(
              '${strings.debugCodeHelper} $code',
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: AinColors.brand,
                fontSize: 13,
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AinColors.brand,
                borderRadius: BorderRadius.circular(AinRadii.pill),
              ),
              child: Text(
                strings.tapToFill,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AuthMessage extends StatelessWidget {
  const _AuthMessage({
    required this.icon,
    required this.message,
    required this.color,
  });

  final IconData icon;
  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AinRadii.md),
        border: Border.all(color: color.withValues(alpha: 0.24)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.md),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: AinSpacing.sm),
            Expanded(
              child: Text(
                message,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: color,
                      height: 1.35,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:async';
import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _loginRoutePath = '/login';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  static const routePath = '/register';

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);

    return AinAuthScaffold(
      title: strings.createAccount,
      subtitle: strings.registerSubtitle,
      currentStep: 1,
      totalSteps: 2,
      footer: TextButton.icon(
        onPressed:
            authState.isSubmitting ? null : () => context.go(_loginRoutePath),
        icon: const Icon(Icons.login, size: 18),
        label: Text(
          strings.signIn,
          style: const TextStyle(
            color: AinColors.brand,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AinTextField(
              controller: _nameController,
              label: strings.fullName,
              icon: Icons.badge_outlined,
              autofillHints: const [AutofillHints.name],
              textInputAction: TextInputAction.next,
              textCapitalization: TextCapitalization.words,
              validator: (value) =>
                  _hasText(value) ? null : strings.fullNameRequired,
            ),
            const SizedBox(height: AinSpacing.md),
            _EmailField(controller: _emailController),
            const SizedBox(height: AinSpacing.md),
            AinTextField(
              controller: _passwordController,
              label: strings.password,
              icon: Icons.lock_outline,
              obscureText: _obscurePassword,
              autofillHints: const [AutofillHints.newPassword],
              textInputAction: TextInputAction.next,
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
                return _isStrongPassword(value ?? '')
                    ? null
                    : strings.passwordMinTen;
              },
            ),
            _PasswordRequirements(controller: _passwordController),
            const SizedBox(height: AinSpacing.md),
            AinTextField(
              controller: _confirmPasswordController,
              label: strings.confirmNewPassword,
              icon: Icons.lock_clock_outlined,
              obscureText: _obscureConfirm,
              autofillHints: const [AutofillHints.newPassword],
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _submit(),
              suffix: IconButton(
                icon: Icon(
                  _obscureConfirm
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 20,
                  color: AinColors.muted,
                ),
                onPressed: () {
                  setState(() {
                    _obscureConfirm = !_obscureConfirm;
                  });
                },
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return strings.confirmNewPassword;
                }
                if (value != _passwordController.text) {
                  return strings.passwordsDoNotMatch;
                }
                return null;
              },
            ),
            _AuthStateMessages(state: authState),
            const SizedBox(height: AinSpacing.lg),
            AinPrimaryButton(
              label: strings.createAccount,
              icon: Icons.person_add_alt_1,
              loading: authState.isSubmitting,
              onPressed: authState.isSubmitting ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final result = await ref.read(authControllerProvider.notifier).register(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          passwordConfirmation: _confirmPasswordController.text,
        );
    if (mounted && result != null) {
      final emailParam = Uri.encodeQueryComponent(_emailController.text.trim());
      final debugParam = result.debugCode != null
          ? '&debugCode=${Uri.encodeQueryComponent(result.debugCode!)}'
          : '';
      context.go('${VerifyEmailPage.routePath}?email=$emailParam$debugParam');
    }
  }
}

class VerifyEmailPage extends ConsumerStatefulWidget {
  const VerifyEmailPage({
    required this.initialEmail,
    this.initialDebugCode,
    super.key,
  });

  static const routePath = '/verify-email';

  final String initialEmail;
  final String? initialDebugCode;

  @override
  ConsumerState<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends ConsumerState<VerifyEmailPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  late final TextEditingController _codeController;
  Timer? _timer;
  int _secondsRemaining = 60;
  bool _canResend = false;
  String? _debugCode;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
    _debugCode = widget.initialDebugCode;
    _codeController =
        TextEditingController(text: widget.initialDebugCode ?? '');
    _startTimer();
  }

  void _startTimer() {
    setState(() {
      _secondsRemaining = 60;
      _canResend = false;
    });
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_secondsRemaining > 1) {
        setState(() {
          _secondsRemaining--;
        });
      } else {
        timer.cancel();
        setState(() {
          _canResend = true;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _emailController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);

    return AinAuthScaffold(
      title: strings.verifyEmail,
      subtitle: strings.enterVerificationCode,
      currentStep: 2,
      totalSteps: 2,
      footer: TextButton(
        onPressed: () => context.go(_loginRoutePath),
        child: Text(
          strings.signIn,
          style: const TextStyle(
            color: AinColors.brand,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(AinSpacing.md),
              decoration: BoxDecoration(
                color: AinColors.brand.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(AinRadii.md),
                border:
                    Border.all(color: AinColors.brand.withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.mark_email_read_outlined,
                    color: AinColors.brand,
                    size: 28,
                  ),
                  const SizedBox(width: AinSpacing.md),
                  Expanded(
                    child: Text(
                      strings.codeSentToEmail(_emailController.text.trim()),
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
            if (_debugCode != null) ...[
              const SizedBox(height: AinSpacing.md),
              _DebugCodeChip(
                code: _debugCode!,
                onTap: () {
                  _codeController.text = _debugCode!;
                },
              ),
            ],
            const SizedBox(height: AinSpacing.lg),
            _EmailField(controller: _emailController),
            const SizedBox(height: AinSpacing.md),
            AinTextField(
              controller: _codeController,
              label: strings.verificationCode,
              icon: Icons.pin_outlined,
              keyboardType: TextInputType.number,
              autofillHints: const [AutofillHints.oneTimeCode],
              textInputAction: TextInputAction.done,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              onFieldSubmitted: (_) => _submit(),
              validator: (value) => (value?.trim().length ?? 0) == 6
                  ? null
                  : strings.invalidVerificationCode,
            ),
            const SizedBox(height: AinSpacing.sm),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (_canResend)
                  TextButton.icon(
                    onPressed: authState.isSubmitting ? null : _resend,
                    icon: const Icon(Icons.refresh, size: 18),
                    label: Text(
                      strings.resendVerification,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AinColors.brand,
                      ),
                    ),
                  )
                else
                  Text(
                    strings.resendInSeconds(_secondsRemaining),
                    style: const TextStyle(
                      color: AinColors.muted,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
            _AuthStateMessages(state: authState),
            const SizedBox(height: AinSpacing.lg),
            AinPrimaryButton(
              label: strings.verifyEmail,
              icon: Icons.verified_user_outlined,
              loading: authState.isSubmitting,
              onPressed: authState.isSubmitting ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    await ref.read(authControllerProvider.notifier).verifyEmail(
          email: _emailController.text.trim(),
          code: _codeController.text.trim(),
        );
    if (mounted && ref.read(authControllerProvider).isAuthenticated) {
      context.go(WorkspaceSelectionPage.routePath);
    }
  }

  Future<void> _resend() async {
    final strings = AppStrings.of(context);
    final result = await ref
        .read(authControllerProvider.notifier)
        .resendVerification(_emailController.text.trim());
    if (mounted) {
      _startTimer();
      if (result?.debugCode != null) {
        setState(() {
          _debugCode = result!.debugCode;
        });
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(strings.resendSuccess),
          backgroundColor: AinColors.brand,
        ),
      );
    }
  }
}

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  static const routePath = '/forgot-password';

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);

    return AinAuthScaffold(
      title: strings.forgotPassword,
      subtitle: strings.forgotPasswordSubtitle,
      currentStep: 1,
      totalSteps: 2,
      footer: TextButton(
        onPressed: () => context.go(_loginRoutePath),
        child: Text(
          strings.signIn,
          style: const TextStyle(
            color: AinColors.brand,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _EmailField(controller: _emailController),
            _AuthStateMessages(state: authState),
            const SizedBox(height: AinSpacing.xl),
            AinPrimaryButton(
              label: strings.sendResetCode,
              icon: Icons.send_outlined,
              loading: authState.isSubmitting,
              onPressed: authState.isSubmitting ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final result = await ref
        .read(authControllerProvider.notifier)
        .requestPasswordReset(_emailController.text.trim());
    if (mounted && result != null) {
      final emailParam = Uri.encodeQueryComponent(_emailController.text.trim());
      final debugParam = result.debugCode != null
          ? '&debugCode=${Uri.encodeQueryComponent(result.debugCode!)}'
          : '';
      context.go('${ResetPasswordPage.routePath}?email=$emailParam$debugParam');
    }
  }
}

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({
    required this.initialEmail,
    this.initialDebugCode,
    super.key,
  });

  static const routePath = '/reset-password';

  final String initialEmail;
  final String? initialDebugCode;

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  late final TextEditingController _codeController;
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _debugCode;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
    _debugCode = widget.initialDebugCode;
    _codeController =
        TextEditingController(text: widget.initialDebugCode ?? '');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);

    return AinAuthScaffold(
      title: strings.resetPassword,
      subtitle: strings.resetPasswordSubtitle,
      currentStep: 2,
      totalSteps: 2,
      footer: TextButton(
        onPressed: () => context.go(_loginRoutePath),
        child: Text(
          strings.signIn,
          style: const TextStyle(
            color: AinColors.brand,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _EmailField(controller: _emailController),
            const SizedBox(height: AinSpacing.md),
            if (_debugCode != null) ...[
              _DebugCodeChip(
                code: _debugCode!,
                onTap: () {
                  _codeController.text = _debugCode!;
                },
              ),
              const SizedBox(height: AinSpacing.md),
            ],
            AinTextField(
              controller: _codeController,
              label: strings.verificationCode,
              icon: Icons.pin_outlined,
              keyboardType: TextInputType.number,
              autofillHints: const [AutofillHints.oneTimeCode],
              textInputAction: TextInputAction.next,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              validator: (value) => (value?.trim().length ?? 0) == 6
                  ? null
                  : strings.invalidVerificationCode,
            ),
            const SizedBox(height: AinSpacing.md),
            AinTextField(
              controller: _passwordController,
              label: strings.newPassword,
              icon: Icons.lock_outline,
              obscureText: _obscurePassword,
              autofillHints: const [AutofillHints.newPassword],
              textInputAction: TextInputAction.next,
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
                return _isStrongPassword(value ?? '')
                    ? null
                    : strings.passwordMinTen;
              },
            ),
            _PasswordRequirements(controller: _passwordController),
            const SizedBox(height: AinSpacing.md),
            AinTextField(
              controller: _confirmPasswordController,
              label: strings.confirmNewPassword,
              icon: Icons.lock_clock_outlined,
              obscureText: _obscureConfirm,
              autofillHints: const [AutofillHints.newPassword],
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _submit(),
              suffix: IconButton(
                icon: Icon(
                  _obscureConfirm
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 20,
                  color: AinColors.muted,
                ),
                onPressed: () {
                  setState(() {
                    _obscureConfirm = !_obscureConfirm;
                  });
                },
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return strings.confirmNewPassword;
                }
                if (value != _passwordController.text) {
                  return strings.passwordsDoNotMatch;
                }
                return null;
              },
            ),
            _AuthStateMessages(state: authState),
            const SizedBox(height: AinSpacing.xl),
            AinPrimaryButton(
              label: strings.resetPassword,
              icon: Icons.lock_reset,
              loading: authState.isSubmitting,
              onPressed: authState.isSubmitting ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final changed =
        await ref.read(authControllerProvider.notifier).resetPassword(
              email: _emailController.text.trim(),
              code: _codeController.text.trim(),
              password: _passwordController.text,
              passwordConfirmation: _confirmPasswordController.text,
            );
    if (mounted && changed) {
      context.go(_loginRoutePath);
    }
  }
}

class InvitationPage extends ConsumerWidget {
  const InvitationPage({required this.token, super.key});

  static const routePath = '/invite/:token';

  final String token;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);

    return FutureBuilder(
      future:
          ref.read(authControllerProvider.notifier).previewInvitation(token),
      builder: (context, snapshot) {
        final preview = snapshot.data;

        return AinAuthScaffold(
          title: strings.invitation,
          subtitle:
              preview?.organization['name']?.toString() ?? strings.appName,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (snapshot.connectionState == ConnectionState.waiting)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(AinSpacing.xl),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (preview == null)
                Container(
                  padding: const EdgeInsets.all(AinSpacing.lg),
                  decoration: BoxDecoration(
                    color: AinColors.surface,
                    borderRadius: BorderRadius.circular(AinRadii.md),
                    border: Border.all(color: AinColors.border),
                  ),
                  child: Text(
                    strings.invitationUnavailable,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AinColors.muted),
                  ),
                )
              else ...[
                Container(
                  padding: const EdgeInsets.all(AinSpacing.lg),
                  decoration: BoxDecoration(
                    color: AinColors.surface,
                    borderRadius: BorderRadius.circular(AinRadii.lg),
                    border: Border.all(color: AinColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const CircleAvatar(
                            backgroundColor: AinColors.accent,
                            child: Icon(Icons.business, color: AinColors.brand),
                          ),
                          const SizedBox(width: AinSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  preview.organization['name']?.toString() ??
                                      strings.appName,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AinColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  strings.invitationRole(preview.role),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AinColors.brand,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (_hasText(preview.note)) ...[
                        const Divider(height: AinSpacing.xl),
                        Text(
                          preview.note!,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AinColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
              _AuthStateMessages(state: authState),
              const SizedBox(height: AinSpacing.xl),
              AinPrimaryButton(
                label: authState.isAuthenticated
                    ? strings.acceptInvitation
                    : strings.signIn,
                icon: Icons.check,
                onPressed: preview == null
                    ? null
                    : () => _acceptOrSignIn(context, ref, authState),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _acceptOrSignIn(
    BuildContext context,
    WidgetRef ref,
    AuthState authState,
  ) async {
    if (!authState.isAuthenticated) {
      context.go(_loginRoutePath);
      return;
    }

    final result =
        await ref.read(authControllerProvider.notifier).acceptInvitation(token);
    if (context.mounted && result != null) {
      context.go(WorkspaceSelectionPage.routePath);
    }
  }
}

class _DebugCodeChip extends StatelessWidget {
  const _DebugCodeChip({required this.code, required this.onTap});

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

class _EmailField extends StatelessWidget {
  const _EmailField({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    return AinTextField(
      controller: controller,
      label: strings.email,
      icon: Icons.alternate_email,
      keyboardType: TextInputType.emailAddress,
      autofillHints: const [AutofillHints.email],
      validator: (value) {
        final email = value?.trim() ?? '';
        return email.contains('@') ? null : strings.invalidEmail;
      },
    );
  }
}

class _PasswordRequirements extends StatelessWidget {
  const _PasswordRequirements({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    final isArabic = AppStrings.of(context).isArabic;

    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: controller,
      builder: (context, value, _) {
        final password = value.text;
        final requirements = <({String label, bool passed})>[
          (
            label: isArabic ? '10 أحرف على الأقل' : 'At least 10 characters',
            passed: password.length >= 10,
          ),
          (
            label: isArabic
                ? 'حرف إنجليزي كبير وصغير'
                : 'Uppercase and lowercase letters',
            passed: RegExp('[a-z]').hasMatch(password) &&
                RegExp('[A-Z]').hasMatch(password),
          ),
          (
            label: isArabic ? 'رقم واحد على الأقل' : 'At least one number',
            passed: RegExp('[0-9]').hasMatch(password),
          ),
        ];

        return Padding(
          padding: const EdgeInsets.only(top: AinSpacing.sm),
          child: Wrap(
            spacing: AinSpacing.sm,
            runSpacing: AinSpacing.xs,
            children: requirements.map((requirement) {
              final color =
                  requirement.passed ? AinColors.success : AinColors.muted;
              return Semantics(
                label: requirement.label,
                checked: requirement.passed,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      requirement.passed
                          ? Icons.check_circle
                          : Icons.circle_outlined,
                      size: 14,
                      color: color,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      requirement.label,
                      style: TextStyle(
                        color: color,
                        fontSize: 10.5,
                        fontWeight: requirement.passed
                            ? FontWeight.w700
                            : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }
}

class _AuthStateMessages extends StatelessWidget {
  const _AuthStateMessages({required this.state});

  final AuthState state;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final message = state.errorMessage ?? _successText(strings);
    if (message == null) {
      return const SizedBox.shrink();
    }

    final color = state.errorMessage == null
        ? AinColors.success
        : Theme.of(context).colorScheme.error;

    return Padding(
      padding: const EdgeInsets.only(top: AinSpacing.md),
      child: DecoratedBox(
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
              Icon(
                state.errorMessage == null
                    ? Icons.check_circle_outline
                    : Icons.error_outline,
                color: color,
                size: 20,
              ),
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
      ),
    );
  }

  String? _successText(AppStrings strings) {
    return switch (state.successMessage) {
      'verification_required' => strings.verificationRequired,
      'reset_requested' => strings.resetRequested,
      'password_changed' => strings.passwordChangedSuccess,
      null => null,
      final value => value,
    };
  }
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

bool _isStrongPassword(String value) {
  return value.length >= 10 &&
      RegExp('[a-z]').hasMatch(value) &&
      RegExp('[A-Z]').hasMatch(value) &&
      RegExp('[0-9]').hasMatch(value);
}

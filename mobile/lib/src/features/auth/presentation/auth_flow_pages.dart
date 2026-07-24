import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:flutter/material.dart';
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

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);

    return _AuthScaffold(
      title: strings.createAccount,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _AuthTextField(
              controller: _nameController,
              label: strings.fullName,
              validator: (value) =>
                  _hasText(value) ? null : strings.fullNameRequired,
            ),
            const SizedBox(height: 12),
            _EmailField(controller: _emailController),
            const SizedBox(height: 12),
            _PasswordField(controller: _passwordController),
            _AuthStateMessages(state: authState),
            const Spacer(),
            FilledButton(
              onPressed: authState.isSubmitting ? null : _submit,
              child: authState.isSubmitting
                  ? _LoadingIndicator(label: strings.loading)
                  : Text(strings.createAccount),
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
          name: _nameController.text,
          email: _emailController.text,
          password: _passwordController.text,
          passwordConfirmation: _passwordController.text,
        );
    if (mounted && result != null) {
      context.go(
        '${VerifyEmailPage.routePath}?email=${Uri.encodeQueryComponent(_emailController.text.trim())}',
      );
    }
  }
}

class VerifyEmailPage extends ConsumerStatefulWidget {
  const VerifyEmailPage({required this.initialEmail, super.key});

  static const routePath = '/verify-email';

  final String initialEmail;

  @override
  ConsumerState<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends ConsumerState<VerifyEmailPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  final _codeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);

    return _AuthScaffold(
      title: strings.verifyEmail,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _EmailField(controller: _emailController),
            const SizedBox(height: 12),
            _AuthTextField(
              controller: _codeController,
              label: strings.verificationCode,
              keyboardType: TextInputType.number,
              validator: (value) => (value?.trim().length ?? 0) == 6
                  ? null
                  : strings.invalidVerificationCode,
            ),
            TextButton(
              onPressed: authState.isSubmitting ? null : _resend,
              child: Text(strings.resendVerification),
            ),
            _AuthStateMessages(state: authState),
            const Spacer(),
            FilledButton(
              onPressed: authState.isSubmitting ? null : _submit,
              child: authState.isSubmitting
                  ? _LoadingIndicator(label: strings.loading)
                  : Text(strings.verifyEmail),
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
    await ref
        .read(authControllerProvider.notifier)
        .verifyEmail(email: _emailController.text, code: _codeController.text);
    if (mounted && ref.read(authControllerProvider).isAuthenticated) {
      context.go(WorkspaceSelectionPage.routePath);
    }
  }

  Future<void> _resend() async {
    await ref
        .read(authControllerProvider.notifier)
        .resendVerification(_emailController.text);
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

    return _AuthScaffold(
      title: strings.forgotPassword,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _EmailField(controller: _emailController),
            _AuthStateMessages(state: authState),
            const Spacer(),
            FilledButton(
              onPressed: authState.isSubmitting ? null : _submit,
              child: authState.isSubmitting
                  ? _LoadingIndicator(label: strings.loading)
                  : Text(strings.sendResetCode),
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
        .requestPasswordReset(_emailController.text);
    if (mounted && result != null) {
      context.go(
        '${ResetPasswordPage.routePath}?email=${Uri.encodeQueryComponent(_emailController.text.trim())}',
      );
    }
  }
}

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({required this.initialEmail, super.key});

  static const routePath = '/reset-password';

  final String initialEmail;

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);

    return _AuthScaffold(
      title: strings.resetPassword,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _EmailField(controller: _emailController),
            const SizedBox(height: 12),
            _AuthTextField(
              controller: _codeController,
              label: strings.verificationCode,
              keyboardType: TextInputType.number,
              validator: (value) => (value?.trim().length ?? 0) == 6
                  ? null
                  : strings.invalidVerificationCode,
            ),
            const SizedBox(height: 12),
            _PasswordField(controller: _passwordController),
            _AuthStateMessages(state: authState),
            const Spacer(),
            FilledButton(
              onPressed: authState.isSubmitting ? null : _submit,
              child: authState.isSubmitting
                  ? _LoadingIndicator(label: strings.loading)
                  : Text(strings.resetPassword),
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
              email: _emailController.text,
              code: _codeController.text,
              password: _passwordController.text,
              passwordConfirmation: _passwordController.text,
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

        return _AuthScaffold(
          title: strings.invitation,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (snapshot.connectionState == ConnectionState.waiting)
                Center(child: _LoadingIndicator(label: strings.loading))
              else if (preview == null)
                Text(strings.invitationUnavailable)
              else ...[
                Text(
                  preview.organization['name']?.toString() ?? strings.appName,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(strings.invitationRole(preview.role)),
                const SizedBox(height: 8),
                Text(strings.invitationStatus(preview.status)),
                if (_hasText(preview.note)) ...[
                  const SizedBox(height: 16),
                  Text(preview.note!),
                ],
              ],
              _AuthStateMessages(state: authState),
              const Spacer(),
              FilledButton(
                onPressed: preview == null
                    ? null
                    : () => _acceptOrSignIn(context, ref, authState),
                child: Text(
                  authState.isAuthenticated
                      ? strings.acceptInvitation
                      : strings.signIn,
                ),
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

class _AuthScaffold extends StatelessWidget {
  const _AuthScaffold({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: Padding(padding: const EdgeInsets.all(24), child: child),
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
    return _AuthTextField(
      controller: controller,
      label: strings.email,
      keyboardType: TextInputType.emailAddress,
      autofillHints: const [AutofillHints.email],
      validator: (value) {
        final email = value?.trim() ?? '';
        return email.contains('@') ? null : strings.invalidEmail;
      },
    );
  }
}

class _PasswordField extends StatelessWidget {
  const _PasswordField({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    return _AuthTextField(
      controller: controller,
      label: strings.password,
      obscureText: true,
      autofillHints: const [AutofillHints.password],
      validator: (value) {
        return (value?.length ?? 0) >= 10 ? null : strings.passwordMinTen;
      },
    );
  }
}

class _AuthTextField extends StatelessWidget {
  const _AuthTextField({
    required this.controller,
    required this.label,
    this.validator,
    this.keyboardType,
    this.autofillHints,
    this.obscureText = false,
  });

  final TextEditingController controller;
  final String label;
  final FormFieldValidator<String>? validator;
  final TextInputType? keyboardType;
  final Iterable<String>? autofillHints;
  final bool obscureText;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      autofillHints: autofillHints,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
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
        ? Theme.of(context).colorScheme.primary
        : Theme.of(context).colorScheme.error;

    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Text(message, style: TextStyle(color: color)),
    );
  }

  String? _successText(AppStrings strings) {
    return switch (state.successMessage) {
      'verification_required' => strings.verificationRequired,
      'reset_requested' => strings.resetRequested,
      'password_changed' => strings.passwordChanged,
      null => null,
      final value => value,
    };
  }
}

class _LoadingIndicator extends StatelessWidget {
  const _LoadingIndicator({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      child: const SizedBox.square(
        dimension: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      ),
    );
  }
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

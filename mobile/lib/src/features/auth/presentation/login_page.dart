import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/auth/presentation/auth_flow_pages.dart';
import 'package:flutter/material.dart';
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

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final strings = AppStrings.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(strings.appName)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  strings.signIn,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _emailController,
                  autofillHints: const [AutofillHints.email],
                  decoration: InputDecoration(
                    labelText: strings.email,
                    border: const OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    final email = value?.trim() ?? '';
                    return email.contains('@') ? null : strings.invalidEmail;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _passwordController,
                  autofillHints: const [AutofillHints.password],
                  decoration: InputDecoration(
                    labelText: strings.password,
                    border: const OutlineInputBorder(),
                  ),
                  obscureText: true,
                  validator: (value) {
                    return (value?.length ?? 0) >= 8
                        ? null
                        : strings.invalidPassword;
                  },
                ),
                if (authState.errorMessage != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    authState.errorMessage!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ],
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: TextButton(
                    onPressed: authState.isSubmitting
                        ? null
                        : () => context.go(ForgotPasswordPage.routePath),
                    child: Text(strings.forgotPassword),
                  ),
                ),
                const Spacer(),
                FilledButton(
                  onPressed: authState.isSubmitting ? null : _submit,
                  child: authState.isSubmitting
                      ? Semantics(
                          label: strings.loading,
                          child: const SizedBox.square(
                            dimension: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : Text(strings.signIn),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: authState.isSubmitting
                      ? null
                      : () => context.go(RegisterPage.routePath),
                  child: Text(strings.createAccount),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    await ref.read(authControllerProvider.notifier).signIn(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
  }
}

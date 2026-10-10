import 'dart:async';
import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/auth/presentation/login_page.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  static const routePath = '/splash';

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;
  late final Animation<double> _fadeAnim;
  late final Animation<double> _scaleAnim;
  Timer? _fallbackTimer;
  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _scaleAnim = Tween<double>(begin: 0.9, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutBack),
    );

    _animController.forward();
    _startStartupFlow();
  }

  Future<void> _startStartupFlow() async {
    // Fallback timer ensures the user NEVER gets stuck, max 1.5 seconds
    _fallbackTimer = Timer(const Duration(milliseconds: 1500), () {
      _navigateNext();
    });

    try {
      await ref.read(authControllerProvider.notifier).restoreSession();
    } catch (e) {
      debugPrint('Session restore error: $e');
    }

    // Small delay so animation looks silky and polished
    await Future<void>.delayed(const Duration(milliseconds: 600));
    _navigateNext();
  }

  void _navigateNext() {
    if (!mounted || _hasNavigated) return;
    _hasNavigated = true;
    _fallbackTimer?.cancel();

    final authState = ref.read(authControllerProvider);
    if (authState.isAuthenticated) {
      context.go(WorkspaceSelectionPage.routePath);
    } else {
      context.go(LoginPage.routePath);
    }
  }

  @override
  void dispose() {
    _fallbackTimer?.cancel();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AinColors.brandNavy,
              AinColors.brandDark,
              AinColors.brand,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(flex: 2),
              AnimatedBuilder(
                animation: _animController,
                builder: (context, child) {
                  return FadeTransition(
                    opacity: _fadeAnim,
                    child: ScaleTransition(
                      scale: _scaleAnim,
                      child: child,
                    ),
                  );
                },
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.25),
                            blurRadius: 30,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(18),
                      child: Image.asset(
                        'assets/branding/ain-logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.school_rounded,
                          size: 54,
                          color: AinColors.brand,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'منصة عَيْن',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'AIN EDUCATIONAL PLATFORM',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AinColors.gold.withValues(alpha: 0.9),
                        letterSpacing: 2.0,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(flex: 2),
              const SizedBox(
                width: 32,
                height: 32,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(AinColors.gold),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'جاري التحميل...',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withValues(alpha: 0.7),
                ),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}

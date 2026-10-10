import 'package:ain_mobile/src/shared/presentation/ui/ain_design_tokens.dart';
import 'package:flutter/material.dart';

class AinAuthScaffold extends StatelessWidget {
  const AinAuthScaffold({
    required this.title,
    required this.subtitle,
    required this.child,
    super.key,
    this.footer,
    this.currentStep,
    this.totalSteps,
  });

  final String title;
  final String subtitle;
  final Widget child;
  final Widget? footer;
  final int? currentStep;
  final int? totalSteps;

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final size = mediaQuery.size;
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';
    final isCompact = size.height < 720;
    final headerHeight = isCompact ? 225.0 : 270.0;

    return Scaffold(
      backgroundColor: AinColors.canvas,
      resizeToAvoidBottomInset: true,
      body: GestureDetector(
        onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
        child: SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: EdgeInsets.only(
            bottom: mediaQuery.viewInsets.bottom > 0 ? 12 : 0,
          ),
          child: Column(
            children: [
              Container(
                width: double.infinity,
                constraints: BoxConstraints(minHeight: headerHeight),
                decoration: const BoxDecoration(
                  gradient: AinGradients.heroShimmer,
                ),
                child: Stack(
                  children: [
                    Positioned(
                      top: -40,
                      right: -30,
                      child: Container(
                        width: 180,
                        height: 180,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.05),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 20,
                      left: -20,
                      child: Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AinColors.gold.withValues(alpha: 0.08),
                        ),
                      ),
                    ),
                    SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AinSpacing.xl,
                          vertical: AinSpacing.lg,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(height: isCompact ? 0 : AinSpacing.sm),
                            Container(
                              width: isCompact ? 58 : 68,
                              height: isCompact ? 58 : 68,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.12),
                                borderRadius:
                                    BorderRadius.circular(AinRadii.lg),
                                border: Border.all(
                                  color: AinColors.gold.withValues(alpha: 0.4),
                                  width: 1.5,
                                ),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x20000000),
                                    blurRadius: 16,
                                    offset: Offset(0, 6),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(AinSpacing.sm),
                              child: Image.asset(
                                'assets/branding/ain-logo.png',
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Center(
                                  child: Text(
                                    'عين',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 24,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(
                              height: isCompact ? AinSpacing.sm : AinSpacing.md,
                            ),
                            Text(
                              title,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: AinSpacing.xs),
                            Text(
                              subtitle,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.8),
                                fontSize: 13.5,
                                fontWeight: FontWeight.w500,
                                height: 1.4,
                              ),
                            ),
                            if (currentStep != null && totalSteps != null) ...[
                              const SizedBox(height: AinSpacing.md),
                              _AuthStepProgress(
                                currentStep: currentStep!,
                                totalSteps: totalSteps!,
                              ),
                            ],
                            SizedBox(
                              height: isCompact ? AinSpacing.sm : AinSpacing.lg,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Transform.translate(
                offset: const Offset(0, -18),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 560),
                      child: Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: AinColors.surface,
                          borderRadius: BorderRadius.circular(AinRadii.xxl),
                          border: Border.all(color: AinColors.line),
                          boxShadow: AinShadows.float,
                        ),
                        padding: EdgeInsets.fromLTRB(
                          size.width < 380 ? AinSpacing.lg : AinSpacing.xl,
                          AinSpacing.xl,
                          size.width < 380 ? AinSpacing.lg : AinSpacing.xl,
                          AinSpacing.xl,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            child,
                            if (footer != null) ...[
                              const SizedBox(height: AinSpacing.lg),
                              const Divider(color: AinColors.line),
                              const SizedBox(height: AinSpacing.sm),
                              footer!,
                            ],
                            const SizedBox(height: AinSpacing.lg),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.verified_user_outlined,
                                  size: 15,
                                  color: AinColors.muted.withValues(alpha: 0.8),
                                ),
                                const SizedBox(width: AinSpacing.xs),
                                Flexible(
                                  child: Text(
                                    isArabic
                                        ? 'اتصال آمن وجلسات محمية'
                                        : 'Secure connection and protected sessions',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w600,
                                      color: AinColors.muted
                                          .withValues(alpha: 0.8),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AuthStepProgress extends StatelessWidget {
  const _AuthStepProgress({
    required this.currentStep,
    required this.totalSteps,
  });

  final int currentStep;
  final int totalSteps;

  @override
  Widget build(BuildContext context) {
    final safeTotal = totalSteps < 1 ? 1 : totalSteps;
    final safeCurrent = currentStep.clamp(1, safeTotal);

    return Semantics(
      label: '$safeCurrent / $safeTotal',
      child: SizedBox(
        width: 164,
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(safeTotal, (index) {
                final isComplete = index < safeCurrent;
                return Expanded(
                  child: Container(
                    height: 4,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    decoration: BoxDecoration(
                      color: isComplete
                          ? AinColors.gold
                          : Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(AinRadii.pill),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 6),
            Text(
              '$safeCurrent / $safeTotal',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.78),
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

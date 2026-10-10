import 'package:ain_mobile/src/shared/presentation/ui/ain_design_tokens.dart';
import 'package:flutter/material.dart';

class AinSurface extends StatelessWidget {
  const AinSurface({
    required this.child,
    super.key,
    this.padding = const EdgeInsets.all(AinSpacing.lg),
    this.color = AinColors.surface,
    this.borderColor,
    this.gradient,
    this.borderRadius,
    this.shadow = true,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  final Color? borderColor;
  final Gradient? gradient;
  final BorderRadiusGeometry? borderRadius;
  final bool shadow;

  @override
  Widget build(BuildContext context) {
    final effectiveRadius = borderRadius ?? BorderRadius.circular(AinRadii.lg);
    final effectiveBorderColor = borderColor ?? const Color(0x0F16458F);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: gradient == null ? color : null,
        gradient: gradient,
        borderRadius: effectiveRadius,
        border: Border.all(color: effectiveBorderColor),
        boxShadow: shadow ? AinShadows.card : null,
      ),
      child: Padding(padding: padding, child: child),
    );
  }
}

class AinIconBadge extends StatelessWidget {
  const AinIconBadge({
    required this.icon,
    super.key,
    this.backgroundColor = AinColors.brandSoft,
    this.foregroundColor = AinColors.brand,
    this.size = 46.0,
    this.iconSize = 22.0,
  });

  final IconData icon;
  final Color backgroundColor;
  final Color foregroundColor;
  final double size;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AinRadii.md),
        border: Border.all(
          color: foregroundColor.withValues(alpha: 0.12),
          width: 1,
        ),
      ),
      child: Icon(icon, color: foregroundColor, size: iconSize),
    );
  }
}

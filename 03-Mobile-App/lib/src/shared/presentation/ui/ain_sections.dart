import 'package:ain_mobile/src/shared/presentation/ui/ain_design_tokens.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_surface.dart';
import 'package:flutter/material.dart';

class AinSectionHeader extends StatelessWidget {
  const AinSectionHeader({
    required this.title,
    super.key,
    this.subtitle,
    this.action,
  });

  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 4,
          height: 22,
          margin: const EdgeInsetsDirectional.only(end: AinSpacing.sm, top: 2),
          decoration: BoxDecoration(
            gradient: AinGradients.button,
            borderRadius: BorderRadius.circular(AinRadii.pill),
          ),
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.2,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: AinSpacing.xs),
                Text(
                  subtitle!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: AinColors.muted,
                    height: 1.35,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (action != null) ...[
          const SizedBox(width: AinSpacing.md),
          action!,
        ],
      ],
    );
  }
}

class AinStatusPill extends StatelessWidget {
  const AinStatusPill({
    required this.icon,
    required this.label,
    super.key,
    this.color = AinColors.brand,
    this.backgroundColor = AinColors.brandSoft,
  });

  final IconData icon;
  final String label;
  final Color color;
  final Color backgroundColor;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AinRadii.pill),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AinSpacing.md,
          vertical: AinSpacing.sm,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: AinSpacing.xs),
            Flexible(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: color,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AinMetricCard extends StatelessWidget {
  const AinMetricCard({
    required this.icon,
    required this.label,
    required this.value,
    super.key,
    this.color = AinColors.brand,
    this.backgroundColor = AinColors.brandSoft,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final Color backgroundColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: AinColors.surface,
        borderRadius: BorderRadius.circular(AinRadii.lg),
        border: Border.all(color: AinColors.line),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinStatusPill(
              icon: icon,
              label: value,
              color: color,
              backgroundColor: backgroundColor,
            ),
            const SizedBox(height: AinSpacing.md),
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodySmall?.copyWith(
                color: AinColors.muted,
                height: 1.25,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AinEmptyState extends StatelessWidget {
  const AinEmptyState({
    required this.icon,
    required this.title,
    super.key,
    this.subtitle,
    this.action,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: AinColors.surface,
        borderRadius: BorderRadius.circular(AinRadii.lg),
        border: Border.all(color: AinColors.line),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AinIconBadge(
              icon: icon,
              backgroundColor: AinColors.canvas,
              foregroundColor: AinColors.muted,
            ),
            const SizedBox(height: AinSpacing.lg),
            Text(
              title,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: AinSpacing.sm),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AinColors.muted,
                  height: 1.35,
                ),
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: AinSpacing.lg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

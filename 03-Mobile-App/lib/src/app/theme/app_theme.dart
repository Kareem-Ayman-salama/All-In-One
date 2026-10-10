import 'package:ain_mobile/src/shared/presentation/ui/ain_design_tokens.dart';
import 'package:flutter/material.dart';

class AppTheme {
  const AppTheme._();

  static const List<String> _fontFamilyFallback = [
    'Cairo',
    'Alexandria',
    'Segoe UI',
    'SF Pro Arabic',
    'Tahoma',
    'sans-serif',
  ];

  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AinColors.brand,
      primary: AinColors.brand,
      secondary: AinColors.gold,
      surface: AinColors.surface,
      brightness: Brightness.light,
    );

    const baseTextTheme = Typography.blackMountainView;
    final textTheme = baseTextTheme.copyWith(
      displayLarge: baseTextTheme.displayLarge?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w900,
        letterSpacing: -0.5,
        color: AinColors.ink,
      ),
      displayMedium: baseTextTheme.displayMedium?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.5,
        color: AinColors.ink,
      ),
      headlineLarge: baseTextTheme.headlineLarge?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w800,
        height: 1.3,
        color: AinColors.ink,
      ),
      headlineMedium: baseTextTheme.headlineMedium?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w800,
        height: 1.3,
        color: AinColors.ink,
      ),
      headlineSmall: baseTextTheme.headlineSmall?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w700,
        height: 1.35,
        color: AinColors.ink,
      ),
      titleLarge: baseTextTheme.titleLarge?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w800,
        height: 1.35,
        color: AinColors.ink,
      ),
      titleMedium: baseTextTheme.titleMedium?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w700,
        height: 1.4,
        color: AinColors.ink,
      ),
      titleSmall: baseTextTheme.titleSmall?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w700,
        height: 1.4,
        color: AinColors.ink,
      ),
      bodyLarge: baseTextTheme.bodyLarge?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w500,
        height: 1.5,
        color: AinColors.ink,
      ),
      bodyMedium: baseTextTheme.bodyMedium?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w400,
        height: 1.5,
        color: AinColors.ink,
      ),
      bodySmall: baseTextTheme.bodySmall?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w400,
        height: 1.4,
        color: AinColors.muted,
      ),
      labelLarge: baseTextTheme.labelLarge?.copyWith(
        fontFamilyFallback: _fontFamilyFallback,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.1,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AinColors.canvas,
      visualDensity: VisualDensity.standard,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: AinColors.surface,
        foregroundColor: AinColors.ink,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          color: AinColors.ink,
          fontSize: 18,
          fontWeight: FontWeight.w800,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AinColors.surface,
        elevation: 6,
        shadowColor: const Color(0x1A0F172A),
        indicatorColor: AinColors.brandSoft,
        indicatorShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AinRadii.pill),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return TextStyle(
            color: selected ? AinColors.brand : AinColors.faint,
            fontSize: 11.5,
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
            fontFamilyFallback: _fontFamilyFallback,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: selected ? AinColors.brand : AinColors.faint,
            size: 23,
          );
        }),
      ),
      searchBarTheme: SearchBarThemeData(
        backgroundColor: const WidgetStatePropertyAll(AinColors.surface),
        elevation: const WidgetStatePropertyAll(2),
        shadowColor: WidgetStatePropertyAll(const Color(0x0A0F172A)),
        side: const WidgetStatePropertyAll(
          BorderSide(color: Color(0x1416458F)),
        ),
        shape: WidgetStatePropertyAll(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AinRadii.lg),
          ),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: AinColors.surface,
        margin: const EdgeInsets.only(bottom: AinSpacing.sm),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AinRadii.lg),
          side: const BorderSide(color: Color(0x0F16458F)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AinColors.canvasSubtle,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AinSpacing.lg,
          vertical: AinSpacing.md + 2,
        ),
        labelStyle: const TextStyle(
          color: AinColors.muted,
          fontFamilyFallback: _fontFamilyFallback,
          fontSize: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AinRadii.md),
          borderSide: const BorderSide(color: AinColors.line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AinRadii.md),
          borderSide: const BorderSide(color: AinColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AinRadii.md),
          borderSide: const BorderSide(color: AinColors.brand, width: 1.8),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AinRadii.md),
          borderSide: const BorderSide(color: AinColors.rose, width: 1.2),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          backgroundColor: AinColors.brand,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AinRadii.md),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 15,
            fontFamilyFallback: _fontFamilyFallback,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          foregroundColor: AinColors.brand,
          side: const BorderSide(color: Color(0x3316458F), width: 1.2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AinRadii.md),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            fontFamilyFallback: _fontFamilyFallback,
          ),
        ),
      ),
    );
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF60A5FA),
      brightness: Brightness.dark,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      visualDensity: VisualDensity.standard,
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AinRadii.lg),
        ),
      ),
    );
  }
}

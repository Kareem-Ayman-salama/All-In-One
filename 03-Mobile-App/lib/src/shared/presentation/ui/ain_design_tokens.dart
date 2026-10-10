import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────
//  AIN DESIGN TOKENS v2.0 — Premium Visual System
// ─────────────────────────────────────────────────────────────

class AinColors {
  const AinColors._();

  // ─── Core Neutrals ───────────────────────────────────────
  static const ink = Color(0xFF0F172A);
  static const muted = Color(0xFF64748B);
  static const faint = Color(0xFF94A3B8);
  static const line = Color(0xFFE2E8F0);
  static const borderLight = Color(0xFFF1F5F9);
  static const canvas = Color(0xFFF4F7FC);
  static const canvasSubtle = Color(0xFFF8FAFC);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceSubtle = Color(0xFFF8FAFD);

  // ─── Brand Palette ───────────────────────────────────────
  static const brand = Color(0xFF16458F);
  static const brandDark = Color(0xFF0D2D64);
  static const brandNavy = Color(0xFF0B2246);
  static const brandBlue = Color(0xFF2563EB);
  static const brandSoft = Color(0xFFEEF4FF);
  static const brandLight = Color(0xFFDBEAFE);

  // ─── Accent Colors ──────────────────────────────────────
  static const gold = Color(0xFFF59E0B);
  static const goldDark = Color(0xFFD97706);
  static const goldSoft = Color(0xFFFEF3C7);
  static const amber = Color(0xFFF59E0B);
  static const teal = Color(0xFF0F766E);
  static const tealSoft = Color(0xFFCCFBF1);
  static const cyan = Color(0xFF0284C7);
  static const cyanSoft = Color(0xFFE0F2FE);
  static const violet = Color(0xFF7C3AED);
  static const violetSoft = Color(0xFFEDE9FE);
  static const emerald = Color(0xFF059669);
  static const emeraldSoft = Color(0xFFD1FAE5);

  // ─── Semantic Colors ─────────────────────────────────────
  static const rose = Color(0xFFE11D48);
  static const roseSoft = Color(0xFFFFF1F2);
  static const success = Color(0xFF059669);
  static const successSoft = Color(0xFFECFDF5);
  static const warning = Color(0xFFD97706);
  static const warningSoft = Color(0xFFFFFBEB);

  // ─── Semantic Aliases ────────────────────────────────────
  static const textPrimary = ink;
  static const textSecondary = muted;
  static const border = line;
  static const background = canvas;
  static const accent = brandSoft;
  static const error = rose;

  // ─── Glass Effect Colors ─────────────────────────────────
  static const glassWhite = Color(0x1AFFFFFF);
  static const glassBorder = Color(0x26FFFFFF);
  static const glassOverlay = Color(0x0DFFFFFF);
}

class AinSpacing {
  const AinSpacing._();

  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
  static const xxl = 32.0;
  static const xxxl = 48.0;
}

class AinRadii {
  const AinRadii._();

  static const xs = 6.0;
  static const sm = 10.0;
  static const md = 14.0;
  static const lg = 18.0;
  static const xl = 24.0;
  static const xxl = 32.0;
  static const pill = 999.0;
  static const full = 999.0;
}

class AinShadows {
  const AinShadows._();

  static const soft = <BoxShadow>[
    BoxShadow(
      color: Color(0x0A0F172A),
      blurRadius: 14,
      offset: Offset(0, 4),
    ),
    BoxShadow(
      color: Color(0x0E0F172A),
      blurRadius: 28,
      offset: Offset(0, 10),
    ),
  ];

  static const card = <BoxShadow>[
    BoxShadow(
      color: Color(0x0816458F),
      blurRadius: 18,
      offset: Offset(0, 6),
    ),
    BoxShadow(
      color: Color(0x060F172A),
      blurRadius: 6,
      offset: Offset(0, 2),
    ),
  ];

  static const elevated = <BoxShadow>[
    BoxShadow(
      color: Color(0x1016458F),
      blurRadius: 24,
      offset: Offset(0, 8),
    ),
    BoxShadow(
      color: Color(0x0A0F172A),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];

  static const button = <BoxShadow>[
    BoxShadow(
      color: Color(0x3816458F),
      blurRadius: 18,
      offset: Offset(0, 8),
    ),
  ];

  static const float = <BoxShadow>[
    BoxShadow(
      color: Color(0x180B2246),
      blurRadius: 36,
      offset: Offset(0, 16),
    ),
  ];

  static const glow = <BoxShadow>[
    BoxShadow(
      color: Color(0x2016458F),
      blurRadius: 40,
      spreadRadius: -4,
      offset: Offset(0, 12),
    ),
  ];
}

class AinGradients {
  const AinGradients._();

  static const brand = LinearGradient(
    colors: [AinColors.brandNavy, AinColors.brand],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const hero = LinearGradient(
    colors: [Color(0xFF071B36), AinColors.brandNavy, AinColors.brand],
    begin: AlignmentDirectional.topStart,
    end: AlignmentDirectional.bottomEnd,
  );

  static const heroShimmer = LinearGradient(
    colors: [
      Color(0xFF071B36),
      Color(0xFF0D2D64),
      Color(0xFF16458F),
      Color(0xFF1E60C0),
    ],
    begin: AlignmentDirectional.topStart,
    end: AlignmentDirectional.bottomEnd,
  );

  static const button = LinearGradient(
    colors: [AinColors.brand, AinColors.brandBlue],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const gold = LinearGradient(
    colors: [AinColors.gold, AinColors.goldDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const card = LinearGradient(
    colors: [Colors.white, AinColors.canvasSubtle],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const violet = LinearGradient(
    colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const teal = LinearGradient(
    colors: [Color(0xFF0F766E), Color(0xFF0D9488)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const premium = LinearGradient(
    colors: [
      Color(0xFF0B2246),
      Color(0xFF16458F),
      Color(0xFF1E60C0),
    ],
    stops: [0.0, 0.5, 1.0],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const darkCard = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

// ─────────────────────────────────────────────────────────────
//  AIN ANIMATION TOKENS
// ─────────────────────────────────────────────────────────────
class AinDurations {
  const AinDurations._();

  static const fast = Duration(milliseconds: 150);
  static const normal = Duration(milliseconds: 250);
  static const slow = Duration(milliseconds: 400);
  static const entrance = Duration(milliseconds: 500);
  static const stagger = Duration(milliseconds: 80);
}

class AinCurves {
  const AinCurves._();

  static const standard = Curves.easeInOut;
  static const decelerate = Curves.easeOutCubic;
  static const accelerate = Curves.easeInCubic;
  static const bounce = Curves.elasticOut;
  static const overshoot = Curves.easeOutBack;
}

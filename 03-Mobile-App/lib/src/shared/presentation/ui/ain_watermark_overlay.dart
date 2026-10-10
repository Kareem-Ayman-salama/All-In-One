import 'dart:math' as math;
import 'package:flutter/material.dart';

/// A traceable watermark overlay that renders repeating, semi-transparent
/// diagonal watermarks across any content (video, document, image, or workspace).
///
/// Designed to deter unauthorized screenshots, screen recording, and content leaks
/// while preserving full touch interactivity for underlying controls via [IgnorePointer].
class AinWatermarkOverlay extends StatelessWidget {
  const AinWatermarkOverlay({
    required this.child,
    required this.email,
    this.userName,
    this.ipOrDeviceId,
    this.customText,
    this.opacity = 0.15,
    this.color,
    this.spacing = 160.0,
    this.angle = -math.pi / 6, // -30 degrees
    super.key,
  });

  final Widget child;
  final String email;
  final String? userName;
  final String? ipOrDeviceId;
  final String? customText;
  final double opacity;
  final Color? color;
  final double spacing;
  final double angle;

  @override
  Widget build(BuildContext context) {
    final effectiveColor = (color ??
            (Theme.of(context).brightness == Brightness.dark
                ? Colors.white
                : Colors.black))
        .withValues(alpha: opacity);

    final lines = <String>[
      customText ?? 'منصة عين | AIN Platform',
      if (userName != null && userName!.trim().isNotEmpty)
        '$userName ($email)'
      else
        email,
      if (ipOrDeviceId != null && ipOrDeviceId!.trim().isNotEmpty)
        'ID: $ipOrDeviceId'
      else
        'SECURE VIEWER',
    ];

    return Stack(
      fit: StackFit.passthrough,
      children: [
        child,
        Positioned.fill(
          child: IgnorePointer(
            child: RepaintBoundary(
              child: CustomPaint(
                painter: _AinWatermarkPainter(
                  lines: lines,
                  color: effectiveColor,
                  spacing: spacing,
                  angle: angle,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AinWatermarkPainter extends CustomPainter {
  const _AinWatermarkPainter({
    required this.lines,
    required this.color,
    required this.spacing,
    required this.angle,
  });

  final List<String> lines;
  final Color color;
  final double spacing;
  final double angle;

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    final textStyle = TextStyle(
      color: color,
      fontSize: 10,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.5,
      height: 1.3,
    );

    final paragraph = lines.join('\n');
    final textSpan = TextSpan(text: paragraph, style: textStyle);
    final textPainter = TextPainter(
      text: textSpan,
      textAlign: TextAlign.center,
      textDirection: TextDirection.ltr,
    )..layout();

    final stepX = math.max(140.0, spacing);
    final stepY = math.max(100.0, spacing * 0.75);

    // Cover extra margin so rotation doesn't leave unpainted corners
    final extraMargin = size.longestSide * 0.35;
    final startX = -extraMargin;
    final endX = size.width + extraMargin;
    final startY = -extraMargin;
    final endY = size.height + extraMargin;

    var row = 0;
    for (var y = startY; y < endY; y += stepY) {
      final offsetX = (row % 2 == 0) ? 0.0 : stepX / 2;
      for (var x = startX + offsetX; x < endX; x += stepX) {
        canvas.save();
        canvas.translate(x, y);
        canvas.rotate(angle);
        textPainter.paint(
          canvas,
          Offset(-textPainter.width / 2, -textPainter.height / 2),
        );
        canvas.restore();
      }
      row++;
    }
  }

  @override
  bool shouldRepaint(covariant _AinWatermarkPainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.spacing != spacing ||
        oldDelegate.angle != angle ||
        oldDelegate.lines.join('|') != lines.join('|');
  }
}

import 'package:ain_mobile/src/shared/presentation/ui/ain_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AinTextField extends StatelessWidget {
  const AinTextField({
    required this.controller,
    required this.label,
    super.key,
    this.icon,
    this.suffix,
    this.keyboardType,
    this.autofillHints,
    this.obscureText = false,
    this.validator,
    this.maxLines = 1,
    this.helperText,
    this.textInputAction,
    this.onFieldSubmitted,
    this.inputFormatters,
    this.textCapitalization = TextCapitalization.none,
    this.enabled = true,
    this.autovalidateMode = AutovalidateMode.onUserInteraction,
  });

  final TextEditingController controller;
  final String label;
  final IconData? icon;
  final Widget? suffix;
  final TextInputType? keyboardType;
  final Iterable<String>? autofillHints;
  final bool obscureText;
  final FormFieldValidator<String>? validator;
  final int? maxLines;
  final String? helperText;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onFieldSubmitted;
  final List<TextInputFormatter>? inputFormatters;
  final TextCapitalization textCapitalization;
  final bool enabled;
  final AutovalidateMode autovalidateMode;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      autofillHints: autofillHints,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      maxLines: maxLines,
      enabled: enabled,
      autovalidateMode: autovalidateMode,
      textInputAction: textInputAction,
      onFieldSubmitted: onFieldSubmitted,
      inputFormatters: inputFormatters,
      textCapitalization: textCapitalization,
      style: const TextStyle(
        fontSize: 14.5,
        fontWeight: FontWeight.w600,
        color: AinColors.ink,
      ),
      decoration: InputDecoration(
        labelText: label,
        helperText: helperText,
        helperMaxLines: 2,
        errorMaxLines: 2,
        labelStyle: const TextStyle(
          color: AinColors.muted,
          fontSize: 13.5,
          fontWeight: FontWeight.w500,
        ),
        prefixIcon: icon == null
            ? null
            : Padding(
                padding: const EdgeInsets.symmetric(horizontal: AinSpacing.md),
                child: Icon(icon, color: AinColors.brand, size: 21),
              ),
        prefixIconConstraints: const BoxConstraints(
          minWidth: 44,
          minHeight: 44,
        ),
        suffixIcon: suffix,
        filled: true,
        fillColor: AinColors.canvasSubtle,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AinSpacing.lg,
          vertical: AinSpacing.md + 2,
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
    );
  }
}

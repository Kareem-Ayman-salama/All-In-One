import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final appLocaleControllerProvider =
    NotifierProvider<AppLocaleController, Locale>(AppLocaleController.new);

class AppLocaleController extends Notifier<Locale> {
  @override
  Locale build() {
    return const Locale('ar');
  }

  void setLocale(Locale locale) {
    state = locale;
  }
}

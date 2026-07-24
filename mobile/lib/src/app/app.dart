import 'package:ain_mobile/src/app/localization/app_locale_controller.dart';
import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/app/router/app_router.dart';
import 'package:ain_mobile/src/app/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AinMobileApp extends ConsumerWidget {
  const AinMobileApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final locale = ref.watch(appLocaleControllerProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'AIN',
      locale: locale,
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: const [
        AppStringsDelegate(),
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ],
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      routerConfig: router,
    );
  }
}

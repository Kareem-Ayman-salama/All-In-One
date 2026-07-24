import 'package:ain_mobile/src/app/app.dart';
import 'package:ain_mobile/src/app/configuration/app_environment.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

Future<void> bootstrap(AppEnvironment environment) async {
  WidgetsFlutterBinding.ensureInitialized();
  environment.validate();

  runApp(
    ProviderScope(
      overrides: [appEnvironmentProvider.overrideWithValue(environment)],
      child: const AinMobileApp(),
    ),
  );
}

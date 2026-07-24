import 'package:ain_mobile/bootstrap.dart';
import 'package:ain_mobile/src/app/configuration/app_environment.dart';

Future<void> main() async {
  await bootstrap(AppEnvironment.fromDartDefines());
}


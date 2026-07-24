import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AppFlavor { development, staging, production }

final appEnvironmentProvider = Provider<AppEnvironment>(
  (ref) => throw UnimplementedError('AppEnvironment must be overridden.'),
);

class AppEnvironment {
  const AppEnvironment({
    required this.flavor,
    required this.apiBaseUrl,
    required this.enableCrashReporting,
    required this.allowMockData,
  });

  factory AppEnvironment.fromDartDefines() {
    final flavorName = const String.fromEnvironment(
      'AIN_FLAVOR',
      defaultValue: 'development',
    );
    final apiBaseUrl = const String.fromEnvironment(
      'AIN_API_BASE_URL',
      defaultValue: 'http://localhost:8000/api/v1',
    );

    return AppEnvironment(
      flavor: AppFlavor.values.byName(flavorName),
      apiBaseUrl: apiBaseUrl,
      enableCrashReporting: const bool.fromEnvironment(
        'AIN_ENABLE_CRASH_REPORTING',
      ),
      allowMockData: const bool.fromEnvironment('AIN_ALLOW_MOCK_DATA'),
    );
  }

  final AppFlavor flavor;
  final String apiBaseUrl;
  final bool enableCrashReporting;
  final bool allowMockData;

  bool get isProduction => flavor == AppFlavor.production;

  void validate() {
    final uri = Uri.tryParse(apiBaseUrl);

    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      throw StateError('AIN_API_BASE_URL must be an absolute URL.');
    }

    if (isProduction && uri.scheme != 'https') {
      throw StateError('Production builds must use HTTPS API URLs.');
    }

    if (isProduction && allowMockData) {
      throw StateError('Production builds cannot enable mock data.');
    }
  }
}

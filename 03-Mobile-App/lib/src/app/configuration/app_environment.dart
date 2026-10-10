import 'package:flutter/foundation.dart';
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
    required this.enableFirebase,
    required this.allowMockData,
  });

  factory AppEnvironment.fromDartDefines() {
    final flavorName = const String.fromEnvironment(
      'AIN_FLAVOR',
      defaultValue: 'development',
    );

    final isProd = flavorName == 'production';
    final defaultUrl = isProd
        ? 'https://api.ain-platform.com/api/v1'
        : (defaultTargetPlatform == TargetPlatform.android
            ? 'http://10.0.2.2:8000/api/v1'
            : 'http://localhost:8000/api/v1');

    final apiBaseUrl = const String.fromEnvironment(
      'AIN_API_BASE_URL',
      defaultValue: '',
    );

    return AppEnvironment(
      flavor: AppFlavor.values.byName(flavorName),
      apiBaseUrl: apiBaseUrl.isNotEmpty ? apiBaseUrl : defaultUrl,
      enableCrashReporting: const bool.fromEnvironment(
        'AIN_ENABLE_CRASH_REPORTING',
      ),
      enableFirebase: const bool.fromEnvironment('AIN_ENABLE_FIREBASE'),
      allowMockData: isProd
          ? false
          : const bool.fromEnvironment(
              'AIN_ALLOW_MOCK_DATA',
              defaultValue: true,
            ),
    );
  }

  final AppFlavor flavor;
  final String apiBaseUrl;
  final bool enableCrashReporting;
  final bool enableFirebase;
  final bool allowMockData;

  bool get isProduction => flavor == AppFlavor.production;

  void validate() {
    final uri = Uri.tryParse(apiBaseUrl);

    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      if (isProduction) {
        throw StateError(
          'Production builds must have a valid absolute URL for AIN_API_BASE_URL: $apiBaseUrl',
        );
      }
      debugPrint(
        'WARNING: AIN_API_BASE_URL is not an absolute URL: $apiBaseUrl',
      );
      return;
    }

    if (isProduction && uri.scheme != 'https') {
      throw StateError(
        'Production builds must use HTTPS API URLs: $apiBaseUrl',
      );
    }

    if (isProduction && allowMockData) {
      throw StateError('Production builds cannot enable mock data');
    }
  }
}

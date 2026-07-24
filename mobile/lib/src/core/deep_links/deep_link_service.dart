import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:ain_mobile/src/features/metadata/data/metadata_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final deepLinkServiceProvider = Provider<DeepLinkService>((ref) {
  return DeepLinkService(
    metadataRepository: ref.watch(metadataRepositoryProvider),
  );
});

class DeepLinkService {
  const DeepLinkService({
    required MetadataRepository metadataRepository,
  }) : _metadataRepository = metadataRepository;

  final MetadataRepository _metadataRepository;

  Future<ResolvedDeepLink?> resolve(Uri uri) async {
    final manifest = await _metadataRepository.getDeepLinks();
    final routes = readJsonObject(manifest['routes']);

    for (final entry in routes.entries) {
      final route = DeepLinkRoute.fromJson(
        name: entry.key,
        json: readJsonObject(entry.value),
      );
      final parameters = route.match(uri);
      if (parameters != null) {
        return ResolvedDeepLink(
          routeName: route.name,
          mobileScreen: route.mobileScreen,
          requiresAuth: route.requiresAuth,
          parameters: parameters,
          query: uri.queryParameters,
          fallbackPath: route.fallbackPath,
        );
      }
    }

    return null;
  }
}

class DeepLinkRoute {
  const DeepLinkRoute({
    required this.name,
    required this.path,
    required this.mobileScreen,
    required this.requiresAuth,
    required this.fallbackPath,
  });

  factory DeepLinkRoute.fromJson({
    required String name,
    required Map<String, Object?> json,
  }) {
    return DeepLinkRoute(
      name: name,
      path: json['path'] as String? ?? '',
      mobileScreen: json['mobileScreen'] as String? ?? '',
      requiresAuth: json['requiresAuth'] as bool? ?? true,
      fallbackPath: json['fallbackPath'] as String? ?? '/login',
    );
  }

  final String name;
  final String path;
  final String mobileScreen;
  final bool requiresAuth;
  final String fallbackPath;

  Map<String, String>? match(Uri uri) {
    final expectedSegments = Uri.parse(path).pathSegments;
    final actualSegments = uri.pathSegments;
    if (expectedSegments.length != actualSegments.length) {
      return null;
    }

    final parameters = <String, String>{};
    for (var index = 0; index < expectedSegments.length; index += 1) {
      final expected = expectedSegments[index];
      final actual = actualSegments[index];
      final isParameter = expected.startsWith('{') && expected.endsWith('}');

      if (isParameter) {
        parameters[expected.substring(1, expected.length - 1)] = actual;
      } else if (expected != actual) {
        return null;
      }
    }

    return parameters;
  }
}

class ResolvedDeepLink {
  const ResolvedDeepLink({
    required this.routeName,
    required this.mobileScreen,
    required this.requiresAuth,
    required this.parameters,
    required this.query,
    required this.fallbackPath,
  });

  final String routeName;
  final String mobileScreen;
  final bool requiresAuth;
  final Map<String, String> parameters;
  final Map<String, String> query;
  final String fallbackPath;
}


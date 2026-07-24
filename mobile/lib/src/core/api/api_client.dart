import 'package:ain_mobile/src/app/configuration/app_environment.dart';
import 'package:ain_mobile/src/core/api/request_id.dart';
import 'package:ain_mobile/src/core/auth/secure_token_store.dart';
import 'package:ain_mobile/src/core/auth/token_refresh_coordinator.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final dioProvider = Provider<Dio>((ref) {
  final environment = ref.watch(appEnvironmentProvider);
  final tokenStore = ref.watch(secureTokenStoreProvider);
  final requestIdFactory = RequestIdFactory();

  final dio = Dio(
    BaseOptions(
      baseUrl: environment.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: const {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-AIN-Client': 'flutter',
      },
    ),
  );
  final tokenRefreshCoordinator = TokenRefreshCoordinator(
    dio: dio,
    tokenStore: tokenStore,
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final accessToken = await tokenStore.readAccessToken();
        options.headers['X-Request-ID'] = requestIdFactory.create();
        options.headers['X-AIN-Platform'] = _mobilePlatformName();
        options.headers['X-AIN-App-Version'] = const String.fromEnvironment(
          'AIN_APP_VERSION',
          defaultValue: '0.1.0',
        );
        if (accessToken != null && accessToken.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $accessToken';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (tokenRefreshCoordinator.shouldAttemptRefresh(error)) {
          final accessToken = await tokenRefreshCoordinator
              .refreshAccessToken();
          if (accessToken != null && accessToken.isNotEmpty) {
            error.requestOptions.headers['Authorization'] =
                'Bearer $accessToken';
            error.requestOptions.headers['X-Request-ID'] = requestIdFactory
                .create();
            error.requestOptions.extra[TokenRefreshCoordinator
                    .retriedAfterRefreshExtraKey] =
                true;

            final response = await dio.fetch<Object?>(error.requestOptions);
            handler.resolve(response);
            return;
          }
        }

        handler.next(redactSensitiveDioError(error));
      },
    ),
  );

  return dio;
});

String _mobilePlatformName() {
  return switch (defaultTargetPlatform) {
    TargetPlatform.iOS => 'ios',
    TargetPlatform.android => 'android',
    _ => 'web',
  };
}

DioException redactSensitiveDioError(DioException error) {
  final requestOptions = error.requestOptions;
  requestOptions.headers.remove('Authorization');

  return error.copyWith(requestOptions: requestOptions);
}

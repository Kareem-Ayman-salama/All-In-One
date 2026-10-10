import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureTokenStoreProvider = Provider<SecureTokenStore>((ref) {
  return SecureTokenStore(storage: const FlutterSecureStorage());
});

class SecureTokenStore {
  const SecureTokenStore({required FlutterSecureStorage storage})
      : _storage = storage;

  static const _accessTokenKey = 'ain.access_token';
  static const _refreshTokenKey = 'ain.refresh_token';
  static const _installationIdKey = 'ain.installation_id';

  final FlutterSecureStorage _storage;

  Future<String?> readAccessToken() => _storage.read(key: _accessTokenKey);

  Future<String?> readRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<String?> readInstallationId() =>
      _storage.read(key: _installationIdKey);

  Future<void> writeTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<void> writeInstallationId(String installationId) {
    return _storage.write(key: _installationIdKey, value: installationId);
  }

  Future<void> clearSession() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  Future<void> clearAll() => _storage.deleteAll();
}

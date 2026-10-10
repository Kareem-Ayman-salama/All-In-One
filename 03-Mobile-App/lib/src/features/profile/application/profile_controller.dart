import 'package:ain_mobile/src/features/auth/data/auth_repository.dart';
import 'package:ain_mobile/src/features/profile/data/profile_documents_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final currentUserProfileProvider =
    FutureProvider.autoDispose<CurrentUserProfile>((ref) {
  return ref.watch(authRepositoryProvider).currentUser();
});

final userSessionsProvider =
    FutureProvider.autoDispose<List<UserSessionSummary>>((ref) {
  return ref.watch(authRepositoryProvider).listSessions();
});

final studentCertificatesProvider =
    FutureProvider.autoDispose<List<StudentCertificate>>((ref) {
  return ref.watch(profileDocumentsRepositoryProvider).listCertificates();
});

final studentInvoicesProvider =
    FutureProvider.autoDispose<List<StudentInvoice>>((ref) {
  return ref.watch(profileDocumentsRepositoryProvider).listInvoices();
});

final profileActionsProvider = Provider<ProfileActions>((ref) {
  return ProfileActions(ref);
});

class ProfileActions {
  const ProfileActions(this._ref);

  final Ref _ref;

  Future<CurrentUserProfile> updateProfile({
    required UpdateUserProfileCommand command,
  }) async {
    final profile = await _ref.read(authRepositoryProvider).updateProfile(
          command,
        );
    _ref.invalidate(currentUserProfileProvider);

    return profile;
  }

  Future<void> revokeSession(String sessionId) async {
    await _ref.read(authRepositoryProvider).revokeSession(sessionId);
    _ref.invalidate(userSessionsProvider);
  }

  Future<void> revokeOtherSessions() async {
    await _ref.read(authRepositoryProvider).revokeOtherSessions();
    _ref.invalidate(userSessionsProvider);
  }
}

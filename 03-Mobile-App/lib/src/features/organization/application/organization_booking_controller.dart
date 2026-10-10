import 'package:ain_mobile/src/features/organization/data/organization_booking_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationBookingsProvider = FutureProvider.autoDispose
    .family<List<OrganizationBookingSummary>, String>((ref, organizationId) {
  return ref
      .watch(organizationBookingRepositoryProvider)
      .listBookings(organizationId: organizationId);
});

final organizationBookingActionsProvider = Provider<OrganizationBookingActions>(
  (ref) {
    return OrganizationBookingActions(ref);
  },
);

class OrganizationBookingActions {
  const OrganizationBookingActions(this._ref);

  final Ref _ref;

  Future<void> confirm({
    required String organizationId,
    required String bookingId,
    bool markAsPaid = false,
  }) async {
    await _ref.read(organizationBookingRepositoryProvider).confirmBooking(
          organizationId: organizationId,
          bookingId: bookingId,
          markAsPaid: markAsPaid,
        );
    _ref.invalidate(organizationBookingsProvider(organizationId));
  }

  Future<void> reject({
    required String organizationId,
    required String bookingId,
  }) async {
    await _ref
        .read(organizationBookingRepositoryProvider)
        .rejectBooking(organizationId: organizationId, bookingId: bookingId);
    _ref.invalidate(organizationBookingsProvider(organizationId));
  }

  Future<void> cancel({
    required String organizationId,
    required String bookingId,
  }) async {
    await _ref
        .read(organizationBookingRepositoryProvider)
        .cancelBooking(organizationId: organizationId, bookingId: bookingId);
    _ref.invalidate(organizationBookingsProvider(organizationId));
  }
}

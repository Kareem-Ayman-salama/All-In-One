import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_booking_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_booking_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationBookingsPage extends ConsumerWidget {
  const OrganizationBookingsPage({super.key});

  static const routePath = '/organization/bookings';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationBookings)),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final bookings =
                ref.watch(organizationBookingsProvider(workspace.organizationId));
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationBookingsProvider(workspace.organizationId).future,
                );
              },
              child: bookings.when(
                data: (items) => _BookingsList(
                  organizationId: workspace.organizationId,
                  bookings: items,
                ),
                error: (error, stackTrace) => ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    const Icon(Icons.cloud_off, size: 48),
                    const SizedBox(height: 12),
                    Text(error.toString(), textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: () {
                        ref.invalidate(
                          organizationBookingsProvider(workspace.organizationId),
                        );
                      },
                      icon: const Icon(Icons.refresh),
                      label: Text(strings.retry),
                    ),
                  ],
                ),
                loading: () => Center(
                  child: Semantics(
                    label: strings.loading,
                    child: const CircularProgressIndicator(),
                  ),
                ),
              ),
            );
          },
          error: (error, stackTrace) => Center(child: Text(error.toString())),
          loading: () => Center(
            child: Semantics(
              label: strings.loading,
              child: const CircularProgressIndicator(),
            ),
          ),
        ),
      ),
    );
  }
}

class _NoWorkspace extends StatelessWidget {
  const _NoWorkspace({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.business, size: 56),
        const SizedBox(height: 12),
        Text(
          strings.chooseWorkspace,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: () => context.go(WorkspaceSelectionPage.routePath),
          child: Text(strings.chooseWorkspace),
        ),
      ],
    );
  }
}

class _BookingsList extends StatelessWidget {
  const _BookingsList({
    required this.organizationId,
    required this.bookings,
  });

  final String organizationId;
  final List<OrganizationBookingSummary> bookings;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final pendingCount = bookings.where((booking) => booking.isPending).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.organizationBookings,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(strings.organizationBookingsHint),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                icon: Icons.pending_actions,
                label: strings.pendingBookings,
                value: pendingCount.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatTile(
                icon: Icons.receipt_long,
                label: strings.bookingRequests,
                value: bookings.length.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (bookings.isEmpty)
          Text(strings.noBookingRequests)
        else
          for (final booking in bookings)
            _OrganizationBookingCard(
              organizationId: organizationId,
              booking: booking,
            ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.titleLarge),
            Text(label),
          ],
        ),
      ),
    );
  }
}

class _OrganizationBookingCard extends ConsumerWidget {
  const _OrganizationBookingCard({
    required this.organizationId,
    required this.booking,
  });

  final String organizationId;
  final OrganizationBookingSummary booking;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final courseTitle = booking.course?.title ?? strings.course;
    final batchTitle = booking.batch?.title ?? strings.batch;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              booking.studentName,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(courseTitle),
            Text(batchTitle),
            const SizedBox(height: 4),
            Text('${booking.email} | ${booking.phone}'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(label: Text(strings.bookingStatusLabel(booking.status))),
                Chip(label: Text(booking.paymentStatus)),
                Chip(
                  label: Text(
                    strings.priceFromMinor(
                      booking.amountMinor,
                      booking.currency,
                    ),
                  ),
                ),
              ],
            ),
            if (booking.isPending) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => _confirm(ref),
                      icon: const Icon(Icons.check),
                      label: Text(strings.confirmBooking),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filledTonal(
                    tooltip: strings.rejectBooking,
                    onPressed: () => _reject(ref),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ] else ...[
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => _cancel(ref),
                icon: const Icon(Icons.block),
                label: Text(strings.cancelBooking),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _confirm(WidgetRef ref) {
    return ref.read(organizationBookingActionsProvider).confirm(
          organizationId: organizationId,
          bookingId: booking.id,
          markAsPaid: true,
        );
  }

  Future<void> _reject(WidgetRef ref) {
    return ref.read(organizationBookingActionsProvider).reject(
          organizationId: organizationId,
          bookingId: booking.id,
        );
  }

  Future<void> _cancel(WidgetRef ref) {
    return ref.read(organizationBookingActionsProvider).cancel(
          organizationId: organizationId,
          bookingId: booking.id,
        );
  }
}

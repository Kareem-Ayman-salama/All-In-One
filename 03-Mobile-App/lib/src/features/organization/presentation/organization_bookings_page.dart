import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_booking_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_booking_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
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

            final bookings = ref.watch(
              organizationBookingsProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationBookingsProvider(workspace.organizationId).future,
                );
              },
              child: bookings.when(
                data: (items) => _BookingsList(
                  organizationId: workspace.organizationId,
                  workspace: workspace,
                  bookings: items,
                ),
                error: (error, stackTrace) => ListView(
                  padding: const EdgeInsets.all(AinSpacing.lg),
                  children: [
                    AinEmptyState(
                      icon: Icons.cloud_off_outlined,
                      title: error.toString(),
                      action: AinPrimaryButton(
                        onPressed: () {
                          ref.invalidate(
                            organizationBookingsProvider(
                              workspace.organizationId,
                            ),
                          );
                        },
                        icon: Icons.refresh,
                        label: strings.retry,
                      ),
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
          error: (error, stackTrace) => ListView(
            padding: const EdgeInsets.all(AinSpacing.lg),
            children: [
              AinEmptyState(
                icon: Icons.cloud_off_outlined,
                title: error.toString(),
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
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        AinEmptyState(
          icon: Icons.business_outlined,
          title: strings.chooseWorkspace,
          action: AinPrimaryButton(
            onPressed: () => context.go(WorkspaceSelectionPage.routePath),
            label: strings.chooseWorkspace,
            icon: Icons.business_center_outlined,
          ),
        ),
      ],
    );
  }
}

class _BookingsList extends StatelessWidget {
  const _BookingsList({
    required this.organizationId,
    required this.workspace,
    required this.bookings,
  });

  final String organizationId;
  final ActiveWorkspace workspace;
  final List<OrganizationBookingSummary> bookings;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final pendingCount = bookings.where((booking) => booking.isPending).length;

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _BookingsHero(
          title: strings.organizationBookings,
          subtitle: strings.organizationBookingsHint,
          pendingCount: pendingCount,
          totalCount: bookings.length,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.pending_actions,
                label: strings.pendingBookings,
                value: pendingCount.toString(),
                color: AinColors.warning,
                backgroundColor: AinColors.warningSoft,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.receipt_long,
                label: strings.bookingRequests,
                value: bookings.length.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.bookingRequests),
        const SizedBox(height: AinSpacing.md),
        if (bookings.isEmpty)
          AinEmptyState(
            icon: Icons.receipt_long_outlined,
            title: strings.noBookingRequests,
          )
        else
          for (final booking in bookings)
            _OrganizationBookingCard(
              organizationId: organizationId,
              workspace: workspace,
              booking: booking,
            ),
      ],
    );
  }
}

class _BookingsHero extends StatelessWidget {
  const _BookingsHero({
    required this.title,
    required this.subtitle,
    required this.pendingCount,
    required this.totalCount,
  });

  final String title;
  final String subtitle;
  final int pendingCount;
  final int totalCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AinColors.brand, AinColors.brandDark],
        ),
        borderRadius: BorderRadius.circular(AinRadii.lg),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AinIconBadge(
              icon: Icons.receipt_long_outlined,
              backgroundColor: Color(0x29FFFFFF),
              foregroundColor: Colors.white,
            ),
            const SizedBox(height: AinSpacing.lg),
            Text(
              title,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: AinSpacing.sm),
            Text(
              subtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.86),
                height: 1.35,
              ),
            ),
            const SizedBox(height: AinSpacing.lg),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: Icons.pending_actions,
                  label: pendingCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.receipt_long,
                  label: totalCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OrganizationBookingCard extends ConsumerWidget {
  const _OrganizationBookingCard({
    required this.organizationId,
    required this.workspace,
    required this.booking,
  });

  final String organizationId;
  final ActiveWorkspace workspace;
  final OrganizationBookingSummary booking;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final courseTitle = booking.course?.title ?? strings.course;
    final batchTitle = booking.batch?.title ?? strings.batch;
    final canConfirm = workspace.hasAnyPermission({'bookings.confirm'});
    final canReject = workspace.hasAnyPermission({'bookings.manage'});
    final canCancel = workspace.hasAnyPermission({'bookings.cancel'});

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AinIconBadge(
                  icon: Icons.person_outline,
                  backgroundColor: _bookingStatusBackground(booking.status),
                  foregroundColor: _bookingStatusColor(booking.status),
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        booking.studentName,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: AinSpacing.xs),
                      Text(
                        '$courseTitle | $batchTitle',
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: AinColors.muted),
                      ),
                      const SizedBox(height: AinSpacing.xs),
                      Text(
                        '${booking.email} | ${booking.phone}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AinColors.faint,
                              height: 1.3,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: Icons.flag_outlined,
                  label: strings.bookingStatusLabel(booking.status),
                  color: _bookingStatusColor(booking.status),
                  backgroundColor: _bookingStatusBackground(booking.status),
                ),
                AinStatusPill(
                  icon: Icons.payments_outlined,
                  label: booking.paymentStatus,
                  color: AinColors.teal,
                  backgroundColor: AinColors.tealSoft,
                ),
                AinStatusPill(
                  icon: Icons.sell_outlined,
                  label: strings.priceFromMinor(
                    booking.amountMinor,
                    booking.currency,
                  ),
                ),
              ],
            ),
            if (booking.isPending && (canConfirm || canReject)) ...[
              const SizedBox(height: AinSpacing.md),
              Row(
                children: [
                  if (canConfirm)
                    Expanded(
                      child: AinPrimaryButton(
                        onPressed: () => _confirm(ref),
                        icon: Icons.check,
                        label: strings.confirmBooking,
                      ),
                    ),
                  if (canConfirm && canReject)
                    const SizedBox(width: AinSpacing.sm),
                  if (canReject)
                    IconButton.filledTonal(
                      tooltip: strings.rejectBooking,
                      onPressed: () => _reject(ref),
                      icon: const Icon(Icons.close),
                    ),
                ],
              ),
            ] else if (!booking.isPending && canCancel) ...[
              const SizedBox(height: AinSpacing.md),
              AinSecondaryButton(
                onPressed: () => _cancel(ref),
                icon: Icons.block,
                label: strings.cancelBooking,
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
    return ref
        .read(organizationBookingActionsProvider)
        .reject(organizationId: organizationId, bookingId: booking.id);
  }

  Future<void> _cancel(WidgetRef ref) {
    return ref
        .read(organizationBookingActionsProvider)
        .cancel(organizationId: organizationId, bookingId: booking.id);
  }
}

Color _bookingStatusColor(String status) {
  return switch (status) {
    'pending_confirmation' || 'pending' => AinColors.warning,
    'confirmed' || 'paid' => AinColors.success,
    'rejected' || 'cancelled' || 'canceled' => AinColors.rose,
    _ => AinColors.brand,
  };
}

Color _bookingStatusBackground(String status) {
  return switch (status) {
    'pending_confirmation' || 'pending' => AinColors.warningSoft,
    'confirmed' || 'paid' => AinColors.successSoft,
    'rejected' || 'cancelled' || 'canceled' => AinColors.roseSoft,
    _ => AinColors.brandSoft,
  };
}

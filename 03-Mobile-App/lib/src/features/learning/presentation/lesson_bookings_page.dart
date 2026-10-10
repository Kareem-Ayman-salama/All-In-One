import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/learning/application/lesson_booking_controller.dart';
import 'package:ain_mobile/src/features/learning/data/lesson_booking_repository.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class LessonBookingsPage extends ConsumerWidget {
  const LessonBookingsPage({super.key});

  static const routePath = '/lesson-bookings';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final catalog = ref.watch(lessonBookingCatalogProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(strings.lessonBookings),
          bottom: TabBar(
            tabs: [
              Tab(text: strings.availableInstructors),
              Tab(text: strings.myLessonBookings),
            ],
          ),
        ),
        body: SafeArea(
          child: RefreshIndicator(
            onRefresh: () => ref.refresh(lessonBookingCatalogProvider.future),
            child: catalog.when(
              data: (data) => TabBarView(
                children: [
                  _InstructorList(catalog: data),
                  _LessonBookingList(bookings: data.bookings),
                ],
              ),
              error: (error, stackTrace) => ListView(
                padding: const EdgeInsets.all(AinSpacing.lg),
                children: [
                  AinEmptyState(
                    icon: Icons.cloud_off_outlined,
                    title: error.toString(),
                    action: AinPrimaryButton(
                      onPressed: () =>
                          ref.invalidate(lessonBookingCatalogProvider),
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
          ),
        ),
      ),
    );
  }
}

class _InstructorList extends StatelessWidget {
  const _InstructorList({required this.catalog});

  final LessonBookingCatalog catalog;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final instructors = catalog.instructors
        .where((instructor) => instructor.openSlots.isNotEmpty)
        .toList(growable: false);

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _BookingHero(
          title: strings.lessonBookings,
          subtitle: strings.bookTeacherHint,
          availableInstructors: instructors.length,
          availableSlots: catalog.availableSlotCount,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.person_search,
                label: strings.availableInstructors,
                value: instructors.length.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.event_available,
                label: strings.availableSlots,
                value: catalog.availableSlotCount.toString(),
                color: AinColors.teal,
                backgroundColor: AinColors.tealSoft,
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.lg),
        if (instructors.isEmpty)
          AinEmptyState(
            icon: Icons.event_busy_outlined,
            title: strings.noAvailableLessonSlots,
          )
        else
          for (final instructor in instructors)
            _InstructorCard(instructor: instructor),
      ],
    );
  }
}

class _InstructorCard extends StatelessWidget {
  const _InstructorCard({required this.instructor});

  final LessonInstructorSummary instructor;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final firstSlot = instructor.openSlots.first;

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
                const AinIconBadge(
                  icon: Icons.school_outlined,
                  backgroundColor: AinColors.brandSoft,
                  foregroundColor: AinColors.brand,
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        instructor.localizedName(strings.isArabic),
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: AinSpacing.xs),
                      Text(
                        [
                          instructor.localizedBio(strings.isArabic),
                          if (instructor.specialties.isNotEmpty)
                            instructor.specialties.join(', '),
                        ].whereType<String>().join('\n'),
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: AinColors.muted, height: 1.35),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                AinStatusPill(
                  icon: Icons.schedule,
                  label: strings.startsAtLabel(firstSlot.startsAt),
                ),
                AinStatusPill(
                  icon: Icons.video_call_outlined,
                  label: firstSlot.deliveryType,
                  color: AinColors.cyan,
                  backgroundColor: AinColors.cyanSoft,
                ),
                AinStatusPill(
                  icon: Icons.payments_outlined,
                  label: strings.priceFromMinor(
                    firstSlot.priceMinor,
                    firstSlot.currency,
                  ),
                  color: AinColors.teal,
                  backgroundColor: AinColors.tealSoft,
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            AinPrimaryButton(
              onPressed: () => showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                builder: (context) => _ReserveLessonSheet(
                  instructor: instructor,
                ),
              ),
              icon: Icons.calendar_month,
              label: strings.reserveLesson,
            ),
          ],
        ),
      ),
    );
  }
}

class _ReserveLessonSheet extends ConsumerStatefulWidget {
  const _ReserveLessonSheet({required this.instructor});

  final LessonInstructorSummary instructor;

  @override
  ConsumerState<_ReserveLessonSheet> createState() =>
      _ReserveLessonSheetState();
}

class _ReserveLessonSheetState extends ConsumerState<_ReserveLessonSheet> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _phoneController = TextEditingController();
  final _noteController = TextEditingController();
  late String _slotId;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _slotId = widget.instructor.openSlots.first.id;
    _subjectController.text = widget.instructor.specialties.isEmpty
        ? ''
        : widget.instructor.specialties.first;
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _phoneController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Form(
        key: _formKey,
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(AinSpacing.lg),
          children: [
            Text(
              strings.reserveLesson,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: AinSpacing.md),
            DropdownButtonFormField<String>(
              initialValue: _slotId,
              decoration: InputDecoration(labelText: strings.lessonTime),
              items: [
                for (final slot in widget.instructor.openSlots)
                  DropdownMenuItem(
                    value: slot.id,
                    child: Text(
                      '${slot.startsAt} - ${strings.priceFromMinor(
                        slot.priceMinor,
                        slot.currency,
                      )}',
                    ),
                  ),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() => _slotId = value);
                }
              },
            ),
            const SizedBox(height: AinSpacing.md),
            AinTextField(
              controller: _subjectController,
              label: strings.lessonSubject,
              icon: Icons.menu_book_outlined,
              validator: (value) => value == null || value.trim().isEmpty
                  ? strings.lessonSubjectRequired
                  : null,
            ),
            const SizedBox(height: AinSpacing.md),
            AinTextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              label: strings.contactPhone,
              icon: Icons.phone_outlined,
              validator: (value) => value == null || value.trim().length < 7
                  ? strings.contactPhoneRequired
                  : null,
            ),
            const SizedBox(height: AinSpacing.md),
            AinTextField(
              controller: _noteController,
              maxLines: 3,
              label: strings.optionalNote,
              icon: Icons.notes_outlined,
            ),
            const SizedBox(height: AinSpacing.lg),
            AinPrimaryButton(
              onPressed: _submitting ? null : _submit,
              icon: Icons.check,
              label: strings.confirmBooking,
              loading: _submitting,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _submitting = true);
    final strings = AppStrings.of(context);
    try {
      await ref.read(lessonBookingActionsProvider).reserve(
            command: ReserveLessonBookingCommand(
              slotId: _slotId,
              subject: _subjectController.text,
              studentPhone: _phoneController.text,
              note: _noteController.text,
            ),
          );
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.lessonReserved)),
        );
      }
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}

class _LessonBookingList extends ConsumerWidget {
  const _LessonBookingList({required this.bookings});

  final List<LessonBookingSummary> bookings;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        if (bookings.isEmpty)
          AinEmptyState(
            icon: Icons.event_note_outlined,
            title: strings.noLessonBookings,
          )
        else
          for (final booking in bookings)
            Padding(
              padding: const EdgeInsets.only(bottom: AinSpacing.md),
              child: AinSurface(
                padding: const EdgeInsets.all(AinSpacing.lg),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const AinIconBadge(
                      icon: Icons.school_outlined,
                      backgroundColor: AinColors.brandSoft,
                      foregroundColor: AinColors.brand,
                    ),
                    const SizedBox(width: AinSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            booking.subject,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: AinSpacing.xs),
                          Text(
                            [
                              booking.instructor?.localizedName(
                                strings.isArabic,
                              ),
                              booking.slot?.startsAt,
                              strings.priceFromMinor(
                                booking.amountMinor,
                                booking.currency,
                              ),
                            ].whereType<String>().join(' | '),
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: AinColors.muted),
                          ),
                          const SizedBox(height: AinSpacing.sm),
                          AinStatusPill(
                            icon: Icons.verified_outlined,
                            label: booking.status,
                            color: _bookingStatusColor(booking.status),
                            backgroundColor:
                                _bookingStatusBackground(booking.status),
                          ),
                        ],
                      ),
                    ),
                    if (booking.canCancel) ...[
                      const SizedBox(width: AinSpacing.sm),
                      TextButton(
                        onPressed: () => _cancel(context, ref, booking),
                        child: Text(strings.cancelBooking),
                      ),
                    ],
                  ],
                ),
              ),
            ),
      ],
    );
  }

  Future<void> _cancel(
    BuildContext context,
    WidgetRef ref,
    LessonBookingSummary booking,
  ) async {
    final strings = AppStrings.of(context);
    try {
      await ref.read(lessonBookingActionsProvider).cancel(booking.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.lessonCancelled)),
        );
      }
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }
}

class _BookingHero extends StatelessWidget {
  const _BookingHero({
    required this.title,
    required this.subtitle,
    required this.availableInstructors,
    required this.availableSlots,
  });

  final String title;
  final String subtitle;
  final int availableInstructors;
  final int availableSlots;

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
              icon: Icons.calendar_month_outlined,
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
                  icon: Icons.person_search,
                  label: availableInstructors.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.event_available,
                  label: availableSlots.toString(),
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

Color _bookingStatusColor(String status) {
  return switch (status.toLowerCase()) {
    'cancelled' || 'canceled' => AinColors.rose,
    'completed' || 'confirmed' => AinColors.success,
    'pending' => AinColors.warning,
    _ => AinColors.brand,
  };
}

Color _bookingStatusBackground(String status) {
  return switch (status.toLowerCase()) {
    'cancelled' || 'canceled' => AinColors.roseSoft,
    'completed' || 'confirmed' => AinColors.successSoft,
    'pending' => AinColors.warningSoft,
    _ => AinColors.brandSoft,
  };
}

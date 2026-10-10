import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/marketplace/application/public_course_catalog_controller.dart';
import 'package:ain_mobile/src/features/marketplace/data/public_course_repository.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/booking_success_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class CourseDetailPage extends ConsumerStatefulWidget {
  const CourseDetailPage({required this.courseSlug, super.key});

  static const routePath = '/explore/course/:courseSlug';

  final String courseSlug;

  static String location(String courseSlug) {
    return '/explore/course/$courseSlug';
  }

  @override
  ConsumerState<CourseDetailPage> createState() => _CourseDetailPageState();
}

class _CourseDetailPageState extends ConsumerState<CourseDetailPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  String? _selectedBatchId;
  String _paymentMethod = 'card';
  bool _acceptedTerms = false;
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final course = ref.watch(publicCourseDetailProvider(widget.courseSlug));

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.courseDetails),
        leading: IconButton(
          tooltip: strings.back,
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: SafeArea(
        child: course.when(
          data: (item) => _CourseDetailBody(
            course: item,
            formKey: _formKey,
            nameController: _nameController,
            emailController: _emailController,
            phoneController: _phoneController,
            noteController: _noteController,
            selectedBatchId: _selectedBatchId,
            paymentMethod: _paymentMethod,
            acceptedTerms: _acceptedTerms,
            submitting: _submitting,
            onBatchChanged: (value) {
              setState(() {
                _selectedBatchId = value;
              });
            },
            onPaymentMethodChanged: (value) {
              setState(() {
                _paymentMethod = value;
              });
            },
            onTermsChanged: (value) {
              setState(() {
                _acceptedTerms = value;
              });
            },
            onSubmit: _submitBooking,
          ),
          error: (error, stackTrace) => _DetailError(
            message: error.toString(),
            onRetry: () {
              ref.invalidate(publicCourseDetailProvider(widget.courseSlug));
            },
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

  Future<void> _submitBooking(PublicCourseSummary course) async {
    final strings = AppStrings.of(context);
    final availableBatches = course.batches
        .where((batch) => batch.status == 'open' && batch.remainingSeats > 0)
        .toList(growable: false);
    final batchId = _selectedBatchId ?? _firstBatchId(availableBatches);

    if (batchId == null) {
      _showMessage(strings.noAvailableBatches);
      return;
    }
    if (!_acceptedTerms) {
      _showMessage(strings.acceptBookingTerms);
      return;
    }
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() {
      _submitting = true;
    });
    try {
      final result =
          await ref.read(publicCourseRepositoryProvider).createBooking(
                PublicBookingCommand(
                  courseId: course.id,
                  batchId: batchId,
                  studentName: _nameController.text,
                  email: _emailController.text,
                  phone: _phoneController.text,
                  note: _noteController.text,
                  paymentMethod: _paymentMethod,
                  termsAccepted: _acceptedTerms,
                ),
              );
      if (!mounted) {
        return;
      }
      final batch = _findBatchById(availableBatches, batchId);
      context.go(
        BookingSuccessPage.location(
          bookingId: result.bookingId,
          courseTitle: course.localizedTitle(strings.isArabic),
          batchTitle: batch?.localizedTitle(strings.isArabic),
          paymentUrl: result.paymentUrl,
          status: result.status,
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _CourseDetailBody extends StatelessWidget {
  const _CourseDetailBody({
    required this.course,
    required this.formKey,
    required this.nameController,
    required this.emailController,
    required this.phoneController,
    required this.noteController,
    required this.paymentMethod,
    required this.acceptedTerms,
    required this.submitting,
    required this.onBatchChanged,
    required this.onPaymentMethodChanged,
    required this.onTermsChanged,
    required this.onSubmit,
    this.selectedBatchId,
  });

  final PublicCourseSummary course;
  final GlobalKey<FormState> formKey;
  final TextEditingController nameController;
  final TextEditingController emailController;
  final TextEditingController phoneController;
  final TextEditingController noteController;
  final String paymentMethod;
  final String? selectedBatchId;
  final bool acceptedTerms;
  final bool submitting;
  final ValueChanged<String?> onBatchChanged;
  final ValueChanged<String> onPaymentMethodChanged;
  final ValueChanged<bool> onTermsChanged;
  final Future<void> Function(PublicCourseSummary course) onSubmit;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final theme = Theme.of(context);
    final availableBatches = course.batches
        .where((batch) => batch.status == 'open' && batch.remainingSeats > 0)
        .toList(growable: false);
    final selectedValue = selectedBatchId ?? _firstBatchId(availableBatches);

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _CourseHero(course: course),
        const SizedBox(height: AinSpacing.lg),
        AinSectionHeader(
          title: strings.courseDetails,
          subtitle: course.localizedFullDescription(strings.isArabic),
        ),
        const SizedBox(height: AinSpacing.md),
        Wrap(
          spacing: AinSpacing.sm,
          runSpacing: AinSpacing.sm,
          children: [
            if (course.academy != null)
              _InfoChip(
                icon: Icons.business_outlined,
                label: Text(course.academy!.localizedName(strings.isArabic)),
              ),
            if (course.instructor != null)
              _InfoChip(
                icon: Icons.person_outline,
                label: Text(course.instructor!.localizedName(strings.isArabic)),
              ),
            if (course.deliveryType != null)
              _InfoChip(
                icon: Icons.cast_for_education,
                label: Text(course.deliveryType!),
              ),
            if (course.sessionsCount != null)
              _InfoChip(
                icon: Icons.menu_book_outlined,
                label: Text(strings.sessionsCount(course.sessionsCount!)),
              ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.availableBatches),
        const SizedBox(height: AinSpacing.md),
        if (availableBatches.isEmpty)
          AinEmptyState(
            icon: Icons.event_busy_outlined,
            title: strings.noAvailableBatches,
          )
        else
          RadioGroup<String>(
            groupValue: selectedValue,
            onChanged: onBatchChanged,
            child: Column(
              children: [
                for (final batch in availableBatches)
                  _BatchOption(
                    batch: batch,
                    selected: selectedValue == batch.id,
                  ),
              ],
            ),
          ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.whatYouWillLearn),
        const SizedBox(height: AinSpacing.md),
        if (course.learningOutcomes.isEmpty)
          AinEmptyState(
            icon: Icons.checklist_outlined,
            title: strings.learningOutcomesPending,
          )
        else
          for (final outcome in course.learningOutcomes)
            Padding(
              padding: const EdgeInsets.only(bottom: AinSpacing.sm),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.check_circle_outline,
                    color: AinColors.success,
                    size: 20,
                  ),
                  const SizedBox(width: AinSpacing.sm),
                  Expanded(child: Text(outcome)),
                ],
              ),
            ),
        const SizedBox(height: AinSpacing.xl),
        AinSurface(
          shadow: true,
          child: Form(
            key: formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.completeBooking,
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(strings.noPaymentNow),
                const SizedBox(height: 16),
                AinTextField(
                  controller: nameController,
                  label: strings.fullName,
                  icon: Icons.badge_outlined,
                  validator: (value) =>
                      _requiredMin(value, 2, strings.fullNameRequired),
                ),
                const SizedBox(height: 12),
                AinTextField(
                  controller: emailController,
                  label: strings.email,
                  icon: Icons.alternate_email,
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) =>
                      _validEmail(value, strings.invalidEmail),
                ),
                const SizedBox(height: 12),
                AinTextField(
                  controller: phoneController,
                  label: strings.phone,
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (value) =>
                      _requiredMin(value, 7, strings.phoneRequired),
                ),
                const SizedBox(height: 12),
                const SizedBox(height: AinSpacing.lg),
                Text(
                  strings.selectPaymentMethod,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AinSpacing.sm),
                _PaymentMethodCard(
                  value: 'card',
                  groupValue: paymentMethod,
                  title: strings.paymentMethodCardTitle,
                  subtitle: strings.paymentMethodCardDesc,
                  icon: Icons.credit_card,
                  onChanged: onPaymentMethodChanged,
                ),
                _PaymentMethodCard(
                  value: 'wallet',
                  groupValue: paymentMethod,
                  title: strings.paymentMethodWalletTitle,
                  subtitle: strings.paymentMethodWalletDesc,
                  icon: Icons.account_balance_wallet_outlined,
                  onChanged: onPaymentMethodChanged,
                ),
                _PaymentMethodCard(
                  value: 'cash',
                  groupValue: paymentMethod,
                  title: strings.paymentMethodCashTitle,
                  subtitle: strings.paymentMethodCashDesc,
                  icon: Icons.storefront_outlined,
                  onChanged: onPaymentMethodChanged,
                ),
                const SizedBox(height: AinSpacing.md),
                Container(
                  padding: const EdgeInsets.all(AinSpacing.md),
                  decoration: BoxDecoration(
                    color: AinColors.canvas,
                    borderRadius: BorderRadius.circular(AinRadii.md),
                    border: Border.all(color: AinColors.line),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            strings.totalAmount,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          Text(
                            strings.priceFromMinor(
                              course.effectivePriceMinor,
                              course.currency,
                            ),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: AinColors.brand,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            strings.taxIncluded,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AinColors.muted,
                            ),
                          ),
                          const Icon(
                            Icons.verified,
                            size: 14,
                            color: AinColors.success,
                          ),
                        ],
                      ),
                      const SizedBox(height: AinSpacing.sm),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              decoration: InputDecoration(
                                hintText: strings.couponCode,
                                isDense: true,
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 8,
                                ),
                                border: OutlineInputBorder(
                                  borderRadius:
                                      BorderRadius.circular(AinRadii.sm),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: AinSpacing.xs),
                          OutlinedButton(
                            onPressed: () {},
                            child: Text(strings.applyCoupon),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: noteController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: strings.optionalNote,
                  ),
                ),
                const SizedBox(height: 12),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: acceptedTerms,
                  onChanged: (value) => onTermsChanged(value ?? false),
                  title: Text(strings.bookingTerms),
                ),
                const SizedBox(height: 12),
                AinPrimaryButton(
                  label: strings.confirmBookingAndSecurePay,
                  icon: Icons.lock_outline,
                  loading: submitting,
                  onPressed: submitting ? null : () => onSubmit(course),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String? _requiredMin(String? value, int min, String message) {
    if (value == null || value.trim().length < min) {
      return message;
    }
    return null;
  }

  String? _validEmail(String? value, String message) {
    final text = value?.trim() ?? '';
    if (!text.contains('@') || !text.contains('.')) {
      return message;
    }
    return null;
  }
}

class _CourseHero extends StatelessWidget {
  const _CourseHero({required this.course});

  final PublicCourseSummary course;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final theme = Theme.of(context);
    final category =
        course.category?.localizedName(strings.isArabic) ?? strings.course;
    final coverUrl = course.coverUrl;

    return Container(
      decoration: BoxDecoration(
        color: AinColors.surface,
        borderRadius: BorderRadius.circular(AinRadii.xl),
        border: Border.all(color: const Color(0x0F16458F)),
        boxShadow: AinShadows.card,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: coverUrl == null || coverUrl.trim().isEmpty
                ? Container(
                    decoration: const BoxDecoration(
                      gradient: AinGradients.hero,
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.school_outlined,
                        color: Colors.white54,
                        size: 56,
                      ),
                    ),
                  )
                : Image.network(
                    coverUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      decoration: const BoxDecoration(
                        gradient: AinGradients.hero,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.school_outlined,
                          color: Colors.white54,
                          size: 56,
                        ),
                      ),
                    ),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(AinSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AinColors.brandSoft,
                        borderRadius: BorderRadius.circular(AinRadii.pill),
                      ),
                      child: Text(
                        category,
                        style: const TextStyle(
                          color: AinColors.brand,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const Spacer(),
                    if (course.academy?.verified ?? false)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AinColors.successSoft,
                          borderRadius: BorderRadius.circular(AinRadii.pill),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.verified,
                              size: 14,
                              color: AinColors.success,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              strings.verifiedAcademy,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AinColors.success,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: AinSpacing.md),
                Text(
                  course.localizedTitle(strings.isArabic),
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: AinSpacing.md),
                Row(
                  children: [
                    Text(
                      strings.priceFromMinor(
                        course.effectivePriceMinor,
                        course.currency,
                      ),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: AinColors.brand,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BatchOption extends StatelessWidget {
  const _BatchOption({required this.batch, required this.selected});

  final PublicCourseBatch batch;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.sm),
      child: Container(
        decoration: BoxDecoration(
          color: selected ? AinColors.brandSoft : AinColors.surface,
          borderRadius: BorderRadius.circular(AinRadii.md),
          border: Border.all(
            color: selected ? AinColors.brand : const Color(0x0F16458F),
            width: selected ? 1.8 : 1,
          ),
          boxShadow: selected ? AinShadows.card : null,
        ),
        padding: const EdgeInsets.all(AinSpacing.xs),
        child: RadioListTile<String>(
          contentPadding: const EdgeInsets.symmetric(horizontal: AinSpacing.sm),
          activeColor: AinColors.brand,
          value: batch.id,
          title: Text(
            batch.localizedTitle(strings.isArabic),
            style: TextStyle(
              fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              fontSize: 14,
              color: selected ? AinColors.brand : AinColors.ink,
            ),
          ),
          subtitle: Text(
            [
              if (batch.schedule != null) batch.schedule,
              if (batch.startDate != null) batch.startDate,
              strings.seatsLeft(batch.remainingSeats),
            ].whereType<String>().join(' - '),
            style: const TextStyle(fontSize: 12, color: AinColors.muted),
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final Widget label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AinColors.canvasSubtle,
        borderRadius: BorderRadius.circular(AinRadii.pill),
        border: Border.all(color: const Color(0x0F16458F)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: AinColors.brand),
          const SizedBox(width: 5),
          DefaultTextStyle(
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AinColors.muted,
            ),
            child: label,
          ),
        ],
      ),
    );
  }
}

String? _firstBatchId(List<PublicCourseBatch> batches) {
  return batches.isEmpty ? null : batches.first.id;
}

PublicCourseBatch? _findBatchById(
  List<PublicCourseBatch> batches,
  String batchId,
) {
  for (final batch in batches) {
    if (batch.id == batchId) {
      return batch;
    }
  }
  return null;
}

class _DetailError extends StatelessWidget {
  const _DetailError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text(strings.retry),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentMethodCard extends StatelessWidget {
  const _PaymentMethodCard({
    required this.value,
    required this.groupValue,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onChanged,
  });

  final String value;
  final String groupValue;
  final String title;
  final String subtitle;
  final IconData icon;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final selected = value == groupValue;
    return InkWell(
      borderRadius: BorderRadius.circular(AinRadii.md),
      onTap: () => onChanged(value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: AinSpacing.sm),
        padding: const EdgeInsets.all(AinSpacing.md),
        decoration: BoxDecoration(
          color: selected ? AinColors.brandSoft : AinColors.canvas,
          borderRadius: BorderRadius.circular(AinRadii.md),
          border: Border.all(
            color: selected ? AinColors.brand : AinColors.line,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected ? AinColors.brand : AinColors.muted,
                  width: 2,
                ),
              ),
              child: selected
                  ? Center(
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AinColors.brand,
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: AinSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: AinColors.muted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              icon,
              color: selected ? AinColors.brand : AinColors.muted,
              size: 26,
            ),
          ],
        ),
      ),
    );
  }
}

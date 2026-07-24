import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/marketplace/application/public_course_catalog_controller.dart';
import 'package:ain_mobile/src/features/marketplace/data/public_course_repository.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/booking_success_page.dart';
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
            acceptedTerms: _acceptedTerms,
            submitting: _submitting,
            onBatchChanged: (value) {
              setState(() {
                _selectedBatchId = value;
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
    required this.acceptedTerms,
    required this.submitting,
    required this.onBatchChanged,
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
  final String? selectedBatchId;
  final bool acceptedTerms;
  final bool submitting;
  final ValueChanged<String?> onBatchChanged;
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
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          course.category?.localizedName(strings.isArabic) ?? strings.course,
          style: theme.textTheme.labelLarge,
        ),
        const SizedBox(height: 8),
        Text(
          course.localizedTitle(strings.isArabic),
          style: theme.textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(course.localizedFullDescription(strings.isArabic)),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (course.academy != null)
              Chip(
                avatar: const Icon(Icons.business, size: 16),
                label: Text(course.academy!.localizedName(strings.isArabic)),
              ),
            if (course.instructor != null)
              Chip(
                avatar: const Icon(Icons.person, size: 16),
                label: Text(course.instructor!.localizedName(strings.isArabic)),
              ),
            if (course.deliveryType != null)
              Chip(
                avatar: const Icon(Icons.cast_for_education, size: 16),
                label: Text(course.deliveryType!),
              ),
            if (course.sessionsCount != null)
              Chip(
                avatar: const Icon(Icons.menu_book, size: 16),
                label: Text(strings.sessionsCount(course.sessionsCount!)),
              ),
          ],
        ),
        const SizedBox(height: 16),
        _SectionTitle(title: strings.availableBatches),
        const SizedBox(height: 8),
        if (availableBatches.isEmpty)
          Text(strings.noAvailableBatches)
        else
          for (final batch in availableBatches)
            RadioListTile<String>(
              value: batch.id,
              groupValue: selectedValue,
              onChanged: onBatchChanged,
              title: Text(batch.localizedTitle(strings.isArabic)),
              subtitle: Text(
                [
                  if (batch.schedule != null) batch.schedule,
                  if (batch.startDate != null) batch.startDate,
                  strings.seatsLeft(batch.remainingSeats),
                ].whereType<String>().join(' - '),
              ),
            ),
        const SizedBox(height: 16),
        _SectionTitle(title: strings.whatYouWillLearn),
        const SizedBox(height: 8),
        if (course.learningOutcomes.isEmpty)
          Text(strings.learningOutcomesPending)
        else
          for (final outcome in course.learningOutcomes)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.check_circle_outline),
              title: Text(outcome),
            ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
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
                  TextFormField(
                    controller: nameController,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(labelText: strings.fullName),
                    validator: (value) =>
                        _requiredMin(value, 2, strings.fullNameRequired),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(labelText: strings.email),
                    validator: (value) =>
                        _validEmail(value, strings.invalidEmail),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(labelText: strings.phone),
                    validator: (value) =>
                        _requiredMin(value, 7, strings.phoneRequired),
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
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: submitting ? null : () => onSubmit(course),
                      icon: submitting
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.send),
                      label: Text(strings.sendBookingRequest),
                    ),
                  ),
                ],
              ),
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

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(title, style: Theme.of(context).textTheme.titleLarge);
  }
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

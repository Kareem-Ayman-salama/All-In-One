import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/learning/application/student_learning_controller.dart';
import 'package:ain_mobile/src/features/learning/data/student_learning_repository.dart';
import 'package:ain_mobile/src/features/learning/presentation/my_courses_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_catalog_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class BookingSuccessPage extends ConsumerWidget {
  const BookingSuccessPage({
    required this.bookingId,
    this.courseTitle,
    this.batchTitle,
    this.paymentUrl,
    this.status,
    super.key,
  });

  static const routePath = '/booking/success';

  final String bookingId;
  final String? courseTitle;
  final String? batchTitle;
  final String? paymentUrl;
  final String? status;

  static String location({
    required String bookingId,
    String? courseTitle,
    String? batchTitle,
    String? paymentUrl,
    String? status,
  }) {
    return Uri(
      path: routePath,
      queryParameters: <String, String>{
        'bookingId': bookingId,
        if (_hasText(courseTitle)) 'course': courseTitle!.trim(),
        if (_hasText(batchTitle)) 'batch': batchTitle!.trim(),
        if (_hasText(paymentUrl)) 'paymentUrl': paymentUrl!.trim(),
        if (_hasText(status)) 'status': status!.trim(),
      },
    ).toString();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);
    StudentBookingSummary? booking;
    var isHydratingBooking = false;
    if (authState.isAuthenticated) {
      final overview = ref.watch(studentLearningOverviewProvider);
      booking = overview.valueOrNull?.bookingById(bookingId);
      isHydratingBooking = overview.isLoading;
    }
    final effectiveCourseTitle =
        booking?.course?.localizedTitle(strings.isArabic) ?? courseTitle;
    final effectiveBatchTitle =
        booking?.batch?.localizedTitle(strings.isArabic) ?? batchTitle;
    final effectiveStatus = booking == null
        ? (status != null && status!.isNotEmpty
            ? strings.bookingStatusLabel(status!)
            : strings.pendingAcademyConfirmation)
        : strings.bookingStatusLabel(booking.status);
    final shortId = _shortId(bookingId);

    return Scaffold(
      appBar: AppBar(title: Text(strings.bookingSubmitted)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Icon(
              Icons.check_circle,
              size: 72,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              strings.bookingSubmitted,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(strings.bookingSubmittedHint, textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SummaryRow(label: strings.requestNumber, value: shortId),
                    if (_hasText(effectiveCourseTitle))
                      _SummaryRow(
                        label: strings.course,
                        value: effectiveCourseTitle!.trim(),
                      ),
                    if (_hasText(effectiveBatchTitle))
                      _SummaryRow(
                        label: strings.batch,
                        value: effectiveBatchTitle!.trim(),
                      ),
                    _SummaryRow(
                      label: strings.bookingStatus,
                      value: effectiveStatus,
                    ),
                    if (booking != null)
                      _SummaryRow(
                        label: strings.paymentStatus,
                        value: booking.paymentStatus,
                      ),
                    if (isHydratingBooking) ...[
                      const SizedBox(height: 12),
                      LinearProgressIndicator(
                        semanticsLabel: strings.loading,
                        minHeight: 3,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (_hasText(paymentUrl)) ...[
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF16458F),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(50),
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        strings.isArabic
                            ? 'جاري التحويل لبوابة الدفع الإلكتروني Paymob...'
                            : 'Redirecting to secure Paymob payment checkout...',
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.payment_outlined),
                label: Text(strings.proceedToPayment),
              ),
              const SizedBox(height: 12),
            ],
            FilledButton.icon(
              onPressed: () => context.go(MyCoursesPage.routePath),
              icon: const Icon(Icons.receipt_long),
              label: Text(strings.backToMyCourses),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.secondary,
                foregroundColor: Theme.of(context).colorScheme.onSecondary,
              ),
              onPressed: () => context.go(CourseCatalogPage.routePath),
              icon: const Icon(Icons.search),
              label: Text(strings.exploreMoreCourses),
            ),
          ],
        ),
      ),
    );
  }
}

extension _StudentBookingLookup on StudentLearningOverview {
  StudentBookingSummary? bookingById(String bookingId) {
    final normalized = bookingId.trim();
    for (final booking in bookings) {
      if (booking.id == normalized) {
        return booking;
      }
    }
    return null;
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(label, style: Theme.of(context).textTheme.labelLarge),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ),
        ],
      ),
    );
  }
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

String _shortId(String bookingId) {
  final value = bookingId.trim();
  if (value.length <= 8) {
    return value.toUpperCase();
  }
  return value.substring(value.length - 8).toUpperCase();
}

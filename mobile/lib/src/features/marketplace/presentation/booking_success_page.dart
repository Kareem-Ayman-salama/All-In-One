import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_catalog_page.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class BookingSuccessPage extends StatelessWidget {
  const BookingSuccessPage({
    required this.bookingId,
    this.courseTitle,
    this.batchTitle,
    super.key,
  });

  static const routePath = '/booking/success';

  final String bookingId;
  final String? courseTitle;
  final String? batchTitle;

  static String location({
    required String bookingId,
    String? courseTitle,
    String? batchTitle,
  }) {
    return Uri(
      path: routePath,
      queryParameters: <String, String>{
        'bookingId': bookingId,
        if (_hasText(courseTitle)) 'course': courseTitle!.trim(),
        if (_hasText(batchTitle)) 'batch': batchTitle!.trim(),
      },
    ).toString();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
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
            Text(
              strings.bookingSubmittedHint,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SummaryRow(
                      label: strings.requestNumber,
                      value: shortId,
                    ),
                    if (_hasText(courseTitle))
                      _SummaryRow(
                        label: strings.course,
                        value: courseTitle!.trim(),
                      ),
                    if (_hasText(batchTitle))
                      _SummaryRow(
                        label: strings.batch,
                        value: batchTitle!.trim(),
                      ),
                    _SummaryRow(
                      label: strings.bookingStatus,
                      value: strings.pendingAcademyConfirmation,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
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

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
  });

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
            child: Text(
              label,
              style: Theme.of(context).textTheme.labelLarge,
            ),
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

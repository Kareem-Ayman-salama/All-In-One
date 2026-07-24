import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/marketplace/application/public_course_catalog_controller.dart';
import 'package:ain_mobile/src/features/marketplace/data/public_course_repository.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_detail_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class CourseCatalogPage extends ConsumerStatefulWidget {
  const CourseCatalogPage({super.key});

  static const routePath = '/explore';

  @override
  ConsumerState<CourseCatalogPage> createState() => _CourseCatalogPageState();
}

class _CourseCatalogPageState extends ConsumerState<CourseCatalogPage> {
  final TextEditingController _searchController = TextEditingController();
  PublicCourseQuery _query = const PublicCourseQuery(perPage: 24);

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final coursePage = ref.watch(publicCourseCatalogProvider(_query));

    return Scaffold(
      appBar: AppBar(title: Text(strings.exploreCourses)),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () {
            return ref.refresh(publicCourseCatalogProvider(_query).future);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                strings.findCourses,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                strings.findCoursesHint,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              _CourseSearchBar(
                controller: _searchController,
                onSubmit: _submitSearch,
                onClear: _clearSearch,
              ),
              const SizedBox(height: 12),
              _SortSelector(
                value: _query.sort,
                onChanged: _setSort,
              ),
              const SizedBox(height: 16),
              coursePage.when(
                data: (page) => _CourseList(page: page),
                error: (error, stackTrace) => _CatalogError(
                  message: error.toString(),
                  onRetry: () {
                    ref.invalidate(publicCourseCatalogProvider(_query));
                  },
                ),
                loading: () => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Semantics(
                      label: strings.loading,
                      child: const CircularProgressIndicator(),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _submitSearch() {
    setState(() {
      _query = _query.copyWith(
        search: _searchController.text,
        page: 1,
      );
    });
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() {
      _query = _query.copyWith(
        search: '',
        page: 1,
      );
    });
  }

  void _setSort(PublicCourseSort sort) {
    setState(() {
      _query = _query.copyWith(sort: sort, page: 1);
    });
  }
}

class _CourseSearchBar extends StatelessWidget {
  const _CourseSearchBar({
    required this.controller,
    required this.onSubmit,
    required this.onClear,
  });

  final TextEditingController controller;
  final VoidCallback onSubmit;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return SearchBar(
      controller: controller,
      hintText: strings.searchCourses,
      leading: const Icon(Icons.search),
      trailing: [
        IconButton(
          tooltip: strings.clearSearch,
          onPressed: onClear,
          icon: const Icon(Icons.close),
        ),
      ],
      onSubmitted: (_) => onSubmit(),
    );
  }
}

class _SortSelector extends StatelessWidget {
  const _SortSelector({
    required this.value,
    required this.onChanged,
  });

  final PublicCourseSort value;
  final ValueChanged<PublicCourseSort> onChanged;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return SegmentedButton<PublicCourseSort>(
      segments: [
        ButtonSegment<PublicCourseSort>(
          value: PublicCourseSort.newest,
          label: Text(strings.newest),
          icon: const Icon(Icons.schedule),
        ),
        ButtonSegment<PublicCourseSort>(
          value: PublicCourseSort.priceAsc,
          label: Text(strings.priceLow),
          icon: const Icon(Icons.south_east),
        ),
        ButtonSegment<PublicCourseSort>(
          value: PublicCourseSort.startingSoon,
          label: Text(strings.startingSoon),
          icon: const Icon(Icons.event_available),
        ),
      ],
      selected: {value},
      onSelectionChanged: (selection) => onChanged(selection.first),
    );
  }
}

class _CourseList extends StatelessWidget {
  const _CourseList({
    required this.page,
  });

  final PublicCoursePage page;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    if (page.courses.isEmpty) {
      return _EmptyCatalog(message: strings.noCoursesFound);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          strings.matchingCourses(page.pagination.total),
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        for (final course in page.courses) _CourseCard(course: course),
      ],
    );
  }
}

class _CourseCard extends StatelessWidget {
  const _CourseCard({
    required this.course,
  });

  final PublicCourseSummary course;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final batch = course.nextOpenBatch;
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () {
          context.push(CourseDetailPage.location(course.slug));
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      course.category?.localizedName(strings.isArabic) ??
                          course.subject ??
                          strings.course,
                      style: theme.textTheme.labelLarge,
                    ),
                  ),
                  if (course.academy?.verified ?? false)
                    Tooltip(
                      message: strings.verifiedAcademy,
                      child: const Icon(Icons.verified, size: 18),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                course.localizedTitle(strings.isArabic),
                style: theme.textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                course.localizedDescription(strings.isArabic),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _InfoChip(
                    icon: Icons.business,
                    label: course.academy?.localizedName(strings.isArabic) ??
                        strings.academyTeam,
                  ),
                  if (course.deliveryType != null)
                    _InfoChip(
                      icon: Icons.cast_for_education,
                      label: course.deliveryType!,
                    ),
                  if (batch?.startDate != null)
                    _InfoChip(
                      icon: Icons.calendar_month,
                      label: batch!.startDate!,
                    ),
                  if (batch != null)
                    _InfoChip(
                      icon: Icons.event_seat,
                      label: strings.seatsLeft(batch.remainingSeats),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      strings.priceFromMinor(
                        course.effectivePriceMinor,
                        course.currency,
                      ),
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () {
                      context.push(CourseDetailPage.location(course.slug));
                    },
                    icon: const Icon(Icons.chevron_right),
                    label: Text(strings.viewDetails),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}

class _CatalogError extends StatelessWidget {
  const _CatalogError({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.cloud_off, size: 48),
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

class _EmptyCatalog extends StatelessWidget {
  const _EmptyCatalog({
    required this.message,
  });

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.search_off, size: 48),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

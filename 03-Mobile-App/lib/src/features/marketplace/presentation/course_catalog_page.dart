import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/home/presentation/home_page.dart';
import 'package:ain_mobile/src/features/marketplace/application/public_course_catalog_controller.dart';
import 'package:ain_mobile/src/features/marketplace/data/public_course_repository.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_detail_page.dart';
import 'package:ain_mobile/src/features/profile/presentation/profile_page.dart';
import 'package:ain_mobile/src/features/schedule/presentation/schedule_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
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
  String _selectedCategory = 'all';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSelectCategory(String cat) {
    setState(() {
      _selectedCategory = cat;
      if (cat == 'all') {
        _query = _query.copyWith(search: null, page: 1);
        _searchController.clear();
      } else {
        _query = _query.copyWith(search: cat, page: 1);
        _searchController.text = cat;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final coursePage = ref.watch(publicCourseCatalogProvider(_query));

    return Scaffold(
      appBar: AppBar(title: Text(strings.exploreCourses)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 1,
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go(HomePage.routePath);
              break;
            case 1:
              break;
            case 2:
              context.go(SchedulePage.routePath);
              break;
            case 3:
              context.go(ProfilePage.routePath);
              break;
          }
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home),
            label: strings.today,
          ),
          NavigationDestination(
            icon: const Icon(Icons.travel_explore_outlined),
            selectedIcon: const Icon(Icons.travel_explore),
            label: strings.explore,
          ),
          NavigationDestination(
            icon: const Icon(Icons.calendar_today_outlined),
            selectedIcon: const Icon(Icons.calendar_today),
            label: strings.schedule,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: strings.profile,
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () {
            return ref.refresh(publicCourseCatalogProvider(_query).future);
          },
          child: ListView(
            padding: const EdgeInsets.all(AinSpacing.lg),
            children: [
              _CatalogHero(
                title: strings.findCourses,
                subtitle: strings.findCoursesHint,
              ),
              const SizedBox(height: AinSpacing.md),
              AinSurface(
                padding: const EdgeInsets.all(AinSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _CourseSearchBar(
                      controller: _searchController,
                      onSubmit: _submitSearch,
                      onClear: _clearSearch,
                    ),
                    const SizedBox(height: AinSpacing.md),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _CategoryFilterChip(
                            label: strings.filterAll,
                            selected: _selectedCategory == 'all',
                            onTap: () => _onSelectCategory('all'),
                          ),
                          const SizedBox(width: AinSpacing.xs),
                          _CategoryFilterChip(
                            label: strings.filterProgramming,
                            selected: _selectedCategory == 'programming',
                            onTap: () => _onSelectCategory('programming'),
                          ),
                          const SizedBox(width: AinSpacing.xs),
                          _CategoryFilterChip(
                            label: strings.filterAI,
                            selected: _selectedCategory == 'ai',
                            onTap: () => _onSelectCategory('ai'),
                          ),
                          const SizedBox(width: AinSpacing.xs),
                          _CategoryFilterChip(
                            label: strings.filterDesign,
                            selected: _selectedCategory == 'design',
                            onTap: () => _onSelectCategory('design'),
                          ),
                          const SizedBox(width: AinSpacing.xs),
                          _CategoryFilterChip(
                            label: strings.filterBusiness,
                            selected: _selectedCategory == 'business',
                            onTap: () => _onSelectCategory('business'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AinSpacing.md),
                    _SortSelector(value: _query.sort, onChanged: _setSort),
                  ],
                ),
              ),
              const SizedBox(height: AinSpacing.xl),
              coursePage.when(
                data: (page) => _CourseList(page: page),
                error: (error, stackTrace) => _CatalogError(
                  message: error.toString(),
                  onRetry: () {
                    ref.invalidate(publicCourseCatalogProvider(_query));
                  },
                ),
                loading: () => _CatalogLoading(label: strings.loading),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _submitSearch() {
    setState(() {
      _query = _query.copyWith(search: _searchController.text, page: 1);
    });
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() {
      _query = _query.copyWith(search: '', page: 1);
    });
  }

  void _setSort(PublicCourseSort sort) {
    setState(() {
      _query = _query.copyWith(sort: sort, page: 1);
    });
  }
}

class _CatalogHero extends StatelessWidget {
  const _CatalogHero({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AinGradients.heroShimmer,
        borderRadius: BorderRadius.circular(AinRadii.xl),
        boxShadow: AinShadows.float,
      ),
      padding: const EdgeInsets.all(AinSpacing.xl),
      child: Stack(
        children: [
          Positioned(
            top: -25,
            right: -25,
            child: Container(
              width: 110,
              height: 110,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.white.withValues(alpha: 0.08),
                    Colors.white.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -15,
            left: -15,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AinColors.gold.withValues(alpha: 0.08),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AinRadii.md),
                  border: Border.all(
                    color: AinColors.gold.withValues(alpha: 0.35),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AinColors.gold.withValues(alpha: 0.12),
                      blurRadius: 16,
                      spreadRadius: -2,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.travel_explore,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(height: AinSpacing.lg),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: AinSpacing.xs),
              Text(
                subtitle,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.78),
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ],
      ),
    );
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
        IconButton.filled(
          tooltip: strings.searchCourses,
          onPressed: onSubmit,
          icon: const Icon(Icons.arrow_forward),
        ),
      ],
      onSubmitted: (_) => onSubmit(),
      padding: const WidgetStatePropertyAll(
        EdgeInsets.symmetric(horizontal: AinSpacing.md),
      ),
    );
  }
}

class _SortSelector extends StatelessWidget {
  const _SortSelector({required this.value, required this.onChanged});

  final PublicCourseSort value;
  final ValueChanged<PublicCourseSort> onChanged;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return SegmentedButton<PublicCourseSort>(
      style: SegmentedButton.styleFrom(
        visualDensity: VisualDensity.compact,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AinRadii.md),
        ),
      ),
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
  const _CourseList({required this.page});

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
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: AinSpacing.md),
        for (final course in page.courses) _CourseCard(course: course),
      ],
    );
  }
}

class _CourseCard extends StatelessWidget {
  const _CourseCard({required this.course});

  final PublicCourseSummary course;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final batch = course.nextOpenBatch;
    final theme = Theme.of(context);
    final hasDiscount =
        course.discountedPriceMinor != null && course.priceMinor != null;
    final instructorName = course.instructor?.localizedName(strings.isArabic);
    final categoryName = course.category?.localizedName(strings.isArabic) ??
        course.subject ??
        strings.course;

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.lg),
      child: InkWell(
        borderRadius: BorderRadius.circular(AinRadii.xl),
        onTap: () {
          context.push(CourseDetailPage.location(course.slug));
        },
        child: Container(
          decoration: BoxDecoration(
            color: AinColors.surface,
            borderRadius: BorderRadius.circular(AinRadii.xl),
            border: Border.all(color: const Color(0x0A16458F)),
            boxShadow: AinShadows.elevated,
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 16:9 Banner Cover with Floating Badges
              Stack(
                children: [
                  _CourseCover(course: course),
                  Positioned(
                    top: AinSpacing.md,
                    right: strings.isArabic ? AinSpacing.md : null,
                    left: strings.isArabic ? null : AinSpacing.md,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AinColors.brandNavy.withValues(alpha: 0.88),
                        borderRadius: BorderRadius.circular(AinRadii.pill),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: Color(0xFFEF4444),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            strings.liveAndInteractive,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (hasDiscount)
                    Positioned(
                      top: AinSpacing.md,
                      left: strings.isArabic ? AinSpacing.md : null,
                      right: strings.isArabic ? null : AinSpacing.md,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
                          ),
                          borderRadius: BorderRadius.circular(AinRadii.pill),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x33E11D48),
                              blurRadius: 8,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          strings.isArabic ? 'خصم حصري' : 'Special Offer',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),

              // Card Body
              Padding(
                padding: const EdgeInsets.all(AinSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: AinColors.brandSoft,
                            borderRadius: BorderRadius.circular(AinRadii.pill),
                          ),
                          child: Text(
                            categoryName,
                            style: const TextStyle(
                              color: AinColors.brand,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const Spacer(),
                        if (course.academy?.verified ?? false) ...[
                          const Icon(
                            Icons.verified,
                            color: AinColors.success,
                            size: 15,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            course.academy?.localizedName(strings.isArabic) ??
                                strings.academyTeam,
                            style: const TextStyle(
                              color: AinColors.muted,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: AinSpacing.sm),
                    Text(
                      course.localizedTitle(strings.isArabic),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: AinColors.ink,
                        height: 1.35,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: AinSpacing.sm),
                    Row(
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          color: AinColors.gold,
                          size: 20,
                        ),
                        const SizedBox(width: 3),
                        const Text(
                          '4.9',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 13,
                            color: AinColors.ink,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          strings.isArabic ? '(240 طالب)' : '(240 students)',
                          style: const TextStyle(
                            color: AinColors.muted,
                            fontSize: 11.5,
                          ),
                        ),
                        if (instructorName != null &&
                            instructorName.trim().isNotEmpty) ...[
                          const SizedBox(width: AinSpacing.sm),
                          const Text(
                            '•',
                            style: TextStyle(color: AinColors.muted),
                          ),
                          const SizedBox(width: AinSpacing.sm),
                          Expanded(
                            child: Text(
                              instructorName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AinColors.muted,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: AinSpacing.md),
                    Wrap(
                      spacing: AinSpacing.sm,
                      runSpacing: AinSpacing.sm,
                      children: [
                        if (course.deliveryType != null)
                          _InfoChip(
                            icon: Icons.cast_for_education,
                            label: course.deliveryType!,
                          ),
                        if (course.duration != null)
                          _InfoChip(
                            icon: Icons.timer_outlined,
                            label: course.duration!,
                          ),
                        if (batch != null)
                          _InfoChip(
                            icon: Icons.event_seat,
                            label: strings.seatsLeft(batch.remainingSeats),
                          ),
                      ],
                    ),
                    const SizedBox(height: AinSpacing.lg),
                    const Divider(
                      height: 1,
                      color: Color(0x0F16458F),
                    ),
                    const SizedBox(height: AinSpacing.md),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (hasDiscount)
                                Text(
                                  strings.priceFromMinor(
                                    course.priceMinor!,
                                    course.currency,
                                  ),
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: AinColors.muted,
                                    decoration: TextDecoration.lineThrough,
                                    fontSize: 12,
                                  ),
                                ),
                              Text(
                                strings.priceFromMinor(
                                  course.effectivePriceMinor,
                                  course.currency,
                                ),
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: AinColors.brand,
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(
                          width: 130,
                          height: 44,
                          child: AinPrimaryButton(
                            label: strings.bookSeat,
                            onPressed: () {
                              context.push(
                                CourseDetailPage.location(course.slug),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CourseCover extends StatelessWidget {
  const _CourseCover({required this.course});

  final PublicCourseSummary course;

  @override
  Widget build(BuildContext context) {
    final coverUrl = course.coverUrl;

    return AspectRatio(
      aspectRatio: 16 / 9,
      child: coverUrl == null || coverUrl.trim().isEmpty
          ? Container(
              decoration: const BoxDecoration(
                gradient: AinGradients.premium,
              ),
              child: Stack(
                children: [
                  Positioned(
                    bottom: -20,
                    right: -20,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.06),
                      ),
                    ),
                  ),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.15),
                            ),
                          ),
                          child: const Icon(
                            Icons.school_outlined,
                            color: Colors.white70,
                            size: 28,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          : Image.network(
              coverUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  decoration: const BoxDecoration(
                    gradient: AinGradients.premium,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.school_outlined,
                      color: Colors.white54,
                      size: 48,
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class _CatalogLoading extends StatelessWidget {
  const _CatalogLoading({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      child: Column(
        children: [
          for (var index = 0; index < 3; index++) ...[
            AinSurface(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const SizedBox.square(
                        dimension: 76,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: AinColors.canvas,
                            borderRadius: BorderRadius.all(
                              Radius.circular(AinRadii.md),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: AinSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _SkeletonLine(widthFactor: 0.45),
                            const SizedBox(height: AinSpacing.sm),
                            _SkeletonLine(widthFactor: 0.85),
                            const SizedBox(height: AinSpacing.sm),
                            _SkeletonLine(widthFactor: 0.55),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AinSpacing.lg),
                  const _SkeletonLine(widthFactor: 1),
                  const SizedBox(height: AinSpacing.sm),
                  const _SkeletonLine(widthFactor: 0.72),
                ],
              ),
            ),
            const SizedBox(height: AinSpacing.md),
          ],
        ],
      ),
    );
  }
}

class _SkeletonLine extends StatelessWidget {
  const _SkeletonLine({required this.widthFactor});

  final double widthFactor;

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      alignment: AlignmentDirectional.centerStart,
      widthFactor: widthFactor,
      child: Container(
        height: 12,
        decoration: BoxDecoration(
          color: AinColors.line,
          borderRadius: BorderRadius.circular(AinRadii.pill),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: AinColors.canvasSubtle,
        borderRadius: BorderRadius.circular(AinRadii.pill),
        border: Border.all(color: const Color(0x0F16458F)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AinColors.brand),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: AinColors.muted,
            ),
          ),
        ],
      ),
    );
  }
}

class _CatalogError extends StatelessWidget {
  const _CatalogError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return AinEmptyState(
      icon: Icons.cloud_off_outlined,
      title: strings.retry,
      subtitle: message,
      action: FilledButton.icon(
        onPressed: onRetry,
        icon: const Icon(Icons.refresh),
        label: Text(strings.retry),
      ),
    );
  }
}

class _EmptyCatalog extends StatelessWidget {
  const _EmptyCatalog({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return AinEmptyState(
      icon: Icons.search_off_outlined,
      title: message,
      subtitle: AppStrings.of(context).findCoursesHint,
    );
  }
}

class _CategoryFilterChip extends StatelessWidget {
  const _CategoryFilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(AinRadii.pill),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          gradient: selected ? AinGradients.button : null,
          color: selected ? null : AinColors.surface,
          borderRadius: BorderRadius.circular(AinRadii.pill),
          border: Border.all(
            color: selected ? Colors.transparent : const Color(0x1416458F),
            width: 1,
          ),
          boxShadow: selected ? AinShadows.button : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: selected ? Colors.white : AinColors.textPrimary,
          ),
        ),
      ),
    );
  }
}

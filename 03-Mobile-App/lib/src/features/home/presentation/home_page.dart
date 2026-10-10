import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/learning/presentation/attendance_page.dart';
import 'package:ain_mobile/src/features/learning/presentation/lesson_bookings_page.dart';
import 'package:ain_mobile/src/features/learning/presentation/my_courses_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_catalog_page.dart';
import 'package:ain_mobile/src/features/notifications/presentation/notification_inbox_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_analytics_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_announcements_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_attendance_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_bookings_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_content_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_courses_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_events_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_instructors_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_invitations_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_members_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_overview_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_profile_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_promotions_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_rooms_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_tasks_page.dart';
import 'package:ain_mobile/src/features/platform/presentation/platform_academy_approvals_page.dart';
import 'package:ain_mobile/src/features/platform/presentation/platform_categories_page.dart';
import 'package:ain_mobile/src/features/platform/presentation/platform_course_approvals_page.dart';
import 'package:ain_mobile/src/features/platform/presentation/platform_overview_page.dart';
import 'package:ain_mobile/src/features/platform/presentation/platform_promotion_approvals_page.dart';
import 'package:ain_mobile/src/features/profile/application/profile_controller.dart';
import 'package:ain_mobile/src/features/profile/presentation/profile_page.dart';
import 'package:ain_mobile/src/features/schedule/presentation/schedule_page.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/subscription_status_banner.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  static const routePath = '/home';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspace = ref.watch(activeWorkspaceControllerProvider).valueOrNull;
    final currentUser = ref.watch(currentUserProfileProvider).valueOrNull?.user;
    final platformActions =
        _platformActions(strings, currentUser?.platformRole);
    final organizationActions = _organizationActions(strings, workspace);
    final learningActions = _learningActions(strings);

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.appName),
        actions: [
          IconButton(
            tooltip: strings.notifications,
            onPressed: () => context.go(NotificationInboxPage.routePath),
            icon: const Icon(Icons.notifications_none),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              break;
            case 1:
              context.go(CourseCatalogPage.routePath);
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
        child: ListView(
          padding: const EdgeInsets.all(AinSpacing.lg),
          children: [
            _HomeHero(
              title: strings.today,
              subtitle: workspace?.name ?? strings.appName,
              userName: currentUser?.name,
            ),
            const SizedBox(height: AinSpacing.lg),
            if (workspace != null &&
                (workspace.subscription?.needsAttention ?? true))
              SubscriptionStatusBanner(
                subscription: workspace.subscription,
                compact: true,
              ),
            const SizedBox(height: AinSpacing.lg),
            _QuickActionGrid(actions: learningActions.take(2).toList()),
            const SizedBox(height: AinSpacing.xl),
            _ContinueLearningCard(
              title: strings.myCourses,
              subtitle: strings.openMyCourses,
              onPressed: () => context.go(MyCoursesPage.routePath),
            ),
            const SizedBox(height: AinSpacing.lg),
            _LiveMeetingUpcomingCard(
              title: strings.isArabic
                  ? 'مراجعة وتطبيقات عملية متقدمة'
                  : 'Live Practical Revision & Hands-on',
              roomName: strings.isArabic
                  ? 'قاعة البث التفاعلي - الغرفة رقم 101'
                  : 'Interactive Room #101',
              provider: 'Zoom Cloud Meeting',
              startsIn: strings.isArabic ? 'اليوم 07:00 م' : 'Today 07:00 PM',
              onJoin: () => context.go(MyCoursesPage.routePath),
            ),
            const SizedBox(height: AinSpacing.xl),
            _HomeSection(title: strings.explore, actions: learningActions),
            if (organizationActions.isNotEmpty) ...[
              const SizedBox(height: AinSpacing.xl),
              _HomeSection(
                title: strings.organizationOverview,
                subtitle: workspace?.name,
                actions: organizationActions,
              ),
            ],
            if (platformActions.isNotEmpty) ...[
              const SizedBox(height: AinSpacing.xl),
              _HomeSection(
                title: strings.platformOverview,
                subtitle: strings.platformOverviewHint,
                actions: platformActions,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ContinueLearningCard extends StatelessWidget {
  const _ContinueLearningCard({
    required this.title,
    required this.subtitle,
    required this.onPressed,
  });

  final String title;
  final String subtitle;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = AppStrings.of(context);

    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(AinRadii.lg),
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFF0F9FF), Color(0xFFE0F2FE)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AinRadii.lg),
          border: Border.all(color: const Color(0xFFBAE6FD)),
          boxShadow: AinShadows.card,
        ),
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AinRadii.md),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x150284C7),
                        blurRadius: 10,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.play_arrow_rounded,
                    color: AinColors.cyan,
                    size: 28,
                  ),
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AinColors.cyan.withValues(alpha: 0.12),
                              borderRadius:
                                  BorderRadius.circular(AinRadii.pill),
                            ),
                            child: Text(
                              strings.isArabic ? 'تابع التعلم' : 'Continue',
                              style: const TextStyle(
                                color: AinColors.cyan,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AinSpacing.xs),
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AinColors.ink,
                        ),
                      ),
                      Text(
                        subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AinColors.muted,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AinSpacing.sm),
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    color: AinColors.brand,
                    shape: BoxShape.circle,
                    boxShadow: AinShadows.button,
                  ),
                  child: const Icon(
                    Icons.arrow_forward,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            ClipRRect(
              borderRadius: BorderRadius.circular(AinRadii.pill),
              child: const LinearProgressIndicator(
                value: 0.65,
                minHeight: 6,
                backgroundColor: Colors.white,
                valueColor: AlwaysStoppedAnimation<Color>(AinColors.cyan),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LiveMeetingUpcomingCard extends StatelessWidget {
  const _LiveMeetingUpcomingCard({
    required this.title,
    required this.roomName,
    required this.provider,
    required this.startsIn,
    required this.onJoin,
  });

  final String title;
  final String roomName;
  final String provider;
  final String startsIn;
  final VoidCallback onJoin;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AinRadii.lg),
        border: Border.all(color: const Color(0xFF334155)),
        boxShadow: AinShadows.card,
      ),
      padding: const EdgeInsets.all(AinSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: AinGradients.gold,
                  borderRadius: BorderRadius.circular(AinRadii.md),
                ),
                child: const Icon(
                  Icons.videocam_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: AinSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0x33EF4444),
                            borderRadius: BorderRadius.circular(AinRadii.pill),
                            border: Border.all(color: const Color(0x66EF4444)),
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
                              const SizedBox(width: 4),
                              Text(
                                strings.isArabic ? 'بث مباشر حي' : 'LIVE CLASS',
                                style: const TextStyle(
                                  color: Color(0xFFFCA5A5),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          startsIn,
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14.5,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AinSpacing.md),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(AinRadii.sm),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.meeting_room_outlined,
                  size: 14,
                  color: Color(0xFF94A3B8),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    roomName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFFCBD5E1),
                      fontSize: 11.5,
                    ),
                  ),
                ),
                Text(
                  provider,
                  style: const TextStyle(
                    color: AinColors.gold,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AinSpacing.md),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onJoin,
              icon: const Icon(Icons.launch, size: 16),
              label: Text(
                strings.isArabic ? 'انضمام للحصة الآن' : 'Join Session Now',
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AinColors.brand,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AinRadii.md),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeHero extends StatelessWidget {
  const _HomeHero({required this.title, required this.subtitle, this.userName});

  final String title;
  final String subtitle;
  final String? userName;

  String _timeGreeting(AppStrings strings) {
    final hour = DateTime.now().hour;
    if (strings.isArabic) {
      if (hour < 12) return 'صباح الخير';
      if (hour < 17) return 'مساء الخير';
      return 'مساء النور';
    }
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Container(
      decoration: BoxDecoration(
        gradient: AinGradients.heroShimmer,
        borderRadius: BorderRadius.circular(AinRadii.xl),
        boxShadow: AinShadows.float,
      ),
      child: Stack(
        children: [
          // Decorative orbs for depth
          Positioned(
            top: -30,
            right: -30,
            child: Container(
              width: 140,
              height: 140,
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
            bottom: -20,
            left: -20,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AinColors.gold.withValues(alpha: 0.06),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AinSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(AinRadii.lg),
                        border: Border.all(
                          color: AinColors.gold.withValues(alpha: 0.4),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AinColors.gold.withValues(alpha: 0.15),
                            blurRadius: 20,
                            spreadRadius: -2,
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      padding: const EdgeInsets.all(6),
                      child: Image.asset(
                        'assets/branding/ain-logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) =>
                            const Center(
                          child: Text(
                            'عين',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AinSpacing.lg),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            userName != null
                                ? '${_timeGreeting(strings)}، $userName 👋'
                                : _timeGreeting(strings),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 17,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            subtitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.75),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: AinSpacing.sm),
                    InkWell(
                      onTap: () => context.go(NotificationInboxPage.routePath),
                      borderRadius: BorderRadius.circular(AinRadii.pill),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.15),
                          ),
                        ),
                        child: const Icon(
                          Icons.notifications_none_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AinSpacing.xl),
                _HeroStatRow(
                  coursesLabel: strings.isArabic ? 'الكورسات' : 'Courses',
                  bookingsLabel: strings.isArabic ? 'الحصص' : 'Bookings',
                  alertsLabel: strings.isArabic ? 'التنبيهات' : 'Alerts',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroStatRow extends StatelessWidget {
  const _HeroStatRow({
    required this.coursesLabel,
    required this.bookingsLabel,
    required this.alertsLabel,
  });

  final String coursesLabel;
  final String bookingsLabel;
  final String alertsLabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _HeroStat(value: '3', label: coursesLabel, icon: Icons.school_outlined),
        const SizedBox(width: AinSpacing.sm),
        _HeroStat(
          value: '1',
          label: bookingsLabel,
          icon: Icons.event_available_outlined,
        ),
        const SizedBox(width: AinSpacing.sm),
        _HeroStat(
          value: '0',
          label: alertsLabel,
          icon: Icons.notifications_none,
        ),
      ],
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({
    required this.value,
    required this.label,
    required this.icon,
  });

  final String value;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        decoration: BoxDecoration(
          color: AinColors.glassWhite,
          borderRadius: BorderRadius.circular(AinRadii.md),
          border: Border.all(
            color: AinColors.glassBorder,
          ),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AinSpacing.sm,
          vertical: AinSpacing.md,
        ),
        child: Column(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AinColors.gold.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 16, color: AinColors.gold),
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 18,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 10.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionGrid extends StatelessWidget {
  const _QuickActionGrid({required this.actions});

  final List<_HomeAction> actions;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final action in actions) ...[
          Expanded(child: _QuickActionCard(action: action)),
          if (action != actions.last) const SizedBox(width: AinSpacing.md),
        ],
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({required this.action});

  final _HomeAction action;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(AinRadii.lg),
      onTap: () => context.go(action.routePath),
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: AinColors.surface,
          borderRadius: BorderRadius.circular(AinRadii.lg),
          border: Border.all(color: const Color(0x0F16458F)),
          boxShadow: AinShadows.elevated,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top accent gradient strip
            Container(
              height: 3,
              decoration: const BoxDecoration(
                gradient: AinGradients.button,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AinSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AinIconBadge(
                    icon: action.icon,
                    backgroundColor: AinColors.brandSoft,
                    foregroundColor: AinColors.brand,
                  ),
                  const SizedBox(height: AinSpacing.md),
                  Text(
                    action.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: AinColors.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    action.subtitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 11,
                      color: AinColors.muted,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeSection extends StatelessWidget {
  const _HomeSection({
    required this.title,
    required this.actions,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final List<_HomeAction> actions;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AinSectionHeader(title: title, subtitle: subtitle),
        const SizedBox(height: AinSpacing.md),
        for (final action in actions) _HomeActionTile(action: action),
      ],
    );
  }
}

class _HomeActionTile extends StatelessWidget {
  const _HomeActionTile({required this.action});

  final _HomeAction action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.sm + 2),
      child: InkWell(
        borderRadius: BorderRadius.circular(AinRadii.lg),
        onTap: () => context.go(action.routePath),
        child: Container(
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: AinColors.surface,
            borderRadius: BorderRadius.circular(AinRadii.lg),
            border: Border.all(color: const Color(0x0A16458F)),
            boxShadow: AinShadows.card,
          ),
          child: IntrinsicHeight(
            child: Row(
              children: [
                // Left accent bar
                Container(
                  width: 3.5,
                  decoration: const BoxDecoration(
                    gradient: AinGradients.button,
                    borderRadius: BorderRadiusDirectional.only(
                      topStart: Radius.circular(AinRadii.lg),
                      bottomStart: Radius.circular(AinRadii.lg),
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(AinSpacing.md + 2),
                    child: Row(
                      children: [
                        AinIconBadge(icon: action.icon),
                        const SizedBox(width: AinSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                action.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 14.5,
                                  color: AinColors.ink,
                                  letterSpacing: -0.2,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                action.subtitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AinColors.muted,
                                  fontSize: 12,
                                  height: 1.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: AinSpacing.sm),
                        Container(
                          width: 30,
                          height: 30,
                          decoration: BoxDecoration(
                            color: AinColors.brandSoft,
                            borderRadius: BorderRadius.circular(AinRadii.pill),
                            border: Border.all(
                              color: AinColors.brand.withValues(alpha: 0.1),
                            ),
                          ),
                          child: const Icon(
                            Icons.arrow_forward_ios_rounded,
                            size: 12,
                            color: AinColors.brand,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HomeAction {
  const _HomeAction({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.routePath,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String routePath;
}

List<_HomeAction> _learningActions(AppStrings strings) {
  return [
    _HomeAction(
      icon: Icons.school_outlined,
      title: strings.exploreCourses,
      subtitle: strings.findCoursesHint,
      routePath: CourseCatalogPage.routePath,
    ),
    _HomeAction(
      icon: Icons.event_available_outlined,
      title: strings.lessonBookings,
      subtitle: strings.bookTeacherHint,
      routePath: LessonBookingsPage.routePath,
    ),
    _HomeAction(
      icon: Icons.fact_check_outlined,
      title: strings.attendance,
      subtitle: strings.attendanceHint,
      routePath: AttendancePage.routePath,
    ),
    _HomeAction(
      icon: Icons.assignment_outlined,
      title: strings.tabAssignments,
      subtitle: strings.isArabic
          ? 'متابعة وتسليم الواجبات الدراسية'
          : 'Submit and track assignments',
      routePath: MyCoursesPage.routePath,
    ),
    _HomeAction(
      icon: Icons.quiz_outlined,
      title: strings.tabQuizzes,
      subtitle: strings.isArabic
          ? 'خوض الاختبارات الفورية والتقييم'
          : 'Take timed quizzes & assessments',
      routePath: MyCoursesPage.routePath,
    ),
    _HomeAction(
      icon: Icons.notifications_none,
      title: strings.notifications,
      subtitle: strings.notificationsHint,
      routePath: NotificationInboxPage.routePath,
    ),
    _HomeAction(
      icon: Icons.schedule_outlined,
      title: strings.schedule,
      subtitle: strings.scheduleSubtitle,
      routePath: SchedulePage.routePath,
    ),
    _HomeAction(
      icon: Icons.person_outline,
      title: strings.profile,
      subtitle: strings.accountSettings,
      routePath: ProfilePage.routePath,
    ),
    _HomeAction(
      icon: Icons.video_camera_front_outlined,
      title: strings.liveMeetings,
      subtitle: strings.isArabic
          ? 'حصص البث المباشر التفاعلية عبر Zoom و Meet'
          : 'Interactive Zoom & Meet sessions',
      routePath: MyCoursesPage.routePath,
    ),
    _HomeAction(
      icon: Icons.forum_outlined,
      title: strings.tabDiscussion,
      subtitle: strings.isArabic
          ? 'نقاشات ومجتمع الغرفة التفاعلي مع المعلم'
          : 'In-room student & instructor Q&A',
      routePath: MyCoursesPage.routePath,
    ),
    _HomeAction(
      icon: Icons.workspace_premium_outlined,
      title: strings.certificatesLabel,
      subtitle: strings.isArabic
          ? 'الشهادات الصادرة وكود التحقق العام'
          : 'Issued certificates with public verification codes',
      routePath: ProfilePage.routePath,
    ),
  ];
}

List<_HomeAction> _platformActions(AppStrings strings, String? platformRole) {
  if (!_canOpenPlatform(platformRole)) {
    return const [];
  }

  return [
    _HomeAction(
      icon: Icons.admin_panel_settings_outlined,
      title: strings.platformOverview,
      subtitle: strings.platformOverviewHint,
      routePath: PlatformOverviewPage.routePath,
    ),
    _HomeAction(
      icon: Icons.verified_user_outlined,
      title: strings.academyApprovals,
      subtitle: strings.academyApprovalsHint,
      routePath: PlatformAcademyApprovalsPage.routePath,
    ),
    _HomeAction(
      icon: Icons.category_outlined,
      title: strings.platformCategories,
      subtitle: strings.platformCategoriesHint,
      routePath: PlatformCategoriesPage.routePath,
    ),
    _HomeAction(
      icon: Icons.fact_check_outlined,
      title: strings.courseApprovals,
      subtitle: strings.courseApprovalsHint,
      routePath: PlatformCourseApprovalsPage.routePath,
    ),
    _HomeAction(
      icon: Icons.campaign_outlined,
      title: strings.promotionApprovals,
      subtitle: strings.promotionApprovalsHint,
      routePath: PlatformPromotionApprovalsPage.routePath,
    ),
  ];
}

List<_HomeAction> _organizationActions(
  AppStrings strings,
  ActiveWorkspace? workspace,
) {
  final actions = <_HomeAction>[];

  void addIfAllowed(
    _HomeAction action, {
    required Set<String> permissions,
    String? module,
  }) {
    if (_canOpen(
      workspace,
      requiredPermissions: permissions,
      requiredModule: module,
    )) {
      actions.add(action);
    }
  }

  addIfAllowed(
    _HomeAction(
      icon: Icons.space_dashboard_outlined,
      title: strings.organizationOverview,
      subtitle: strings.organizationOverviewHint,
      routePath: OrganizationOverviewPage.routePath,
    ),
    permissions: {'organization.view'},
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.business_outlined,
      title: strings.organizationProfile,
      subtitle: strings.organizationProfileHint,
      routePath: OrganizationProfilePage.routePath,
    ),
    permissions: {'organization.update'},
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.campaign_outlined,
      title: strings.organizationAnnouncements,
      subtitle: strings.organizationAnnouncementsHint,
      routePath: OrganizationAnnouncementsPage.routePath,
    ),
    permissions: {'announcements.view'},
    module: 'announcements',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.fact_check_outlined,
      title: strings.organizationAttendance,
      subtitle: strings.organizationAttendanceHint,
      routePath: OrganizationAttendancePage.routePath,
    ),
    permissions: {'attendance.view'},
    module: 'attendance',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.campaign_outlined,
      title: strings.organizationPromotions,
      subtitle: strings.organizationPromotionsHint,
      routePath: OrganizationPromotionsPage.routePath,
    ),
    permissions: {'promotions.view'},
    module: 'promotions',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.analytics_outlined,
      title: strings.organizationAnalytics,
      subtitle: strings.organizationAnalyticsHint,
      routePath: OrganizationAnalyticsPage.routePath,
    ),
    permissions: {'analytics.view'},
    module: 'analytics',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.receipt_long_outlined,
      title: strings.organizationBookings,
      subtitle: strings.organizationBookingsHint,
      routePath: OrganizationBookingsPage.routePath,
    ),
    permissions: {'bookings.view'},
    module: 'bookings',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.folder_copy_outlined,
      title: strings.organizationContent,
      subtitle: strings.organizationContentHint,
      routePath: OrganizationContentPage.routePath,
    ),
    permissions: {'content.view'},
    module: 'content',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.dashboard_customize_outlined,
      title: strings.organizationCourses,
      subtitle: strings.organizationCoursesHint,
      routePath: OrganizationCoursesPage.routePath,
    ),
    permissions: {'courses.view'},
    module: 'courses',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.assignment_turned_in_outlined,
      title: strings.isArabic ? 'الواجبات والتصحيح' : 'Assignments & Grading',
      subtitle: strings.isArabic
          ? 'مراجعة تسليمات الطلاب ورصد الدرجات'
          : 'Review and grade student submissions',
      routePath: OrganizationCoursesPage.routePath,
    ),
    permissions: {'courses.view'},
    module: 'courses',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.quiz_outlined,
      title:
          strings.isArabic ? 'بنك الاختبارات والتقييم' : 'Quiz Bank & Grading',
      subtitle: strings.isArabic
          ? 'إدارة بنك الأسئلة والتقييم الآلي'
          : 'Manage quizzes and automated assessments',
      routePath: OrganizationCoursesPage.routePath,
    ),
    permissions: {'courses.view'},
    module: 'courses',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.support_agent_outlined,
      title: strings.isArabic
          ? 'مسار العملاء والمبيعات (CRM)'
          : 'CRM & Leads Pipeline',
      subtitle: strings.isArabic
          ? 'متابعة العملاء المحتملين والتواصل المباشر'
          : 'Track prospective leads and conversions',
      routePath: OrganizationBookingsPage.routePath,
    ),
    permissions: {'bookings.view'},
    module: 'bookings',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.school_outlined,
      title: strings.organizationInstructors,
      subtitle: strings.organizationInstructorsHint,
      routePath: OrganizationInstructorsPage.routePath,
    ),
    permissions: {'courses.view'},
    module: 'courses',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.event_available_outlined,
      title: strings.organizationEvents,
      subtitle: strings.organizationEventsHint,
      routePath: OrganizationEventsPage.routePath,
    ),
    permissions: {'events.view'},
    module: 'calendar',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.groups_outlined,
      title: strings.organizationMembers,
      subtitle: strings.organizationMembersHint,
      routePath: OrganizationMembersPage.routePath,
    ),
    permissions: {'members.view'},
    module: 'members',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.group_add_outlined,
      title: strings.organizationInvitations,
      subtitle: strings.organizationInvitationsHint,
      routePath: OrganizationInvitationsPage.routePath,
    ),
    permissions: {'members.view', 'members.invite'},
    module: 'members',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.task_alt_outlined,
      title: strings.organizationTasks,
      subtitle: strings.organizationTasksHint,
      routePath: OrganizationTasksPage.routePath,
    ),
    permissions: {'events.view', 'events.manage'},
    module: 'calendar',
  );
  addIfAllowed(
    _HomeAction(
      icon: Icons.meeting_room_outlined,
      title: strings.organizationRooms,
      subtitle: strings.organizationRoomsHint,
      routePath: OrganizationRoomsPage.routePath,
    ),
    permissions: {'rooms.view'},
    module: 'rooms',
  );

  return actions;
}

bool _canOpen(
  ActiveWorkspace? workspace, {
  required Set<String> requiredPermissions,
  String? requiredModule,
}) {
  return workspace?.canUseFeature(
        requiredPermissions: requiredPermissions,
        requiredModule: requiredModule,
      ) ??
      false;
}

bool _canOpenPlatform(String? platformRole) {
  return const <String>{
    'super_admin',
    'platform_support',
    'platform_moderator',
  }.contains(platformRole);
}

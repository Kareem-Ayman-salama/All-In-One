import 'package:ain_mobile/src/app/localization/app_locale_controller.dart';
import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/auth/data/auth_repository.dart';
import 'package:ain_mobile/src/features/learning/application/attendance_controller.dart';
import 'package:ain_mobile/src/features/metadata/application/mobile_readiness_controller.dart';
import 'package:ain_mobile/src/features/notifications/application/notification_controller.dart';
import 'package:ain_mobile/src/features/notifications/data/notification_repository.dart';
import 'package:ain_mobile/src/features/profile/application/profile_controller.dart';
import 'package:ain_mobile/src/features/profile/data/profile_documents_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  static const routePath = '/profile';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final profile = ref.watch(currentUserProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          strings.profile,
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await Future.wait<Object?>([
              ref.refresh(currentUserProfileProvider.future),
              ref.refresh(studentCertificatesProvider.future),
              ref.refresh(studentInvoicesProvider.future),
            ]);
          },
          child: profile.when(
            data: (data) => _ProfileBody(profile: data),
            error: (_, __) => ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const Icon(Icons.cloud_off, size: 48),
                const SizedBox(height: 12),
                Text(
                  strings.isArabic
                      ? 'تعذّر تحميل بيانات الحساب. تحقق من اتصالك وحاول مرة أخرى.'
                      : 'Could not load your account. Check your connection and try again.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => ref.invalidate(currentUserProfileProvider),
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
        ),
      ),
    );
  }
}

class _ProfileBody extends ConsumerWidget {
  const _ProfileBody({required this.profile});

  final CurrentUserProfile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final user = profile.user;
    final workspace = ref.watch(activeWorkspaceControllerProvider).valueOrNull;

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        // 1. Luxury Royal Header Card
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: AinGradients.heroShimmer,
            borderRadius: BorderRadius.circular(AinRadii.xl),
            boxShadow: AinShadows.float,
          ),
          child: Stack(
            children: [
              // Decorative orbs
              Positioned(
                top: -25,
                right: -25,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.white.withValues(alpha: 0.07),
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
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AinColors.gold.withValues(alpha: 0.06),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AinSpacing.xl),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: AinGradients.gold,
                        boxShadow: [
                          BoxShadow(
                            color: AinColors.gold.withValues(alpha: 0.3),
                            blurRadius: 20,
                            spreadRadius: -2,
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 32,
                        backgroundColor: AinColors.brandDark,
                        child: Text(
                          _initials(user.name),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
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
                            user.name,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.3,
                                ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            user.email,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.78),
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: [
                              AinStatusPill(
                                icon: Icons.badge_outlined,
                                label: user.roleLabel,
                                color: Colors.white,
                                backgroundColor:
                                    Colors.white.withValues(alpha: 0.15),
                              ),
                              if (user.emailVerified)
                                const AinStatusPill(
                                  icon: Icons.check_circle,
                                  label: 'موثق',
                                  color: Color(0xFF34D399),
                                  backgroundColor: Color(0x2E10B981),
                                ),
                              // Account ID Chip with one-tap copy
                              InkWell(
                                onTap: () {
                                  final accId = user.id;
                                  Clipboard.setData(ClipboardData(text: accId));
                                  HapticFeedback.lightImpact();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        strings.isArabic
                                            ? 'تم نسخ معرف الحساب ($accId)'
                                            : 'Account ID copied ($accId)',
                                      ),
                                      duration: const Duration(seconds: 2),
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                },
                                borderRadius:
                                    BorderRadius.circular(AinRadii.pill),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.28),
                                    borderRadius:
                                        BorderRadius.circular(AinRadii.pill),
                                    border: Border.all(
                                      color:
                                          Colors.white.withValues(alpha: 0.22),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.fingerprint,
                                        size: 12,
                                        color: AinColors.gold,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        '#${user.id.length > 12 ? user.id.substring(0, 12) : user.id}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10.5,
                                          fontFamily: 'monospace',
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(
                                        Icons.copy,
                                        size: 11,
                                        color: Colors.white70,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                          // Account security status banner
                          Container(
                            margin: const EdgeInsets.only(top: 12),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(AinRadii.sm),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.18),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.shield_outlined,
                                  size: 14,
                                  color: Color(0xFF34D399),
                                ),
                                const SizedBox(width: 5),
                                Expanded(
                                  child: Text(
                                    strings.isArabic
                                        ? 'إعدادات أمان الحساب والجلسات متاحة'
                                        : 'Account and session security settings available',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AinSpacing.lg),

        _ProfileSettingsGroup(
          icon: Icons.person_outline,
          title: strings.isArabic ? 'بيانات الحساب' : 'Account details',
          subtitle: strings.isArabic
              ? 'المعلومات الشخصية ومساحة العمل'
              : 'Personal information and workspace',
          initiallyExpanded: true,
          children: [
            _ProfileForm(user: user),
            _WorkspaceSummary(user: user),
          ],
        ),
        const SizedBox(height: AinSpacing.md),
        _ProfileSettingsGroup(
          icon: Icons.family_restroom_outlined,
          title:
              strings.isArabic ? 'الأسرة والمستندات' : 'Family and documents',
          subtitle: strings.isArabic
              ? 'ولي الأمر، الشهادات والفواتير'
              : 'Guardian, certificates, and invoices',
          children: [
            _GuardianFamilySection(user: user),
            const _OfficialDocumentsAndCertificatesSection(),
          ],
        ),
        const SizedBox(height: AinSpacing.md),
        _ProfileSettingsGroup(
          icon: Icons.notifications_none_outlined,
          title: strings.notificationPreferences,
          subtitle: strings.isArabic
              ? 'اختر القنوات وأنواع التنبيهات'
              : 'Choose channels and update types',
          children: [
            _NotificationPreferencesSection(
              organizationId: workspace?.organizationId,
              workspaceName: workspace?.name,
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.md),
        _ProfileSettingsGroup(
          icon: Icons.shield_outlined,
          title: strings.isArabic ? 'الأمان والأجهزة' : 'Security and devices',
          subtitle: strings.isArabic
              ? 'كلمة المرور، الجلسات والجهاز المسجل'
              : 'Password, sessions, and registered device',
          children: const [
            _ChangePasswordSection(),
            _SessionsSection(),
            _MyDeviceSection(),
          ],
        ),
        const SizedBox(height: AinSpacing.md),
        _ProfileSettingsGroup(
          icon: Icons.cloud_done_outlined,
          title: strings.isArabic
              ? 'المزامنة والعمل دون اتصال'
              : 'Sync and offline',
          subtitle: strings.isArabic
              ? 'حالة البيانات المتاحة على الجهاز'
              : 'Data available on this device',
          children: const [_OfflineReadinessSection()],
        ),
        const SizedBox(height: AinSpacing.lg),

        // 9. Sign Out Action Surface
        AinSurface(
          padding: const EdgeInsets.symmetric(
            horizontal: AinSpacing.md,
            vertical: AinSpacing.sm,
          ),
          child: ListTile(
            leading: const AinIconBadge(
              icon: Icons.logout,
              backgroundColor: AinColors.roseSoft,
              foregroundColor: AinColors.rose,
            ),
            title: Text(
              strings.signOut,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: AinColors.rose,
              ),
            ),
            subtitle: Text(strings.signOutHint),
            onTap: () async {
              await ref.read(authControllerProvider.notifier).signOut();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ),
        const SizedBox(height: AinSpacing.xxl),
      ],
    );
  }
}

class _ProfileSettingsGroup extends StatelessWidget {
  const _ProfileSettingsGroup({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.children,
    this.initiallyExpanded = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final List<Widget> children;
  final bool initiallyExpanded;

  @override
  Widget build(BuildContext context) {
    return AinSurface(
      padding: EdgeInsets.zero,
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: initiallyExpanded,
          maintainState: true,
          tilePadding: const EdgeInsets.symmetric(
            horizontal: AinSpacing.md,
            vertical: AinSpacing.xs,
          ),
          childrenPadding: const EdgeInsets.fromLTRB(
            AinSpacing.md,
            0,
            AinSpacing.md,
            AinSpacing.md,
          ),
          leading: AinIconBadge(
            icon: icon,
            size: 42,
            iconSize: 20,
          ),
          title: Text(
            title,
            style: const TextStyle(
              color: AinColors.textPrimary,
              fontSize: 14.5,
              fontWeight: FontWeight.w800,
            ),
          ),
          subtitle: Text(
            subtitle,
            style: const TextStyle(
              color: AinColors.textSecondary,
              fontSize: 11.5,
              height: 1.35,
            ),
          ),
          children: [
            for (var index = 0; index < children.length; index++) ...[
              if (index > 0) const SizedBox(height: AinSpacing.md),
              children[index],
            ],
          ],
        ),
      ),
    );
  }
}

class _GuardianFamilySection extends ConsumerWidget {
  const _GuardianFamilySection({required this.user});

  final AuthUserProfile user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final guardianAttendanceAsync = ref.watch(guardianAttendanceProvider);

    return guardianAttendanceAsync.when(
      data: (overview) {
        final hasStudents = overview.students.isNotEmpty;
        return AinSurface(
          padding: const EdgeInsets.all(AinSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const AinIconBadge(
                    icon: Icons.family_restroom_outlined,
                    backgroundColor: Color(0x1A16458F),
                    foregroundColor: AinColors.brand,
                  ),
                  const SizedBox(width: AinSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          strings.isArabic
                              ? 'بوابة ولي الأمر والأبناء'
                              : 'Guardian & Family Portal',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          hasStudents
                              ? (strings.isArabic
                                  ? 'متابعة ${overview.students.length} من الأبناء المعتمدين'
                                  : 'Tracking ${overview.students.length} linked student(s)')
                              : (strings.isArabic
                                  ? 'الربط الأسري والتنبيهات المباشرة'
                                  : 'Family link & automated alerts'),
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AinColors.muted,
                                  ),
                        ),
                      ],
                    ),
                  ),
                  AinSecondaryButton(
                    label: strings.isArabic ? 'سجل الحضور' : 'Attendance',
                    icon: Icons.open_in_new,
                    onPressed: () => context.push('/attendance'),
                  ),
                ],
              ),
              const SizedBox(height: AinSpacing.md),
              if (hasStudents) ...[
                const Divider(height: 1),
                const SizedBox(height: AinSpacing.md),
                for (final studentAttendance in overview.attendance)
                  Container(
                    margin: const EdgeInsets.only(bottom: AinSpacing.sm),
                    padding: const EdgeInsets.all(AinSpacing.md),
                    decoration: BoxDecoration(
                      color: AinColors.surfaceSubtle,
                      borderRadius: BorderRadius.circular(AinRadii.md),
                      border: Border.all(color: const Color(0x0F16458F)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 18,
                              backgroundColor: AinColors.brandSoft,
                              child: Text(
                                _initials(studentAttendance.student.name),
                                style: const TextStyle(
                                  color: AinColors.brand,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            const SizedBox(width: AinSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    studentAttendance.student.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    strings.isArabic
                                        ? 'حاضر: ${studentAttendance.summary.present} | غائب: ${studentAttendance.summary.absent}'
                                        : 'Present: ${studentAttendance.summary.present} | Absent: ${studentAttendance.summary.absent}',
                                    style: const TextStyle(
                                      color: AinColors.muted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            AinStatusPill(
                              icon: Icons.insights,
                              label:
                                  '${studentAttendance.summary.attendanceRate}%',
                              color:
                                  studentAttendance.summary.attendanceRate >= 85
                                      ? AinColors.success
                                      : AinColors.warning,
                              backgroundColor:
                                  studentAttendance.summary.attendanceRate >= 85
                                      ? AinColors.successSoft
                                      : AinColors.warningSoft,
                            ),
                          ],
                        ),
                        const SizedBox(height: AinSpacing.sm),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(AinRadii.sm),
                            border: Border.all(color: AinColors.borderLight),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.assignment_turned_in_outlined,
                                size: 15,
                                color: AinColors.brand,
                              ),
                              const SizedBox(width: 5),
                              Expanded(
                                child: Text(
                                  strings.isArabic
                                      ? 'الواجبات: 95/100 (معتمد)'
                                      : 'Assignments: 95/100 (Graded)',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const Icon(
                                Icons.quiz_outlined,
                                size: 15,
                                color: AinColors.success,
                              ),
                              const SizedBox(width: 5),
                              Expanded(
                                child: Text(
                                  strings.isArabic
                                      ? 'الاختبارات: 90% (اجتياز)'
                                      : 'Quizzes: 90% (Passed)',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AinColors.success,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(AinSpacing.md),
                  decoration: BoxDecoration(
                    color: AinColors.surfaceSubtle,
                    borderRadius: BorderRadius.circular(AinRadii.md),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.verified_user_outlined,
                        color: AinColors.success,
                        size: 20,
                      ),
                      const SizedBox(width: AinSpacing.sm),
                      Expanded(
                        child: Text(
                          strings.isArabic
                              ? 'يتم إرسال إشعارات الحضور والتقارير الأسبوعية وتنبيهات الغياب لولي الأمر المسجل بالأكاديمية.'
                              : 'Attendance alerts and weekly reports are synced with the registered guardian.',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AinColors.textSecondary,
                                    height: 1.35,
                                  ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _ProfileForm extends ConsumerStatefulWidget {
  const _ProfileForm({required this.user});

  final AuthUserProfile user;

  @override
  ConsumerState<_ProfileForm> createState() => _ProfileFormState();
}

class _ProfileFormState extends ConsumerState<_ProfileForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _bioController;
  late final TextEditingController _locationController;
  late final TextEditingController _timezoneController;
  late String _locale;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.user.name);
    _phoneController = TextEditingController(
      text: widget.user.phone ?? '',
    );
    _bioController = TextEditingController(
      text: widget.user.bio ?? '',
    );
    _locationController = TextEditingController(
      text: widget.user.location ?? '',
    );
    _timezoneController = TextEditingController(
      text: widget.user.timezone ?? 'Africa/Cairo',
    );
    _locale = widget.user.locale == 'en' ? 'en' : 'ar';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    _locationController.dispose();
    _timezoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Form(
      key: _formKey,
      child: AinSurface(
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AinSectionHeader(
              title: strings.accountSettings,
              subtitle: strings.isArabic
                  ? 'البيانات الشخصية ورقم الهاتف والمسار والمنطقة الزمنية'
                  : 'Manage personal profile, WhatsApp alerts, bio and timezone',
            ),
            const SizedBox(height: AinSpacing.lg),
            TextFormField(
              controller: _nameController,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(
                labelText: strings.fullName,
                prefixIcon: const Icon(Icons.person_outline, size: 20),
              ),
              validator: (value) => value == null || value.trim().length < 2
                  ? strings.fullNameRequired
                  : null,
            ),
            const SizedBox(height: AinSpacing.md),
            // Phone & WhatsApp with prefix and validation
            TextFormField(
              controller: _phoneController,
              textInputAction: TextInputAction.next,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: strings.isArabic
                    ? 'رقم الهاتف وتنبيهات الواتساب'
                    : 'Phone & WhatsApp Alerts',
                prefixIcon: const Icon(
                  Icons.phone_iphone_outlined,
                  size: 20,
                  color: Color(0xFF10B981),
                ),
                suffixIcon: Container(
                  margin: const EdgeInsets.all(8),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0x1A10B981),
                    borderRadius: BorderRadius.circular(AinRadii.pill),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.chat,
                        size: 13,
                        color: Color(0xFF10B981),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        strings.isArabic ? 'واتساب نشط' : 'Active',
                        style: const TextStyle(
                          color: Color(0xFF059669),
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                helperText: strings.isArabic
                    ? 'يستخدم لإرسال تنبيهات الحصص المباشرة والواجبات'
                    : 'Used for live lecture and quiz alerts on WhatsApp',
              ),
              validator: (value) => value == null || value.trim().length < 8
                  ? (strings.isArabic
                      ? 'يرجى كتابة رقم هاتف صحيح'
                      : 'Enter a valid phone number')
                  : null,
            ),
            const SizedBox(height: AinSpacing.md),
            // Bio & Specialization
            TextFormField(
              controller: _bioController,
              maxLines: 2,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(
                labelText: strings.isArabic
                    ? 'النبذة التخصصية / المسار الأكاديمي'
                    : 'Bio & Academic Specialization',
                prefixIcon: const Icon(Icons.school_outlined, size: 20),
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: AinSpacing.md),
            // Location / City
            TextFormField(
              controller: _locationController,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(
                labelText: strings.isArabic
                    ? 'المقر الجغرافي والمدينة'
                    : 'Location / City',
                prefixIcon: const Icon(Icons.location_on_outlined, size: 20),
              ),
            ),
            const SizedBox(height: AinSpacing.md),
            DropdownButtonFormField<String>(
              initialValue: _locale,
              decoration: InputDecoration(
                labelText: strings.language,
                prefixIcon: const Icon(Icons.translate, size: 20),
              ),
              items: [
                DropdownMenuItem(value: 'ar', child: Text(strings.arabic)),
                DropdownMenuItem(value: 'en', child: Text(strings.english)),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() => _locale = value);
                  ref
                      .read(appLocaleControllerProvider.notifier)
                      .setLocale(Locale(value));
                }
              },
            ),
            const SizedBox(height: AinSpacing.md),
            TextFormField(
              controller: _timezoneController,
              textInputAction: TextInputAction.done,
              decoration: InputDecoration(
                labelText: strings.timezone,
                prefixIcon: const Icon(Icons.schedule, size: 20),
              ),
              validator: (value) => value == null || value.trim().isEmpty
                  ? strings.timezoneRequired
                  : null,
            ),
            const SizedBox(height: AinSpacing.lg),
            AinPrimaryButton(
              onPressed: _submitting ? null : _submit,
              loading: _submitting,
              icon: Icons.save,
              label: strings.saveChanges,
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
      await ref.read(profileActionsProvider).updateProfile(
            command: UpdateUserProfileCommand(
              name: _nameController.text,
              locale: _locale,
              timezone: _timezoneController.text,
              phone: _phoneController.text,
              bio: _bioController.text,
              location: _locationController.text,
            ),
          );
      ref.read(appLocaleControllerProvider.notifier).setLocale(Locale(_locale));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.profileUpdated)),
        );
      }
    } on Object catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              strings.isArabic
                  ? 'تعذّر حفظ التغييرات. حاول مرة أخرى.'
                  : 'Could not save changes. Please try again.',
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}

class _SessionsSection extends ConsumerWidget {
  const _SessionsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final sessions = ref.watch(userSessionsProvider);

    return AinSurface(
      padding: const EdgeInsets.all(AinSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: AinSectionHeader(
                  title: strings.activeSessions,
                  subtitle: strings.isArabic
                      ? 'الأجهزة والجلسات المسجلة حالياً'
                      : 'Currently signed in devices and sessions',
                ),
              ),
              TextButton(
                onPressed: () => _revokeOthers(context, ref),
                child: Text(strings.signOutOtherDevices),
              ),
            ],
          ),
          const SizedBox(height: AinSpacing.md),
          sessions.when(
            data: (items) {
              if (items.isEmpty) {
                return Text(strings.noActiveSessions);
              }

              return Column(
                children: [
                  for (final session in items) _SessionTile(session: session),
                ],
              );
            },
            error: (error, stackTrace) => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(error.toString()),
                const SizedBox(height: AinSpacing.sm),
                AinSecondaryButton(
                  onPressed: () => ref.invalidate(userSessionsProvider),
                  icon: Icons.refresh,
                  label: strings.retry,
                ),
              ],
            ),
            loading: () => const Align(
              alignment: AlignmentDirectional.centerStart,
              child: CircularProgressIndicator(),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _revokeOthers(BuildContext context, WidgetRef ref) async {
    final strings = AppStrings.of(context);
    try {
      await ref.read(profileActionsProvider).revokeOtherSessions();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.otherSessionsRevoked)),
        );
      }
    } on Object catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              strings.isArabic
                  ? 'تعذّر تنفيذ الطلب. حاول مرة أخرى.'
                  : 'Could not complete the request. Please try again.',
            ),
          ),
        );
      }
    }
  }
}

class _OfflineReadinessSection extends ConsumerWidget {
  const _OfflineReadinessSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final readiness = ref.watch(mobileReadinessProvider);

    return AinSurface(
      padding: const EdgeInsets.all(AinSpacing.lg),
      child: readiness.when(
        data: (summary) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinSectionHeader(
              title: strings.offlineReadiness,
              subtitle: strings.offlineReadinessHint,
            ),
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(
                  label: Text(
                    strings.persistableDatasets(
                      summary.persistableDatasetCount,
                    ),
                  ),
                ),
                Chip(
                  label: Text(
                    strings.memoryOnlyDatasets(
                      summary.memoryOnlyDatasetCount,
                    ),
                  ),
                ),
                Chip(
                  label: Text(
                    strings.optimisticWrites(summary.optimisticWriteCount),
                  ),
                ),
                Chip(
                  label: Text(
                    strings.serverConfirmedWrites(
                      summary.serverConfirmedWriteCount,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _PolicyRow(
              icon: summary.signedContentIsMemoryOnly
                  ? Icons.lock
                  : Icons.warning_amber,
              label: strings.signedUrlsProtected,
              value: summary.signedContentIsMemoryOnly
                  ? strings.memoryOnly
                  : strings.needsAttention,
            ),
            _PolicyRow(
              icon: Icons.devices,
              label: strings.maxActiveSessions,
              value: summary.maxActiveSessions.toString(),
            ),
            _PolicyRow(
              icon: Icons.link,
              label: strings.deepLinkManifest,
              value: summary.deepLinkVersion,
            ),
            _PolicyRow(
              icon: Icons.route,
              label: strings.deepLinkRoutes,
              value: strings.deepLinkRoutesCount(
                summary.deepLinkRouteCount,
                summary.authRequiredDeepLinkCount,
              ),
            ),
            if (summary.purgeTriggers.isNotEmpty)
              _PolicyRow(
                icon: Icons.cleaning_services,
                label: strings.cachePurgeTriggers,
                value: summary.purgeTriggers.take(3).join(', '),
              ),
            if (summary.disallowedPractices.isNotEmpty)
              _PolicyRow(
                icon: Icons.privacy_tip,
                label: strings.disallowedDevicePractices,
                value: summary.disallowedPractices.take(2).join(', '),
              ),
          ],
        ),
        error: (error, stackTrace) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinSectionHeader(
              title: strings.offlineReadiness,
              subtitle: error.toString(),
            ),
            const SizedBox(height: AinSpacing.md),
            AinSecondaryButton(
              onPressed: () => ref.invalidate(mobileReadinessProvider),
              icon: Icons.refresh,
              label: strings.retry,
            ),
          ],
        ),
        loading: () => Row(
          children: [
            const SizedBox.square(
              dimension: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: 12),
            Text(strings.offlineReadiness),
          ],
        ),
      ),
    );
  }
}

class _PolicyRow extends StatelessWidget {
  const _PolicyRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text(label)),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationPreferencesSection extends ConsumerWidget {
  const _NotificationPreferencesSection({
    required this.organizationId,
    required this.workspaceName,
  });

  final String? organizationId;
  final String? workspaceName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final preferences = ref.watch(
      notificationPreferencesProvider(organizationId),
    );

    return AinSurface(
      padding: const EdgeInsets.all(AinSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AinSectionHeader(
            title: strings.notificationPreferences,
            subtitle: workspaceName == null
                ? strings.globalNotificationPreferences
                : strings.workspaceNotificationPreferences(workspaceName!),
          ),
          const SizedBox(height: AinSpacing.md),
          preferences.when(
            data: (value) => Column(
              children: [
                _PreferenceSwitch(
                  title: strings.inAppNotifications,
                  value: value.inAppEnabled,
                  onChanged: (next) => _update(
                    context,
                    ref,
                    UpdateNotificationPreferencesCommand.fromPreferences(
                      value,
                      inAppEnabled: next,
                    ),
                  ),
                ),
                _PreferenceSwitch(
                  title: strings.emailNotifications,
                  value: value.emailEnabled,
                  onChanged: (next) => _update(
                    context,
                    ref,
                    UpdateNotificationPreferencesCommand.fromPreferences(
                      value,
                      emailEnabled: next,
                    ),
                  ),
                ),
                _PreferenceSwitch(
                  title: strings.pushNotifications,
                  value: value.pushEnabled,
                  onChanged: (next) => _update(
                    context,
                    ref,
                    UpdateNotificationPreferencesCommand.fromPreferences(
                      value,
                      pushEnabled: next,
                    ),
                  ),
                ),
                const Divider(),
                _PreferenceSwitch(
                  title: strings.bookingUpdates,
                  value: value.bookingUpdates,
                  onChanged: (next) => _update(
                    context,
                    ref,
                    UpdateNotificationPreferencesCommand.fromPreferences(
                      value,
                      bookingUpdates: next,
                    ),
                  ),
                ),
                _PreferenceSwitch(
                  title: strings.announcementNotifications,
                  value: value.announcements,
                  onChanged: (next) => _update(
                    context,
                    ref,
                    UpdateNotificationPreferencesCommand.fromPreferences(
                      value,
                      announcements: next,
                    ),
                  ),
                ),
                _PreferenceSwitch(
                  title: strings.subscriptionReminders,
                  value: value.subscriptionReminders,
                  onChanged: (next) => _update(
                    context,
                    ref,
                    UpdateNotificationPreferencesCommand.fromPreferences(
                      value,
                      subscriptionReminders: next,
                    ),
                  ),
                ),
              ],
            ),
            error: (error, stackTrace) => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(error.toString()),
                const SizedBox(height: 8),
                AinSecondaryButton(
                  onPressed: () => ref.invalidate(
                    notificationPreferencesProvider(organizationId),
                  ),
                  icon: Icons.refresh,
                  label: strings.retry,
                ),
              ],
            ),
            loading: () => const Align(
              alignment: AlignmentDirectional.centerStart,
              child: CircularProgressIndicator(),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _update(
    BuildContext context,
    WidgetRef ref,
    UpdateNotificationPreferencesCommand command,
  ) async {
    final strings = AppStrings.of(context);
    try {
      await ref.read(notificationPreferenceActionsProvider).update(
            command: command,
          );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.notificationPreferencesUpdated)),
        );
      }
    } on Object catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              strings.isArabic
                  ? 'تعذّر تحديث التفضيلات. حاول مرة أخرى.'
                  : 'Could not update preferences. Please try again.',
            ),
          ),
        );
      }
    }
  }
}

class _PreferenceSwitch extends StatelessWidget {
  const _PreferenceSwitch({
    required this.title,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title),
      value: value,
      onChanged: onChanged,
    );
  }
}

class _SessionTile extends ConsumerWidget {
  const _SessionTile({required this.session});

  final UserSessionSummary session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.devices),
      title: Text(session.displayName),
      subtitle: Text(
        [
          if (session.platform != null) session.platform,
          if (session.appVersion != null) session.appVersion,
          if (session.ipAddress != null) session.ipAddress,
          if (session.lastUsedAt != null)
            strings.lastUsedAt(session.lastUsedAt!),
          if (session.expiresAt != null)
            strings.sessionExpiresAt(session.expiresAt!),
        ].whereType<String>().join('\n'),
      ),
      trailing: IconButton(
        tooltip: strings.revokeSession,
        onPressed: () => _revoke(context, ref),
        icon: const Icon(Icons.close),
      ),
    );
  }

  Future<void> _revoke(BuildContext context, WidgetRef ref) async {
    final strings = AppStrings.of(context);
    try {
      await ref.read(profileActionsProvider).revokeSession(session.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.sessionRevoked)),
        );
      }
    } on Object catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              strings.isArabic
                  ? 'تعذّر إلغاء الجلسة. حاول مرة أخرى.'
                  : 'Could not revoke the session. Please try again.',
            ),
          ),
        );
      }
    }
  }
}

class _WorkspaceSummary extends StatelessWidget {
  const _WorkspaceSummary({required this.user});

  final AuthUserProfile user;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return AinSurface(
      padding: const EdgeInsets.all(AinSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: AinSectionHeader(
                  title: strings.profileWorkspaces,
                  subtitle: strings.isArabic
                      ? 'الأكاديميات ومساحات العمل المسجل بها'
                      : 'Enrolled academies & workspaces',
                ),
              ),
              TextButton(
                onPressed: () => context.go(WorkspaceSelectionPage.routePath),
                child: Text(strings.chooseWorkspace),
              ),
            ],
          ),
          const SizedBox(height: AinSpacing.md),
          if (user.workspaces.isEmpty)
            Text(strings.noProfileWorkspaces)
          else
            for (final workspace in user.workspaces)
              Container(
                margin: const EdgeInsets.only(bottom: AinSpacing.sm),
                padding: const EdgeInsets.all(AinSpacing.md),
                decoration: BoxDecoration(
                  color: AinColors.surfaceSubtle,
                  borderRadius: BorderRadius.circular(AinRadii.md),
                  border: Border.all(color: const Color(0x0F16458F)),
                ),
                child: Row(
                  children: [
                    const AinIconBadge(
                      icon: Icons.business,
                      backgroundColor: Color(0x1A16458F),
                      foregroundColor: AinColors.brand,
                    ),
                    const SizedBox(width: AinSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            workspace.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            [
                              workspace.type,
                              strings.organizationRoleLabel(workspace.role),
                              '${workspace.permissions.length} ${strings.permissions}',
                            ]
                                .where((value) => value.trim().isNotEmpty)
                                .join(' - '),
                            style: const TextStyle(
                              color: AinColors.muted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}

String _initials(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .toList(growable: false);
  if (parts.isEmpty) {
    return 'A';
  }
  return parts.take(2).map((part) => part[0].toUpperCase()).join();
}

class _ChangePasswordSection extends ConsumerStatefulWidget {
  const _ChangePasswordSection();

  @override
  ConsumerState<_ChangePasswordSection> createState() =>
      _ChangePasswordSectionState();
}

class _ChangePasswordSectionState
    extends ConsumerState<_ChangePasswordSection> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isExpanded = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  int _passwordStrength = 0;

  @override
  void initState() {
    super.initState();
    _newPasswordController.addListener(() {
      final text = _newPasswordController.text;
      final strength = _calculateStrength(text);
      if (strength != _passwordStrength) {
        setState(() => _passwordStrength = strength);
      }
    });
  }

  int _calculateStrength(String pass) {
    if (pass.isEmpty) return 0;
    int score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 10) score++;
    if (RegExp(r'[0-9]').hasMatch(pass)) score++;
    if (RegExp(r'[A-Za-z]').hasMatch(pass) &&
        RegExp(r'[^A-Za-z0-9]').hasMatch(pass)) {
      score++;
    }
    return score.clamp(1, 4);
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final authState = ref.watch(authControllerProvider);

    return AinSurface(
      padding: const EdgeInsets.all(AinSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: () {
              setState(() {
                _isExpanded = !_isExpanded;
              });
            },
            child: Row(
              children: [
                const AinIconBadge(
                  icon: Icons.shield_outlined,
                  backgroundColor: Color(0x1A16458F),
                  foregroundColor: AinColors.brand,
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        strings.isArabic
                            ? 'الأمان وكلمة المرور والجلسات'
                            : 'Security, Password & Sessions',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        strings.isArabic
                            ? 'تحديث كلمة المرور، التحقق بالبريد، وإبطال الجلسات'
                            : 'Update password, email verification, and revoke sessions',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AinColors.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  _isExpanded ? Icons.expand_less : Icons.expand_more,
                  color: AinColors.muted,
                ),
              ],
            ),
          ),
          if (_isExpanded) ...[
            const Divider(height: 24),
            // Login verification status
            Container(
              padding: const EdgeInsets.all(AinSpacing.md),
              decoration: BoxDecoration(
                color: AinColors.surfaceSubtle,
                borderRadius: BorderRadius.circular(AinRadii.md),
                border: Border.all(color: const Color(0x1416458F)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.mark_email_read_outlined,
                    size: 18,
                    color: Color(0xFF10B981),
                  ),
                  const SizedBox(width: AinSpacing.sm),
                  Expanded(
                    child: Text(
                      strings.isArabic
                          ? 'ترسل المنصة رمز تحقق إلى البريد المسجل عندما تتطلب محاولة الدخول تحققاً إضافياً. إعداد واتساب وSMS وتطبيقات المصادقة غير متاح في هذا الإصدار.'
                          : 'AIN emails a verification code when a login requires an additional check. WhatsApp, SMS, and authenticator-app setup are not available in this release.',
                      style: const TextStyle(fontSize: 12, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AinSpacing.lg),
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    strings.isArabic
                        ? 'تغيير كلمة المرور'
                        : 'Change Account Password',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13.5,
                    ),
                  ),
                  const SizedBox(height: AinSpacing.sm),
                  AinTextField(
                    controller: _currentPasswordController,
                    label: strings.currentPassword,
                    icon: Icons.lock_outline,
                    obscureText: _obscureCurrent,
                    suffix: IconButton(
                      icon: Icon(
                        _obscureCurrent
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                        size: 20,
                        color: AinColors.muted,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscureCurrent = !_obscureCurrent;
                        });
                      },
                    ),
                    validator: (value) => (value == null || value.isEmpty)
                        ? strings.currentPasswordRequired
                        : null,
                  ),
                  const SizedBox(height: 12),
                  AinTextField(
                    controller: _newPasswordController,
                    label: strings.newPassword,
                    icon: Icons.lock_outline,
                    obscureText: _obscureNew,
                    suffix: IconButton(
                      icon: Icon(
                        _obscureNew
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                        size: 20,
                        color: AinColors.muted,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscureNew = !_obscureNew;
                        });
                      },
                    ),
                    validator: (value) => (value?.length ?? 0) >= 10
                        ? null
                        : strings.passwordMinTen,
                  ),
                  // Dynamic Password Strength Meter
                  if (_newPasswordController.text.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        for (int i = 1; i <= 4; i++)
                          Expanded(
                            child: Container(
                              margin: const EdgeInsets.symmetric(horizontal: 2),
                              height: 4,
                              decoration: BoxDecoration(
                                color: i <= _passwordStrength
                                    ? (_passwordStrength == 1
                                        ? AinColors.rose
                                        : _passwordStrength == 2
                                            ? AinColors.warning
                                            : _passwordStrength == 3
                                                ? AinColors.teal
                                                : const Color(0xFF10B981))
                                    : Colors.grey.shade300,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _passwordStrength == 1
                          ? (strings.isArabic
                              ? 'قوة الرمز: ضعيفة (اكتب 10 خانات على الأقل)'
                              : 'Strength: Weak (at least 10 chars)')
                          : _passwordStrength == 2
                              ? (strings.isArabic
                                  ? 'قوة الرمز: متوسطة (أضف أرقاماً)'
                                  : 'Strength: Fair (add digits)')
                              : _passwordStrength == 3
                                  ? (strings.isArabic
                                      ? 'قوة الرمز: جيدة ومقبولة'
                                      : 'Strength: Good')
                                  : (strings.isArabic
                                      ? 'قوة الرمز: ممتازة ومعقدة 🔒'
                                      : 'Strength: Robust 🔒'),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: _passwordStrength == 1
                            ? AinColors.rose
                            : _passwordStrength == 2
                                ? AinColors.warning
                                : _passwordStrength == 3
                                    ? AinColors.teal
                                    : const Color(0xFF10B981),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  AinTextField(
                    controller: _confirmPasswordController,
                    label: strings.confirmNewPassword,
                    icon: Icons.lock_clock_outlined,
                    obscureText: _obscureConfirm,
                    suffix: IconButton(
                      icon: Icon(
                        _obscureConfirm
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                        size: 20,
                        color: AinColors.muted,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscureConfirm = !_obscureConfirm;
                        });
                      },
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return strings.confirmNewPassword;
                      }
                      if (value != _newPasswordController.text) {
                        return strings.passwordsDoNotMatch;
                      }
                      return null;
                    },
                  ),
                  if (authState.errorMessage != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      authState.errorMessage!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                        fontSize: 12,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  AinPrimaryButton(
                    label: strings.changePasswordTitle,
                    icon: Icons.check,
                    loading: authState.isSubmitting,
                    onPressed: _submit,
                  ),
                  const SizedBox(height: AinSpacing.md),
                  // Emergency Session Kill Switch
                  OutlinedButton.icon(
                    onPressed: () => _confirmKillOtherSessions(context),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AinColors.rose,
                      side: const BorderSide(color: Color(0x40E11D48)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AinRadii.md),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    icon: const Icon(Icons.logout, size: 16),
                    label: Text(
                      strings.isArabic
                          ? 'تسجيل خروج كافة الأجهزة الأخرى فوراً (Kill Switch)'
                          : 'Sign out all other sessions immediately',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _confirmKillOtherSessions(BuildContext context) {
    final strings = AppStrings.of(context);
    showDialog<void>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: Row(
          children: [
            const Icon(
              Icons.warning_amber_rounded,
              color: AinColors.rose,
              size: 24,
            ),
            const SizedBox(width: 8),
            Text(
              strings.isArabic ? 'تسجيل خروج الأجهزة' : 'Revoke Other Sessions',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
          ],
        ),
        content: Text(
          strings.isArabic
              ? 'هل أنت متأكد من تسجيل الخروج من كافة الأجهزة والمتصفحات الأخرى فوراً؟ سيتم إلغاء أي جلسة نشطة عدا هذا الهاتف.'
              : 'Are you sure you want to sign out all other devices? All active sessions except this phone will be terminated.',
          style: const TextStyle(fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: Text(strings.isArabic ? 'إلغاء' : 'Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AinColors.rose),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              final revokedText = strings.otherSessionsRevoked;
              Navigator.pop(dialogCtx);
              try {
                await ref.read(profileActionsProvider).revokeOtherSessions();
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(revokedText),
                    backgroundColor: AinColors.brand,
                  ),
                );
              } catch (e) {
                messenger.showSnackBar(
                  SnackBar(content: Text(e.toString())),
                );
              }
            },
            child: Text(strings.isArabic ? 'تأكيد الخروج' : 'Confirm Sign Out'),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final strings = AppStrings.of(context);
    final success =
        await ref.read(authControllerProvider.notifier).changePassword(
              currentPassword: _currentPasswordController.text,
              newPassword: _newPasswordController.text,
              newPasswordConfirmation: _confirmPasswordController.text,
            );

    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(strings.passwordChangedSuccess),
          backgroundColor: AinColors.brand,
        ),
      );
      context.go('/login');
    }
  }
}

class _OfficialDocumentsAndCertificatesSection extends ConsumerWidget {
  const _OfficialDocumentsAndCertificatesSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final certificates = ref.watch(studentCertificatesProvider);
    final invoices = ref.watch(studentInvoicesProvider);
    final certificateItems = certificates.valueOrNull ?? const [];
    final invoiceItems = invoices.valueOrNull ?? const [];
    final certificate =
        certificateItems.isEmpty ? null : certificateItems.first;
    final invoice = invoiceItems.isEmpty ? null : invoiceItems.first;

    return AinSurface(
      padding: const EdgeInsets.all(AinSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const AinIconBadge(
                icon: Icons.workspace_premium_outlined,
                backgroundColor: Color(0x1AF59E0B),
                foregroundColor: AinColors.gold,
              ),
              const SizedBox(width: AinSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      strings.isArabic
                          ? 'الشهادات والمستندات الرسمية'
                          : 'Certificates & Official Records',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      strings.isArabic
                          ? 'الشهادات والفواتير الصادرة فعلياً على حسابك'
                          : 'Certificates and invoices issued to your account',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AinColors.muted,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AinSpacing.md),

          if (certificates.isLoading || invoices.isLoading) ...[
            const LinearProgressIndicator(minHeight: 2),
            const SizedBox(height: AinSpacing.md),
          ],
          if (certificates.hasError || invoices.hasError) ...[
            Row(
              children: [
                const Icon(Icons.sync_problem, color: AinColors.warning),
                const SizedBox(width: AinSpacing.sm),
                Expanded(
                  child: Text(
                    strings.isArabic
                        ? 'تعذر تحديث المستندات. اسحب الصفحة لأسفل للمحاولة مرة أخرى.'
                        : 'Documents could not be refreshed. Pull down to try again.',
                    style: const TextStyle(color: AinColors.muted),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
          ],

          // Document authenticity notice
          Container(
            padding: const EdgeInsets.all(AinSpacing.md),
            decoration: BoxDecoration(
              color: const Color(0x0D10B981),
              borderRadius: BorderRadius.circular(AinRadii.md),
              border: Border.all(color: const Color(0x3310B981)),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.verified_outlined,
                  color: Color(0xFF10B981),
                  size: 22,
                ),
                const SizedBox(width: AinSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        strings.isArabic
                            ? 'بيانات موثقة من سجلات المنصة'
                            : 'Verified platform records',
                        style: const TextStyle(
                          color: Color(0xFF047857),
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        strings.isArabic
                            ? 'تعرض هذه الصفحة فقط الشهادات والفواتير الصادرة فعلياً على حسابك، ويمكن التحقق من الشهادة باستخدام كود الاعتماد.'
                            : 'This page only shows records actually issued to your account. Certificates can be checked using their verification code.',
                        style: const TextStyle(
                          color: Color(0xFF065F46),
                          fontSize: 11,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AinSpacing.md),

          // Certified Certificate Tile
          Container(
            padding: const EdgeInsets.all(AinSpacing.md),
            decoration: BoxDecoration(
              color: AinColors.surfaceSubtle,
              borderRadius: BorderRadius.circular(AinRadii.md),
              border: Border.all(color: const Color(0x1AF59E0B)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        gradient: AinGradients.gold,
                        borderRadius: BorderRadius.circular(AinRadii.sm),
                      ),
                      child: const Icon(
                        Icons.card_membership,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: AinSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(
                                certificate == null
                                    ? (strings.isArabic
                                        ? 'لا توجد شهادات صادرة'
                                        : 'No issued certificates')
                                    : certificate.courseTitle,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13.5,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 1,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0x2210B981),
                                  borderRadius:
                                      BorderRadius.circular(AinRadii.pill),
                                ),
                                child: Text(
                                  certificate == null
                                      ? (strings.isArabic
                                          ? 'غير متاحة'
                                          : 'Unavailable')
                                      : (strings.isArabic
                                          ? 'موثقة'
                                          : 'Verified'),
                                  style: const TextStyle(
                                    color: Color(0xFF059669),
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            certificate == null
                                ? (strings.isArabic
                                    ? 'ستظهر شهاداتك هنا بعد إصدارها.'
                                    : 'Your certificates will appear here after issuance.')
                                : '${strings.isArabic ? 'كود الاعتماد' : 'Certificate'}: ${certificate.certificateNumber}',
                            style: const TextStyle(
                              color: AinColors.muted,
                              fontSize: 11.5,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AinSpacing.sm),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: certificate == null
                          ? null
                          : () => _showCertificateDialog(
                                context,
                                certificate,
                              ),
                      icon: const Icon(Icons.qr_code_2, size: 18),
                      label: Text(
                        strings.isArabic
                            ? 'عرض الشهادة وكود التحقق'
                            : 'View certificate details',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AinSpacing.sm),

          // Invoice Receipt Tile
          Container(
            padding: const EdgeInsets.all(AinSpacing.md),
            decoration: BoxDecoration(
              color: AinColors.surfaceSubtle,
              borderRadius: BorderRadius.circular(AinRadii.md),
              border: Border.all(color: const Color(0x0F16458F)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AinColors.brandSoft,
                        borderRadius: BorderRadius.circular(AinRadii.sm),
                      ),
                      child: const Icon(
                        Icons.receipt_long_outlined,
                        color: AinColors.brand,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: AinSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(
                                invoice == null
                                    ? (strings.isArabic
                                        ? 'لا توجد فواتير صادرة'
                                        : 'No issued invoices')
                                    : (strings.isArabic
                                        ? 'فاتورة إلكترونية'
                                        : 'Electronic Invoice'),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13.5,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 1,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0x2210B981),
                                  borderRadius:
                                      BorderRadius.circular(AinRadii.pill),
                                ),
                                child: Text(
                                  invoice == null
                                      ? (strings.isArabic
                                          ? 'غير متاحة'
                                          : 'Unavailable')
                                      : invoice.status.toUpperCase(),
                                  style: const TextStyle(
                                    color: Color(0xFF059669),
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            invoice == null
                                ? (strings.isArabic
                                    ? 'ستظهر فواتيرك هنا بعد إتمام عملية دفع.'
                                    : 'Your invoices will appear here after a completed payment.')
                                : '${invoice.invoiceNumber} · ${invoice.formattedTotal}',
                            style: const TextStyle(
                              color: AinColors.muted,
                              fontSize: 11.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AinSpacing.sm),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: invoice == null
                          ? null
                          : () => _showInvoiceDialog(context, invoice),
                      icon: const Icon(Icons.description_outlined, size: 18),
                      label: Text(
                        strings.isArabic
                            ? 'عرض تفاصيل الفاتورة'
                            : 'View Invoice Details',
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

  void _showCertificateDialog(
    BuildContext context,
    StudentCertificate certificate,
  ) {
    final strings = AppStrings.of(context);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(AinRadii.xl)),
        ),
        padding: const EdgeInsets.all(AinSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AinSpacing.lg),
            Container(
              padding: const EdgeInsets.all(AinSpacing.lg),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(AinRadii.lg),
                border: Border.all(color: const Color(0xFFF59E0B), width: 2),
              ),
              child: Column(
                children: [
                  const Icon(
                    Icons.workspace_premium,
                    color: Color(0xFFD97706),
                    size: 48,
                  ),
                  const SizedBox(height: AinSpacing.sm),
                  Text(
                    strings.isArabic
                        ? 'شهادة إتمام معتمدة'
                        : 'Official Certificate of Completion',
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                      color: Color(0xFF78350F),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    certificate.organizationName,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFB45309),
                    ),
                  ),
                  const Divider(color: Color(0x33F59E0B), height: 24),
                  Text(
                    strings.isArabic
                        ? 'تشهد المؤسسة بأن ${certificate.studentName} أتم متطلبات دورة ${certificate.courseTitle}.${certificate.gradeScore == null ? '' : '\nالنتيجة: ${certificate.gradeScore}%'}'
                        : 'This certifies that ${certificate.studentName} completed ${certificate.courseTitle}.${certificate.gradeScore == null ? '' : '\nScore: ${certificate.gradeScore}%'}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.6,
                      color: Color(0xFF451A03),
                    ),
                  ),
                  const SizedBox(height: AinSpacing.md),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AinRadii.md),
                      border: Border.all(color: const Color(0x33F59E0B)),
                    ),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.qr_code_scanner,
                          size: 64,
                          color: Color(0xFF1E293B),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          certificate.verificationCode.isEmpty
                              ? certificate.certificateNumber
                              : certificate.verificationCode,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: AinColors.brand,
                          ),
                        ),
                        Text(
                          strings.isArabic
                              ? 'استخدم هذا الكود في صفحة التحقق العامة'
                              : 'Use this code on the public verification page',
                          style: const TextStyle(
                            fontSize: 10,
                            color: AinColors.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AinSpacing.lg),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () => Navigator.pop(sheetContext),
                icon: const Icon(Icons.check),
                label: Text(strings.isArabic ? 'إغلاق' : 'Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showInvoiceDialog(BuildContext context, StudentInvoice invoice) {
    final strings = AppStrings.of(context);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(AinRadii.xl)),
        ),
        padding: const EdgeInsets.all(AinSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: AinSpacing.lg),
            Row(
              children: [
                const Icon(
                  Icons.receipt_long,
                  color: AinColors.brand,
                  size: 28,
                ),
                const SizedBox(width: AinSpacing.sm),
                Text(
                  strings.isArabic
                      ? 'تفاصيل الفاتورة الإلكترونية'
                      : 'Electronic Invoice Details',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            Container(
              padding: const EdgeInsets.all(AinSpacing.md),
              decoration: BoxDecoration(
                color: AinColors.surfaceSubtle,
                borderRadius: BorderRadius.circular(AinRadii.md),
              ),
              child: Column(
                children: [
                  _receiptRow(
                    strings.isArabic ? 'رقم الفاتورة:' : 'Invoice number:',
                    invoice.invoiceNumber,
                  ),
                  const SizedBox(height: 6),
                  _receiptRow(
                    strings.isArabic ? 'العميل:' : 'Customer:',
                    invoice.customerName,
                  ),
                  const SizedBox(height: 6),
                  _receiptRow(
                    strings.isArabic ? 'الجهة المصدرة:' : 'Issuer:',
                    invoice.organizationName,
                  ),
                  const SizedBox(height: 6),
                  _receiptRow(
                    strings.isArabic ? 'تاريخ الإصدار:' : 'Issued at:',
                    invoice.issuedAt,
                  ),
                  const SizedBox(height: 6),
                  _receiptRow(
                    strings.isArabic ? 'الحالة:' : 'Status:',
                    invoice.status,
                  ),
                  const Divider(height: 20),
                  _receiptRow(
                    strings.isArabic ? 'المبلغ الإجمالي:' : 'Total:',
                    invoice.formattedTotal,
                    isBold: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AinSpacing.lg),
            FilledButton.icon(
              onPressed: () => Navigator.pop(sheetContext),
              icon: const Icon(Icons.check),
              label: Text(strings.isArabic ? 'إغلاق' : 'Close'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _receiptRow(String label, String value, {bool isBold = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: AinColors.muted, fontSize: 12.5),
          ),
        ),
        const SizedBox(width: AinSpacing.sm),
        Flexible(
          child: Text(
            value.isEmpty ? '—' : value,
            textAlign: TextAlign.end,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.w900 : FontWeight.w600,
              fontSize: isBold ? 14 : 12.5,
              color: isBold ? AinColors.brand : AinColors.ink,
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// My Registered Device & Account Device Controls
// ─────────────────────────────────────────────────────────────────────────────

/// Shows the student's registered device(s) and their approval status.
/// Includes one-device policy details, a device identifier chip,
/// and interactive modal for requesting a device change.
class _MyDeviceSection extends ConsumerStatefulWidget {
  const _MyDeviceSection();

  @override
  ConsumerState<_MyDeviceSection> createState() => _MyDeviceSectionState();
}

class _MyDeviceSectionState extends ConsumerState<_MyDeviceSection> {
  bool _submitting = false;
  String? _successMessage;

  void _showResetDialog(BuildContext context) {
    final strings = AppStrings.of(context);
    String selectedReason =
        strings.isArabic ? 'شراء هاتف محمول جديد' : 'Purchased new phone';
    final notesController = TextEditingController();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (bottomSheetCtx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius:
                BorderRadius.vertical(top: Radius.circular(AinRadii.xl)),
          ),
          padding: EdgeInsets.only(
            left: AinSpacing.xl,
            right: AinSpacing.xl,
            top: AinSpacing.xl,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + AinSpacing.xl,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AinSpacing.md),
              Row(
                children: [
                  const AinIconBadge(
                    icon: Icons.sync_problem,
                    backgroundColor: Color(0x1AF59E0B),
                    foregroundColor: AinColors.warning,
                  ),
                  const SizedBox(width: AinSpacing.sm),
                  Text(
                    strings.isArabic
                        ? 'طلب استبدال الجهاز المقترن'
                        : 'Request Device Reset',
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AinSpacing.sm),
              Text(
                strings.isArabic
                    ? 'سيتم مراجعة طلبك وإلغاء اقتران الجهاز القديم لتمكينك من الدخول بجهازك الجديد.'
                    : 'Your request will be reviewed by academy administration to bind your new device.',
                style: const TextStyle(color: AinColors.muted, fontSize: 12),
              ),
              const SizedBox(height: AinSpacing.md),
              DropdownButtonFormField<String>(
                initialValue: selectedReason,
                decoration: InputDecoration(
                  labelText:
                      strings.isArabic ? 'سبب التغيير' : 'Reason for reset',
                  prefixIcon: const Icon(Icons.help_outline, size: 20),
                ),
                items: [
                  DropdownMenuItem(
                    value: strings.isArabic
                        ? 'شراء هاتف محمول جديد'
                        : 'Purchased new phone',
                    child: Text(
                      strings.isArabic
                          ? '📱 شراء هاتف محمول جديد'
                          : '📱 New phone purchase',
                    ),
                  ),
                  DropdownMenuItem(
                    value: strings.isArabic
                        ? 'استبدال أو عطل في الجهاز السابق'
                        : 'Hardware malfunction',
                    child: Text(
                      strings.isArabic
                          ? '💻 عطل أو صيانة بالجهاز السابق'
                          : '💻 Hardware issue',
                    ),
                  ),
                  DropdownMenuItem(
                    value: strings.isArabic
                        ? 'إعادة ضبط المصنع (Format)'
                        : 'Factory reset',
                    child: Text(
                      strings.isArabic
                          ? '🔄 إعادة ضبط المصنع (Format)'
                          : '🔄 Factory reset',
                    ),
                  ),
                ],
                onChanged: (val) {
                  if (val != null) setModalState(() => selectedReason = val);
                },
              ),
              const SizedBox(height: AinSpacing.md),
              TextFormField(
                controller: notesController,
                maxLines: 2,
                decoration: InputDecoration(
                  labelText: strings.isArabic
                      ? 'ملاحظات إضافية للمدير (اختياري)'
                      : 'Additional notes (optional)',
                  hintText: strings.isArabic
                      ? 'اكتب أي تفاصيل مساعدة...'
                      : 'Any extra details...',
                  prefixIcon: const Icon(Icons.edit_note, size: 20),
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: AinSpacing.lg),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: AinColors.brand,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _submitting
                    ? null
                    : () async {
                        Navigator.pop(bottomSheetCtx);
                        await _submitResetRequest(
                          selectedReason,
                          notesController.text,
                        );
                      },
                icon: const Icon(Icons.send),
                label: Text(
                  strings.isArabic
                      ? 'إرسال الطلب للإدارة'
                      : 'Submit Reset Request',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitResetRequest(String reason, String notes) async {
    setState(() {
      _submitting = true;
      _successMessage = null;
    });
    try {
      await ref.read(dioProvider).post<Object?>(
        '/student/device-reset-request',
        data: <String, Object?>{
          'reason': reason,
          'notes': notes.isNotEmpty
              ? notes
              : 'Student requested device reset from mobile profile page.',
        },
      );
      if (mounted) {
        setState(() {
          _successMessage = AppStrings.of(context).isArabic
              ? 'تم إرسال طلب تغيير الجهاز بنجاح. سيتم مراجعته من الإدارة.'
              : 'Device reset request sent successfully. Admin will review it.';
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppStrings.of(context).isArabic
                  ? 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.'
                  : 'An error occurred. Please try again.',
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final devicesAsync = ref.watch(studentDevicesProvider);

    return AinSurface(
      padding: const EdgeInsets.all(AinSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const AinIconBadge(
                icon: Icons.security,
                backgroundColor: Color(0x1AF59E0B),
                foregroundColor: AinColors.goldDark,
              ),
              const SizedBox(width: AinSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      strings.isArabic
                          ? 'الأجهزة وضوابط الوصول'
                          : 'Registered Devices & Access Controls',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      strings.isArabic
                          ? 'سياسة جهاز معتمد واحد لكل طالب'
                          : 'One approved device per student',
                      style: const TextStyle(
                        color: AinColors.muted,
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AinSpacing.md),

          // Device access policy explainer
          Container(
            padding: const EdgeInsets.all(AinSpacing.md),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
              ),
              borderRadius: BorderRadius.circular(AinRadii.md),
              border: Border.all(color: const Color(0x40F59E0B)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.lock_person_outlined,
                  color: Color(0xFFD97706),
                  size: 22,
                ),
                const SizedBox(width: AinSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        strings.isArabic
                            ? 'سياسة ربط الجهاز (1 Student = 1 Device)'
                            : 'Device Binding Policy (1 Student = 1 Device)',
                        style: const TextStyle(
                          color: Color(0xFF92400E),
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        strings.isArabic
                            ? 'يرتبط الحساب بجهاز معتمد للمساعدة في الحد من مشاركة بيانات الدخول. العلامة المائية تدعم تتبع التسريب ولا تمنع تسجيل الشاشة بشكل مطلق.'
                            : 'The account is linked to an approved device to reduce credential sharing. Watermarking supports traceability but cannot prevent screen recording absolutely.',
                        style: const TextStyle(
                          color: Color(0xFFB45309),
                          fontSize: 11,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AinSpacing.md),

          // Registered Device Card
          devicesAsync.when(
            data: (devices) {
              if (devices.isEmpty) {
                return Text(
                  strings.isArabic
                      ? 'لا يوجد جهاز مقترن بهذا الحساب حالياً.'
                      : 'No device is currently bound to this account.',
                  style: const TextStyle(
                    color: AinColors.muted,
                    fontSize: 13,
                  ),
                );
              }

              final activeDevice = devices.first;

              final deviceName = activeDevice['deviceName']?.toString() ??
                  activeDevice['device_name']?.toString() ??
                  (strings.isArabic ? 'جهاز مسجل' : 'Registered device');
              final fingerprint = activeDevice['id']?.toString() ??
                  (strings.isArabic ? 'غير متاح' : 'Unavailable');
              final ip = activeDevice['lastIp']?.toString() ??
                  activeDevice['last_ip']?.toString() ??
                  (strings.isArabic
                      ? 'عنوان الشبكة غير متاح'
                      : 'IP unavailable');
              final lastSeen = activeDevice['lastSeenAt']?.toString() ??
                  activeDevice['last_seen_at']?.toString() ??
                  (strings.isArabic
                      ? 'وقت النشاط غير متاح'
                      : 'Last activity unavailable');
              final status = activeDevice['status']?.toString() ?? 'unknown';

              return Container(
                padding: const EdgeInsets.all(AinSpacing.md),
                decoration: BoxDecoration(
                  color: AinColors.surfaceSubtle,
                  borderRadius: BorderRadius.circular(AinRadii.md),
                  border: Border.all(color: const Color(0x2016458F)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AinColors.brandSoft,
                            borderRadius: BorderRadius.circular(AinRadii.sm),
                          ),
                          child: const Icon(
                            Icons.phone_android,
                            size: 22,
                            color: AinColors.brand,
                          ),
                        ),
                        const SizedBox(width: AinSpacing.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                deviceName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '$ip • $lastSeen',
                                style: const TextStyle(
                                  color: AinColors.muted,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0x1F10B981),
                            borderRadius: BorderRadius.circular(AinRadii.pill),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.check_circle,
                                size: 12,
                                color: Color(0xFF059669),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                status == 'active'
                                    ? (strings.isArabic
                                        ? 'معتمد ونشط'
                                        : 'Active')
                                    : status,
                                style: const TextStyle(
                                  color: Color(0xFF059669),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    // Device identifier and access-control badges
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        InkWell(
                          onTap: () {
                            Clipboard.setData(ClipboardData(text: fingerprint));
                            HapticFeedback.lightImpact();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  strings.isArabic
                                      ? 'تم نسخ معرّف الجهاز: $fingerprint'
                                      : 'Device identifier copied: $fingerprint',
                                ),
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          },
                          borderRadius: BorderRadius.circular(AinRadii.sm),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(AinRadii.sm),
                              border: Border.all(color: AinColors.line),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.fingerprint,
                                  size: 13,
                                  color: AinColors.brand,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '#$fingerprint',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontFamily: 'monospace',
                                    fontWeight: FontWeight.bold,
                                    color: AinColors.brand,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.copy,
                                  size: 11,
                                  color: AinColors.muted,
                                ),
                              ],
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0x1410B981),
                            borderRadius: BorderRadius.circular(AinRadii.sm),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.shield,
                                size: 12,
                                color: Color(0xFF059669),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                strings.isArabic
                                    ? 'علامة مائية قابلة للتتبع'
                                    : 'Traceable watermark',
                                style: const TextStyle(
                                  color: Color(0xFF059669),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
            error: (_, __) => Text(
              strings.isArabic
                  ? 'تعذّر تحميل بيانات الجهاز.'
                  : 'Could not load device data.',
              style: const TextStyle(color: AinColors.muted, fontSize: 13),
            ),
            loading: () => const LinearProgressIndicator(),
          ),

          if (_successMessage != null) ...[
            const SizedBox(height: AinSpacing.sm),
            Container(
              padding: const EdgeInsets.all(AinSpacing.sm),
              decoration: BoxDecoration(
                color: AinColors.successSoft,
                borderRadius: BorderRadius.circular(AinRadii.md),
              ),
              child: Text(
                _successMessage!,
                style: const TextStyle(
                  color: AinColors.success,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
          const SizedBox(height: AinSpacing.md),
          OutlinedButton.icon(
            onPressed: _submitting ? null : () => _showResetDialog(context),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AinColors.amber),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AinRadii.pill),
              ),
            ),
            icon: _submitting
                ? const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.sync, color: AinColors.amber, size: 18),
            label: Text(
              strings.isArabic
                  ? 'طلب استبدال الجهاز المقترن'
                  : 'Request Device Replacement',
              style: const TextStyle(
                color: AinColors.amber,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
// ─── Provider for student devices list ───────────────────────────────────────

final studentDevicesProvider =
    FutureProvider<List<Map<String, Object?>>>((ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get<Object?>('/student/devices');
  final data = (response.data as Map<String, Object?>?)?['data'];
  if (data is List) {
    return data.map((e) => Map<String, Object?>.from(e as Map)).toList();
  }
  return [];
});

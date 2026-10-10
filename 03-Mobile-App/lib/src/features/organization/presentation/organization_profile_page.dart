import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/data/workspace_repository.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationProfilePage extends ConsumerWidget {
  const OrganizationProfilePage({super.key});

  static const routePath = '/organization/profile';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationProfile)),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            return _ProfileForm(workspace: workspace);
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

class _ProfileForm extends ConsumerStatefulWidget {
  const _ProfileForm({required this.workspace});

  final ActiveWorkspace workspace;

  @override
  ConsumerState<_ProfileForm> createState() => _ProfileFormState();
}

class _ProfileFormState extends ConsumerState<_ProfileForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _bioController;
  late final TextEditingController _brandColorController;
  late final TextEditingController _timezoneController;
  late String _locale;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final organization = _readObject(widget.workspace.context, 'organization');
    _nameController = TextEditingController(
      text: organization['name']?.toString() ?? widget.workspace.name,
    );
    _bioController = TextEditingController(
      text: organization['bio']?.toString() ?? '',
    );
    _brandColorController = TextEditingController(
      text: (organization['brandColor'] ?? organization['brand_color'])
              ?.toString() ??
          '',
    );
    _timezoneController = TextEditingController(
      text: organization['timezone']?.toString() ?? 'Africa/Cairo',
    );
    _locale = organization['locale']?.toString() == 'en' ? 'en' : 'ar';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    _brandColorController.dispose();
    _timezoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(AinSpacing.lg),
        children: [
          _ProfileHero(
            title: _nameController.text.isEmpty
                ? strings.organizationProfile
                : _nameController.text,
            subtitle: strings.organizationProfileHint,
            locale: _locale,
            timezone: _timezoneController.text,
          ),
          const SizedBox(height: AinSpacing.lg),
          AinSectionHeader(title: strings.organizationProfile),
          const SizedBox(height: AinSpacing.md),
          AinTextField(
            controller: _nameController,
            label: strings.organizationName,
            icon: Icons.business_outlined,
            validator: (value) {
              final length = value?.trim().length ?? 0;
              return length >= 2 ? null : strings.organizationNameRequired;
            },
          ),
          const SizedBox(height: AinSpacing.md),
          AinTextField(
            controller: _bioController,
            label: strings.organizationBio,
            icon: Icons.notes_outlined,
            maxLines: 4,
          ),
          const SizedBox(height: AinSpacing.md),
          AinTextField(
            controller: _brandColorController,
            label: strings.brandColor,
            icon: Icons.palette_outlined,
            validator: (value) {
              final text = value?.trim() ?? '';
              if (text.isEmpty) {
                return null;
              }
              return RegExp(r'^#[0-9A-Fa-f]{6}$').hasMatch(text)
                  ? null
                  : strings.validBrandColorRequired;
            },
          ),
          const SizedBox(height: AinSpacing.md),
          DropdownButtonFormField<String>(
            initialValue: _locale,
            decoration: InputDecoration(
              labelText: strings.organizationLocale,
              border: const OutlineInputBorder(),
            ),
            items: [
              DropdownMenuItem(value: 'ar', child: Text(strings.arabic)),
              DropdownMenuItem(value: 'en', child: Text(strings.english)),
            ],
            onChanged: (value) {
              if (value != null) {
                setState(() => _locale = value);
              }
            },
          ),
          const SizedBox(height: AinSpacing.md),
          AinTextField(
            controller: _timezoneController,
            label: strings.timezone,
            icon: Icons.schedule_outlined,
            validator: (value) {
              return (value?.trim().isNotEmpty ?? false)
                  ? null
                  : strings.timezoneRequired;
            },
          ),
          const SizedBox(height: AinSpacing.lg),
          AinPrimaryButton(
            onPressed: _submitting ? null : _submit,
            icon: Icons.save,
            label: strings.saveChanges,
            loading: _submitting,
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref
          .read(activeWorkspaceControllerProvider.notifier)
          .updateOrganization(
            command: UpdateOrganizationCommand(
              name: _nameController.text,
              bio: _bioController.text,
              brandColor: _brandColorController.text,
              locale: _locale,
              timezone: _timezoneController.text,
            ),
          );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({
    required this.title,
    required this.subtitle,
    required this.locale,
    required this.timezone,
  });

  final String title;
  final String subtitle;
  final String locale;
  final String timezone;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final strings = AppStrings.of(context);

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
              icon: Icons.business_center_outlined,
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
                  icon: Icons.translate_outlined,
                  label: locale == 'ar' ? strings.arabic : strings.english,
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.schedule_outlined,
                  label: timezone,
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

Map<String, Object?> _readObject(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    return Map<String, Object?>.from(value);
  }

  return const <String, Object?>{};
}

import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/data/workspace_repository.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
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
          error: (error, stackTrace) => Center(child: Text(error.toString())),
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
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.business, size: 56),
        const SizedBox(height: 12),
        Text(
          strings.chooseWorkspace,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: () => context.go(WorkspaceSelectionPage.routePath),
          child: Text(strings.chooseWorkspace),
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
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            strings.organizationProfile,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(strings.organizationProfileHint),
          const SizedBox(height: 16),
          TextFormField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: strings.organizationName,
              border: const OutlineInputBorder(),
            ),
            validator: (value) {
              final length = value?.trim().length ?? 0;
              return length >= 2 ? null : strings.organizationNameRequired;
            },
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _bioController,
            decoration: InputDecoration(
              labelText: strings.organizationBio,
              border: const OutlineInputBorder(),
            ),
            maxLines: 4,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _brandColorController,
            decoration: InputDecoration(
              labelText: strings.brandColor,
              border: const OutlineInputBorder(),
            ),
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
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _locale,
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
          const SizedBox(height: 12),
          TextFormField(
            controller: _timezoneController,
            decoration: InputDecoration(
              labelText: strings.timezone,
              border: const OutlineInputBorder(),
            ),
            validator: (value) {
              return (value?.trim().isNotEmpty ?? false)
                  ? null
                  : strings.timezoneRequired;
            },
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _submitting ? null : _submit,
            icon: _submitting
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.save),
            label: Text(strings.saveChanges),
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

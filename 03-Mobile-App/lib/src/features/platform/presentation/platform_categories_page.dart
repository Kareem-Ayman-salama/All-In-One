import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/platform/application/platform_category_controller.dart';
import 'package:ain_mobile/src/features/platform/data/platform_category_repository.dart';
import 'package:ain_mobile/src/features/profile/application/profile_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PlatformCategoriesPage extends ConsumerWidget {
  const PlatformCategoriesPage({super.key});

  static const routePath = '/platform/categories';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final profile = ref.watch(currentUserProfileProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.platformCategories)),
      body: SafeArea(
        child: profile.when(
          data: (profile) {
            if (!_hasPlatformRole(profile.user.platformRole)) {
              return _AccessRequired(strings: strings);
            }

            final categories = ref.watch(platformCategoriesProvider);

            return RefreshIndicator(
              onRefresh: () => ref.refresh(platformCategoriesProvider.future),
              child: categories.when(
                data: (items) => _CategoryList(categories: items),
                error: (error, stackTrace) => _ErrorList(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(platformCategoriesProvider),
                ),
                loading: () => Center(
                  child: Semantics(
                    label: strings.loading,
                    child: const CircularProgressIndicator(),
                  ),
                ),
              ),
            );
          },
          error: (error, stackTrace) => _ErrorList(
            message: error.toString(),
            onRetry: () => ref.invalidate(currentUserProfileProvider),
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

class _CategoryList extends StatelessWidget {
  const _CategoryList({required this.categories});

  final List<PlatformCategorySummary> categories;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final activeCount = categories.where((item) => item.active).length;
    final courseCount = categories.fold<int>(
      0,
      (total, item) => total + item.coursesCount,
    );

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.platformCategories,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 4),
        Text(strings.platformCategoriesHint),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                label: strings.activeCategories,
                value: activeCount.toString(),
                icon: Icons.check_circle,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatTile(
                label: strings.categoryCourses,
                value: courseCount.toString(),
                icon: Icons.menu_book,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: () => _showCategorySheet(context, categories),
          icon: const Icon(Icons.add),
          label: Text(strings.createCategory),
        ),
        const SizedBox(height: 12),
        for (final category in categories)
          _CategoryCard(category: category, categories: categories),
        if (categories.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(strings.noCategories),
            ),
          ),
      ],
    );
  }

  Future<void> _showCategorySheet(
    BuildContext context,
    List<PlatformCategorySummary> categories,
  ) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _CategorySheet(categories: categories),
    );
  }
}

class _CategoryCard extends ConsumerWidget {
  const _CategoryCard({
    required this.category,
    required this.categories,
  });

  final PlatformCategorySummary category;
  final List<PlatformCategorySummary> categories;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final parent = categories.where((item) => item.id == category.parentId);
    final parentName = parent.isEmpty ? null : parent.first.name;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  category.active ? Icons.category : Icons.category_outlined,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        category.name,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(category.nameAr),
                    ],
                  ),
                ),
                Chip(
                  label: Text(
                    category.active ? strings.active : strings.inactive,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(label: Text(category.slug)),
                Chip(
                  label: Text(
                    '${strings.categoryCourses}: ${category.coursesCount}',
                  ),
                ),
                Chip(
                  label: Text('${strings.sortOrder}: ${category.sortOrder}'),
                ),
                if (_hasText(parentName))
                  Chip(label: Text('${strings.parentCategory}: $parentName')),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showEditSheet(context),
                    icon: const Icon(Icons.edit),
                    label: Text(strings.editCategory),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: !category.canDelete
                        ? null
                        : () => _confirmDelete(context, ref),
                    icon: const Icon(Icons.delete_outline),
                    label: Text(strings.deleteCategory),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showEditSheet(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _CategorySheet(
        categories: categories,
        category: category,
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final strings = AppStrings.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(strings.deleteCategory),
        content: Text(strings.deleteCategoryPrompt),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(strings.back),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(strings.deleteCategory),
          ),
        ],
      ),
    );
    if (confirmed != true) {
      return;
    }

    await ref.read(platformCategoryActionsProvider).delete(category.id);
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(strings.categoryDeleted)),
    );
  }
}

class _CategorySheet extends ConsumerStatefulWidget {
  const _CategorySheet({
    required this.categories,
    this.category,
  });

  final List<PlatformCategorySummary> categories;
  final PlatformCategorySummary? category;

  @override
  ConsumerState<_CategorySheet> createState() => _CategorySheetState();
}

class _CategorySheetState extends ConsumerState<_CategorySheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _nameArController;
  late final TextEditingController _slugController;
  late final TextEditingController _sortOrderController;
  String? _parentId;
  late bool _active;
  bool _saving = false;

  bool get _isEditing => widget.category != null;

  @override
  void initState() {
    super.initState();
    final category = widget.category;
    _nameController = TextEditingController(text: category?.name ?? '');
    _nameArController = TextEditingController(text: category?.nameAr ?? '');
    _slugController = TextEditingController(text: category?.slug ?? '');
    _sortOrderController = TextEditingController(
      text: (category?.sortOrder ?? 0).toString(),
    );
    _parentId = category?.parentId;
    _active = category?.active ?? true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _nameArController.dispose();
    _slugController.dispose();
    _sortOrderController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final parentOptions = widget.categories
        .where((item) => item.id != widget.category?.id)
        .toList(growable: false);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16,
        right: 16,
        top: 16,
      ),
      child: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            shrinkWrap: true,
            children: [
              Text(
                _isEditing ? strings.editCategory : strings.createCategory,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: strings.categoryName,
                  border: const OutlineInputBorder(),
                ),
                validator: (value) =>
                    _hasText(value) ? null : strings.requiredField,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameArController,
                decoration: InputDecoration(
                  labelText: strings.categoryNameAr,
                  border: const OutlineInputBorder(),
                ),
                validator: (value) =>
                    _hasText(value) ? null : strings.requiredField,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _slugController,
                decoration: InputDecoration(
                  labelText: strings.slugOptional,
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                initialValue: _parentId,
                decoration: InputDecoration(
                  labelText: strings.parentCategory,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  DropdownMenuItem<String?>(
                    value: null,
                    child: Text(strings.noParentCategory),
                  ),
                  for (final category in parentOptions)
                    DropdownMenuItem<String?>(
                      value: category.id,
                      child: Text(category.name),
                    ),
                ],
                onChanged: (value) {
                  setState(() {
                    _parentId = value;
                  });
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _sortOrderController,
                decoration: InputDecoration(
                  labelText: strings.sortOrder,
                  border: const OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                value: _active,
                onChanged: (value) {
                  setState(() {
                    _active = value;
                  });
                },
                title: Text(strings.active),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: _saving ? null : _save,
                icon: _saving
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save),
                label: Text(strings.saveChanges),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() {
      _saving = true;
    });

    final strings = AppStrings.of(context);
    final command = PlatformCategoryCommand(
      categoryId: widget.category?.id,
      parentId: _parentId,
      name: _nameController.text,
      nameAr: _nameArController.text,
      slug: _slugController.text,
      active: _active,
      sortOrder: int.tryParse(_sortOrderController.text) ?? 0,
    );

    try {
      if (_isEditing) {
        await ref.read(platformCategoryActionsProvider).update(command);
      } else {
        await ref.read(platformCategoryActionsProvider).create(command);
      }
      if (!mounted) {
        return;
      }
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(strings.categorySaved)),
      );
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon),
            const SizedBox(height: 8),
            Text(label),
            const SizedBox(height: 4),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _AccessRequired extends StatelessWidget {
  const _AccessRequired({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.admin_panel_settings, size: 56),
        const SizedBox(height: 16),
        Text(
          strings.platformAccessRequired,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
        ),
      ],
    );
  }
}

class _ErrorList extends StatelessWidget {
  const _ErrorList({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(24),
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
    );
  }
}

bool _hasPlatformRole(String? role) {
  return const <String>{
    'super_admin',
    'platform_support',
    'platform_moderator',
  }.contains(role);
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

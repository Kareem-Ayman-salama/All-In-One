import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/platform/application/platform_academy_moderation_controller.dart';
import 'package:ain_mobile/src/features/platform/data/platform_academy_moderation_repository.dart';
import 'package:ain_mobile/src/features/profile/application/profile_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PlatformAcademyApprovalsPage extends ConsumerStatefulWidget {
  const PlatformAcademyApprovalsPage({super.key});

  static const routePath = '/platform/academy-approvals';

  @override
  ConsumerState<PlatformAcademyApprovalsPage> createState() {
    return _PlatformAcademyApprovalsPageState();
  }
}

class _PlatformAcademyApprovalsPageState
    extends ConsumerState<PlatformAcademyApprovalsPage> {
  String _status = 'pending';

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final profile = ref.watch(currentUserProfileProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.academyApprovals)),
      body: SafeArea(
        child: profile.when(
          data: (profile) {
            if (!_hasPlatformRole(profile.user.platformRole)) {
              return _AccessRequired(strings: strings);
            }

            final academies = ref.watch(
              platformAcademyModerationProvider(_status),
            );

            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  platformAcademyModerationProvider(_status).future,
                );
              },
              child: academies.when(
                data: (items) => _AcademyApprovalList(
                  academies: items,
                  status: _status,
                  onStatusChanged: (value) {
                    setState(() {
                      _status = value;
                    });
                  },
                ),
                error: (error, stackTrace) => _ErrorList(
                  message: error.toString(),
                  onRetry: () {
                    ref.invalidate(platformAcademyModerationProvider(_status));
                  },
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

class _AcademyApprovalList extends StatelessWidget {
  const _AcademyApprovalList({
    required this.academies,
    required this.status,
    required this.onStatusChanged,
  });

  final List<PlatformAcademyModerationSummary> academies;
  final String status;
  final ValueChanged<String> onStatusChanged;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.academyApprovals,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 4),
        Text(strings.academyApprovalsHint),
        const SizedBox(height: 12),
        SegmentedButton<String>(
          segments: [
            ButtonSegment<String>(
              value: 'pending',
              label: Text(strings.pendingReview),
              icon: const Icon(Icons.rate_review),
            ),
            ButtonSegment<String>(
              value: 'verified',
              label: Text(strings.verified),
              icon: const Icon(Icons.verified),
            ),
            ButtonSegment<String>(
              value: 'rejected',
              label: Text(strings.rejected),
              icon: const Icon(Icons.block),
            ),
          ],
          selected: {status},
          onSelectionChanged: (values) => onStatusChanged(values.first),
        ),
        const SizedBox(height: 12),
        for (final academy in academies) _AcademyApprovalCard(academy: academy),
        if (academies.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(strings.noAcademyApprovals),
            ),
          ),
      ],
    );
  }
}

class _AcademyApprovalCard extends ConsumerWidget {
  const _AcademyApprovalCard({required this.academy});

  final PlatformAcademyModerationSummary academy;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final canModerate = academy.verificationStatus == 'pending';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.school),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        academy.publicName,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(academy.organizationName),
                    ],
                  ),
                ),
                Chip(label: Text(academy.verificationStatus)),
              ],
            ),
            const SizedBox(height: 8),
            Text(academy.description),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(label: Text(academy.slug)),
                if (_hasText(academy.location))
                  Chip(label: Text(academy.location!)),
                if (_hasText(academy.email)) Chip(label: Text(academy.email!)),
                if (_hasText(academy.phone)) Chip(label: Text(academy.phone!)),
                if (academy.isPublic) Chip(label: Text(strings.publicProfile)),
              ],
            ),
            if (canModerate) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => _verify(context, ref),
                      icon: const Icon(Icons.verified),
                      label: Text(strings.verifyAcademy),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _reject(context, ref),
                      icon: const Icon(Icons.close),
                      label: Text(strings.rejectWithNote),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _verify(BuildContext context, WidgetRef ref) async {
    final strings = AppStrings.of(context);
    await ref.read(platformAcademyModerationActionsProvider).verify(
          PlatformAcademyModerationCommand(academyId: academy.id),
        );
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(strings.academyVerified)),
    );
  }

  Future<void> _reject(BuildContext context, WidgetRef ref) async {
    final note = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _RejectionSheet(academy: academy),
    );
    if (!context.mounted) {
      return;
    }
    if (!_hasText(note)) {
      return;
    }

    final strings = AppStrings.of(context);
    await ref.read(platformAcademyModerationActionsProvider).reject(
          PlatformAcademyModerationCommand(academyId: academy.id, note: note),
        );
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(strings.academyRejected)),
    );
  }
}

class _RejectionSheet extends StatefulWidget {
  const _RejectionSheet({required this.academy});

  final PlatformAcademyModerationSummary academy;

  @override
  State<_RejectionSheet> createState() => _RejectionSheetState();
}

class _RejectionSheetState extends State<_RejectionSheet> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16,
        right: 16,
        top: 16,
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              strings.rejectWithNote,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(widget.academy.publicName),
            const SizedBox(height: 12),
            TextField(
              controller: _controller,
              minLines: 3,
              maxLines: 5,
              decoration: InputDecoration(
                labelText: strings.moderationNote,
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () {
                final note = _controller.text.trim();
                if (note.isEmpty) {
                  return;
                }
                Navigator.of(context).pop(note);
              },
              icon: const Icon(Icons.close),
              label: Text(strings.rejectWithNote),
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

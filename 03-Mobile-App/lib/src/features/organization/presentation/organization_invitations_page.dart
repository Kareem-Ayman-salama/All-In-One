import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_invitation_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_invitation_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationInvitationsPage extends ConsumerWidget {
  const OrganizationInvitationsPage({super.key});

  static const routePath = '/organization/invitations';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);
    final workspace = workspaceState.valueOrNull;
    final canInvite = workspace?.canUseFeature(
          requiredPermissions: {'members.invite'},
          requiredModule: 'members',
        ) ??
        false;

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationInvitations)),
      floatingActionButton: !canInvite
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspace!.organizationId,
              ),
              icon: const Icon(Icons.person_add),
              label: Text(strings.inviteMember),
            ),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final invitations = ref.watch(
              organizationInvitationsProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationInvitationsProvider(
                    workspace.organizationId,
                  ).future,
                );
              },
              child: invitations.when(
                data: (items) => _InvitationsBody(
                  organizationId: workspace.organizationId,
                  canInvite: canInvite,
                  invitations: items,
                ),
                error: (error, stackTrace) => ListView(
                  padding: const EdgeInsets.all(AinSpacing.lg),
                  children: [
                    AinEmptyState(
                      icon: Icons.cloud_off_outlined,
                      title: error.toString(),
                      action: AinPrimaryButton(
                        onPressed: () {
                          ref.invalidate(
                            organizationInvitationsProvider(
                              workspace.organizationId,
                            ),
                          );
                        },
                        icon: Icons.refresh,
                        label: strings.retry,
                      ),
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
            );
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

  Future<void> _showCreateSheet(BuildContext context, String organizationId) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) =>
          _CreateInvitationSheet(organizationId: organizationId),
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

class _InvitationsBody extends StatelessWidget {
  const _InvitationsBody({
    required this.organizationId,
    required this.canInvite,
    required this.invitations,
  });

  final String organizationId;
  final bool canInvite;
  final List<OrganizationInvitationSummary> invitations;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final pendingCount =
        invitations.where((invitation) => invitation.isPending).length;

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _InvitationsHero(
          title: strings.organizationInvitations,
          subtitle: strings.organizationInvitationsHint,
          pendingCount: pendingCount,
          totalCount: invitations.length,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.mark_email_unread,
                label: strings.pendingInvitations,
                value: pendingCount.toString(),
                color: AinColors.warning,
                backgroundColor: AinColors.warningSoft,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.group_add,
                label: strings.invitations,
                value: invitations.length.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.organizationInvitations),
        const SizedBox(height: AinSpacing.md),
        if (invitations.isEmpty)
          AinEmptyState(
            icon: Icons.mark_email_unread_outlined,
            title: strings.noInvitationsYet,
          )
        else
          for (final invitation in invitations)
            _InvitationCard(
              organizationId: organizationId,
              canInvite: canInvite,
              invitation: invitation,
            ),
      ],
    );
  }
}

class _InvitationsHero extends StatelessWidget {
  const _InvitationsHero({
    required this.title,
    required this.subtitle,
    required this.pendingCount,
    required this.totalCount,
  });

  final String title;
  final String subtitle;
  final int pendingCount;
  final int totalCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

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
              icon: Icons.mark_email_unread_outlined,
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
                  icon: Icons.pending_actions,
                  label: pendingCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.group_add_outlined,
                  label: totalCount.toString(),
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

class _InvitationCard extends ConsumerWidget {
  const _InvitationCard({
    required this.organizationId,
    required this.canInvite,
    required this.invitation,
  });

  final String organizationId;
  final bool canInvite;
  final OrganizationInvitationSummary invitation;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AinIconBadge(
                  icon: Icons.mail_outline,
                  backgroundColor: invitation.isPending
                      ? AinColors.warningSoft
                      : AinColors.successSoft,
                  foregroundColor: invitation.isPending
                      ? AinColors.warning
                      : AinColors.success,
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        invitation.email,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      if (invitation.phone != null) ...[
                        const SizedBox(height: AinSpacing.xs),
                        Text(
                          invitation.phone!,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: AinColors.muted),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: Icons.flag_outlined,
                  label: strings.invitationStatus(invitation.status),
                  color: invitation.isPending
                      ? AinColors.warning
                      : AinColors.success,
                  backgroundColor: invitation.isPending
                      ? AinColors.warningSoft
                      : AinColors.successSoft,
                ),
                if (invitation.expiresAt != null)
                  AinStatusPill(
                    icon: Icons.schedule_outlined,
                    label: strings.expiresAt(invitation.expiresAt!),
                  ),
              ],
            ),
            if (invitation.note != null) ...[
              const SizedBox(height: AinSpacing.md),
              Text(
                invitation.note!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AinColors.muted,
                      height: 1.35,
                    ),
              ),
            ],
            if (invitation.isPending && canInvite) ...[
              const SizedBox(height: AinSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: AinSecondaryButton(
                      onPressed: () => _resend(ref),
                      icon: Icons.refresh,
                      label: strings.resendInvitation,
                    ),
                  ),
                  const SizedBox(width: AinSpacing.sm),
                  IconButton.filledTonal(
                    tooltip: strings.cancelInvitation,
                    onPressed: () => _cancel(ref),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _resend(WidgetRef ref) {
    return ref
        .read(organizationInvitationActionsProvider)
        .resend(organizationId: organizationId, invitationId: invitation.id);
  }

  Future<void> _cancel(WidgetRef ref) {
    return ref
        .read(organizationInvitationActionsProvider)
        .cancel(organizationId: organizationId, invitationId: invitation.id);
  }
}

class _CreateInvitationSheet extends ConsumerStatefulWidget {
  const _CreateInvitationSheet({required this.organizationId});

  final String organizationId;

  @override
  ConsumerState<_CreateInvitationSheet> createState() =>
      _CreateInvitationSheetState();
}

class _CreateInvitationSheetState
    extends ConsumerState<_CreateInvitationSheet> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _noteController = TextEditingController();
  String _role = 'member';
  bool _submitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, bottomInset + 24),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              strings.inviteMember,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: strings.email,
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                final email = value?.trim() ?? '';
                return email.contains('@') ? null : strings.invalidEmail;
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _role,
              decoration: InputDecoration(
                labelText: strings.role,
                border: const OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'member', child: Text('Member')),
                DropdownMenuItem(value: 'staff', child: Text('Staff')),
                DropdownMenuItem(
                  value: 'instructor',
                  child: Text('Instructor'),
                ),
                DropdownMenuItem(value: 'student', child: Text('Student')),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() => _role = value);
                }
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _noteController,
              decoration: InputDecoration(
                labelText: strings.optionalNote,
                border: const OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _submitting ? null : _submit,
              icon: _submitting
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send),
              label: Text(strings.sendInvitation),
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
    try {
      await ref.read(organizationInvitationActionsProvider).create(
            organizationId: widget.organizationId,
            command: CreateOrganizationInvitationCommand(
              email: _emailController.text,
              role: _role,
              note: _noteController.text,
            ),
          );
      if (mounted) {
        Navigator.of(context).pop();
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}

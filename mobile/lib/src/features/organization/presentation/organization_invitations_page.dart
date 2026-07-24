import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_invitation_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_invitation_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
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

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationInvitations)),
      floatingActionButton: workspaceState.valueOrNull == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspaceState.valueOrNull!.organizationId,
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
                  invitations: items,
                ),
                error: (error, stackTrace) => ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    const Icon(Icons.cloud_off, size: 48),
                    const SizedBox(height: 12),
                    Text(error.toString(), textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: () {
                        ref.invalidate(
                          organizationInvitationsProvider(
                            workspace.organizationId,
                          ),
                        );
                      },
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
            );
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

class _InvitationsBody extends StatelessWidget {
  const _InvitationsBody({
    required this.organizationId,
    required this.invitations,
  });

  final String organizationId;
  final List<OrganizationInvitationSummary> invitations;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final pendingCount =
        invitations.where((invitation) => invitation.isPending).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.organizationInvitations,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(strings.organizationInvitationsHint),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                icon: Icons.mark_email_unread,
                label: strings.pendingInvitations,
                value: pendingCount.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatTile(
                icon: Icons.group_add,
                label: strings.invitations,
                value: invitations.length.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (invitations.isEmpty)
          Text(strings.noInvitationsYet)
        else
          for (final invitation in invitations)
            _InvitationCard(
              organizationId: organizationId,
              invitation: invitation,
            ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.titleLarge),
            Text(label),
          ],
        ),
      ),
    );
  }
}

class _InvitationCard extends ConsumerWidget {
  const _InvitationCard({
    required this.organizationId,
    required this.invitation,
  });

  final String organizationId;
  final OrganizationInvitationSummary invitation;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              invitation.email,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            if (invitation.phone != null) Text(invitation.phone!),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(label: Text(strings.invitationStatus(invitation.status))),
                if (invitation.expiresAt != null)
                  Chip(label: Text(strings.expiresAt(invitation.expiresAt!))),
              ],
            ),
            if (invitation.note != null) ...[
              const SizedBox(height: 8),
              Text(invitation.note!),
            ],
            if (invitation.isPending) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _resend(ref),
                      icon: const Icon(Icons.refresh),
                      label: Text(strings.resendInvitation),
                    ),
                  ),
                  const SizedBox(width: 8),
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
              value: _role,
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

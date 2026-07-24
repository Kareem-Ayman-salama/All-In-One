import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_member_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_member_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationMembersPage extends ConsumerWidget {
  const OrganizationMembersPage({super.key});

  static const routePath = '/organization/members';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationMembers)),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final members = ref.watch(
              organizationMembersProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationMembersProvider(workspace.organizationId).future,
                );
              },
              child: members.when(
                data: (items) => _MembersBody(
                  members: items,
                  organizationId: workspace.organizationId,
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
                          organizationMembersProvider(workspace.organizationId),
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

class _MembersBody extends StatelessWidget {
  const _MembersBody({required this.members, required this.organizationId});

  final List<OrganizationMemberSummary> members;
  final String organizationId;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final activeCount = members.where((member) => member.isActive).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.organizationMembers,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(strings.organizationMembersHint),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                icon: Icons.groups,
                label: strings.members,
                value: members.length.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatTile(
                icon: Icons.verified_user,
                label: strings.activeMembers,
                value: activeCount.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (members.isEmpty)
          Text(strings.noMembersYet)
        else
          for (final member in members)
            _MemberCard(member: member, organizationId: organizationId),
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

class _MemberCard extends ConsumerWidget {
  const _MemberCard({required this.member, required this.organizationId});

  final OrganizationMemberSummary member;
  final String organizationId;

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
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                child: Text(_initials(member.name, member.email)),
              ),
              title: Text(member.name.isEmpty ? member.email : member.name),
              subtitle: Text(member.email),
              trailing: IconButton(
                tooltip: strings.removeMember,
                onPressed: () async {
                  await ref.read(organizationMemberActionsProvider).remove(
                        organizationId: organizationId,
                        membershipId: member.id,
                      );
                },
                icon: const Icon(Icons.person_remove_alt_1),
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _roleValues.contains(member.role) ? member.role : 'member',
              decoration: InputDecoration(
                labelText: strings.role,
                border: const OutlineInputBorder(),
              ),
              items: [
                for (final role in _roleValues)
                  DropdownMenuItem(
                    value: role,
                    child: Text(strings.organizationRoleLabel(role)),
                  ),
              ],
              onChanged: (value) async {
                if (value == null || value == member.role) {
                  return;
                }
                await ref.read(organizationMemberActionsProvider).update(
                      organizationId: organizationId,
                      membershipId: member.id,
                      command: UpdateOrganizationMemberCommand(role: value),
                    );
              },
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: member.status == 'suspended' ? 'suspended' : 'active',
              decoration: InputDecoration(
                labelText: strings.memberStatus,
                border: const OutlineInputBorder(),
              ),
              items: [
                DropdownMenuItem(
                  value: 'active',
                  child: Text(strings.memberStatusLabel('active')),
                ),
                DropdownMenuItem(
                  value: 'suspended',
                  child: Text(strings.memberStatusLabel('suspended')),
                ),
              ],
              onChanged: (value) async {
                if (value == null || value == member.status) {
                  return;
                }
                await ref.read(organizationMemberActionsProvider).update(
                      organizationId: organizationId,
                      membershipId: member.id,
                      command: UpdateOrganizationMemberCommand(status: value),
                    );
              },
            ),
          ],
        ),
      ),
    );
  }
}

const _roleValues = <String>[
  'organization_owner',
  'organization_admin',
  'instructor',
  'member',
  'student',
  'guardian',
];

String _initials(String name, String email) {
  final source = name.trim().isEmpty ? email : name;
  final parts = source.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty || parts.first.isEmpty) {
    return '?';
  }
  if (parts.length == 1) {
    return parts.first.substring(0, 1).toUpperCase();
  }

  return '${parts.first.substring(0, 1)}${parts.last.substring(0, 1)}'
      .toUpperCase();
}

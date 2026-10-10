import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_member_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_member_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
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
                  workspace: workspace,
                  organizationId: workspace.organizationId,
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
                            organizationMembersProvider(
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

class _MembersBody extends StatelessWidget {
  const _MembersBody({
    required this.members,
    required this.workspace,
    required this.organizationId,
  });

  final List<OrganizationMemberSummary> members;
  final ActiveWorkspace workspace;
  final String organizationId;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final activeCount = members.where((member) => member.isActive).length;

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _MembersHero(
          title: strings.organizationMembers,
          subtitle: strings.organizationMembersHint,
          totalCount: members.length,
          activeCount: activeCount,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.groups,
                label: strings.members,
                value: members.length.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.verified_user,
                label: strings.activeMembers,
                value: activeCount.toString(),
                color: AinColors.success,
                backgroundColor: AinColors.successSoft,
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.organizationMembers),
        const SizedBox(height: AinSpacing.md),
        if (members.isEmpty)
          AinEmptyState(
            icon: Icons.groups_outlined,
            title: strings.noMembersYet,
          )
        else
          for (final member in members)
            _MemberCard(
              member: member,
              workspace: workspace,
              organizationId: organizationId,
            ),
      ],
    );
  }
}

class _MembersHero extends StatelessWidget {
  const _MembersHero({
    required this.title,
    required this.subtitle,
    required this.totalCount,
    required this.activeCount,
  });

  final String title;
  final String subtitle;
  final int totalCount;
  final int activeCount;

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
              icon: Icons.groups_outlined,
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
                  icon: Icons.groups_outlined,
                  label: totalCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.verified_user_outlined,
                  label: activeCount.toString(),
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

class _MemberCard extends ConsumerWidget {
  const _MemberCard({
    required this.member,
    required this.workspace,
    required this.organizationId,
  });

  final OrganizationMemberSummary member;
  final ActiveWorkspace workspace;
  final String organizationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final canUpdate = workspace.hasAnyPermission({'members.update'});
    final canRemove = workspace.hasAnyPermission({'members.remove'});

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
                  icon: Icons.person_outline,
                  backgroundColor: member.isActive
                      ? AinColors.successSoft
                      : AinColors.roseSoft,
                  foregroundColor:
                      member.isActive ? AinColors.success : AinColors.rose,
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        member.name.isEmpty ? member.email : member.name,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: AinSpacing.xs),
                      Text(
                        member.email,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AinColors.muted,
                            ),
                      ),
                      const SizedBox(height: AinSpacing.sm),
                      Wrap(
                        spacing: AinSpacing.sm,
                        runSpacing: AinSpacing.sm,
                        children: [
                          AinStatusPill(
                            icon: Icons.admin_panel_settings_outlined,
                            label: strings.organizationRoleLabel(member.role),
                          ),
                          AinStatusPill(
                            icon: Icons.flag_outlined,
                            label: strings.memberStatusLabel(member.status),
                            color: member.isActive
                                ? AinColors.success
                                : AinColors.rose,
                            backgroundColor: member.isActive
                                ? AinColors.successSoft
                                : AinColors.roseSoft,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (canRemove)
                  IconButton(
                    tooltip: strings.removeMember,
                    onPressed: () async {
                      await ref.read(organizationMemberActionsProvider).remove(
                            organizationId: organizationId,
                            membershipId: member.id,
                          );
                    },
                    icon: const Icon(Icons.person_remove_alt_1),
                  ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            DropdownButtonFormField<String>(
              initialValue:
                  _roleValues.contains(member.role) ? member.role : 'member',
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
              onChanged: canUpdate
                  ? (value) async {
                      if (value == null || value == member.role) {
                        return;
                      }
                      await ref.read(organizationMemberActionsProvider).update(
                            organizationId: organizationId,
                            membershipId: member.id,
                            command: UpdateOrganizationMemberCommand(
                              role: value,
                            ),
                          );
                    }
                  : null,
            ),
            const SizedBox(height: AinSpacing.sm),
            DropdownButtonFormField<String>(
              initialValue:
                  member.status == 'suspended' ? 'suspended' : 'active',
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
              onChanged: canUpdate
                  ? (value) async {
                      if (value == null || value == member.status) {
                        return;
                      }
                      await ref.read(organizationMemberActionsProvider).update(
                            organizationId: organizationId,
                            membershipId: member.id,
                            command: UpdateOrganizationMemberCommand(
                              status: value,
                            ),
                          );
                    }
                  : null,
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

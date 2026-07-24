import { organizationMemberships, organizations } from "../data/organizationData";
import { modulesForOrganization, permissionsForMembership } from "../domain/organization";
import { shouldUseMockApi, httpClient } from "./httpClient";

const wait = (value) => new Promise((resolve) => window.setTimeout(() => resolve(value), 120));

function hydrateMembership(membership) {
  const organization = organizations.find((item) => item.id === membership.organizationId);
  if (!organization) return null;
  return {
    ...membership,
    organization,
    permissions: permissionsForMembership(membership),
    modules: modulesForOrganization(organization)
  };
}

export const organizationRepository = {
  async listMemberships(user) {
    if (!user) return [];
    if (!shouldUseMockApi()) {
      const workspaces = await httpClient("/workspaces");
      return workspaces.map((workspace) => ({
        id: workspace.membershipId,
        organizationId: workspace.organization.id,
        role: workspace.role,
        status: "active",
        permissions: workspace.permissions || [],
        modules: (workspace.subscription?.plan?.modules || [])
          .filter((item) => item.enabled)
          .map((item) => item.module),
        limits: Object.fromEntries(
          (workspace.subscription?.plan?.modules || [])
            .map((item) => [item.module, item.limit])
        ),
        subscription: workspace.subscription,
        organization: {
          ...workspace.organization,
          plan: workspace.subscription?.plan?.code || null,
          planName: workspace.subscription?.plan?.name || null,
          subscriptionStatus: workspace.subscription?.status || "none"
        }
      }));
    }
    const mapped = organizationMemberships[user.email] || [];
    if (mapped.length) return wait(mapped.map(hydrateMembership).filter(Boolean));
    if (!user.tenantId) return wait([]);
    const fallback = organizations.find((item) => item.name === user.company) || organizations[0];
    return wait([hydrateMembership({ organizationId: fallback.id, role: user.role === "tenant-admin" ? "organization_admin" : "member", status: "active" })]);
  }
};

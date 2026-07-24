import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertContains(source, values, label) {
  for (const value of values) {
    assert.ok(source.includes(value), `${label} is missing: ${value}`);
  }
}

const app = read("src/App.jsx");
const tenantApp = read("src/pages/TenantAdminApp.jsx");
const superApp = read("src/pages/SuperAdminApp.jsx");
const endUserApp = read("src/pages/EndUserApp.jsx");
const accountSettings = read("src/components/AccountSettings.jsx");
const marketplaceOperations = read("src/components/MarketplaceAdminOperations.jsx");
const organizationContext = read("src/contexts/OrganizationContext.jsx");
const httpClient = read("src/services/httpClient.js");
const authService = read("src/services/authService.js");
const server = read("server.js");
const styles = read("src/styles.css");
const sourceFiles = fs
  .readdirSync(path.join(root, "src"), { recursive: true })
  .filter((entry) => /\.(jsx?|css)$/.test(String(entry)))
  .map((entry) => read(path.join("src", String(entry))))
  .join("\n");

assertContains(app, [
  'path="/courses"',
  'path="/academies"',
  'path="/booking/:courseId"',
  'allowedRoles={["end-user"]}',
  'allowedRoles={["tenant-admin"]}',
  'allowedRoles={["super-admin"]}'
], "Application routing");

assertContains(tenantApp, [
  "/tenant-admin/academyProfile",
  "/tenant-admin/instructors",
  "/tenant-admin/courses",
  "/tenant-admin/batches",
  "/tenant-admin/bookingRequests",
  "academy-launch-guide"
], "Tenant academy workflow");

assertContains(marketplaceOperations, [
  "AcademyProfileSettingsPage",
  "InstructorsManagementPage",
  "CourseWizardPage",
  "MarketplaceBatchesPage",
  "MarketplaceBookingsPage"
], "Marketplace management");

for (const [name, source] of [
  ["Tenant Admin", tenantApp],
  ["Super Admin", superApp],
  ["End User", endUserApp]
]) {
  assert.ok(source.includes("<AccountSettings"), `${name} must use the shared account settings`);
}

assertContains(accountSettings, [
  "settings-nav-profile",
  "settings-nav-note",
  'role="switch"',
  'accept="image/png,image/jpeg,image/webp"'
], "Account settings");

assertContains(organizationContext, [
  "activeOrganizationId",
  "validSaved",
  'item.status === "active"',
  "activeMembership?.permissions.includes",
  "activeMembership?.modules.includes"
], "Tenant selection and authorization");

assert.equal(
  /localStorage\.setItem\(tokenKey/.test(authService),
  false,
  "Bearer tokens must never be written to persistent localStorage"
);
assert.ok(
  authService.includes("sessionStorage.setItem(tokenKey"),
  "Bearer tokens must use session storage"
);
assert.ok(
  httpClient.includes('credentials: "include"'),
  "Refresh-cookie requests must include credentials"
);

assertContains(server, [
  "Content-Security-Policy",
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Permissions-Policy",
  '["GET", "HEAD"]',
  "rootPrefix",
  "immutable"
], "Production server security");

assertContains(styles, [
  "academy-launch-steps",
  "account-settings-layout",
  "scroll-snap-type: inline mandatory",
  "@media (max-width: 760px)"
], "Responsive system");

for (const unsafePattern of [
  "dangerouslySetInnerHTML",
  "document.write(",
  "new Function(",
  "eval("
]) {
  assert.equal(
    sourceFiles.includes(unsafePattern),
    false,
    `Unsafe browser API found: ${unsafePattern}`
  );
}

console.log(
  "Production validation passed: routes, roles, tenant scoping, account UX, responsive behavior, token storage, and server headers."
);

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const routes = read("backend/routes/api.php");
const auth = read("src/services/authService.js");
const http = read("src/services/httpClient.js");
const api = read("src/services/api.js");
const marketplace = read("src/services/marketplaceRepository.js");
const organization = read("src/services/organizationRepository.js");
const backendRailway = JSON.parse(read("backend/railway.json"));
const frontendRailway = JSON.parse(read("railway.json"));

const contracts = [
  [auth, '"/auth/login"', routes, "Route::post('/login'"],
  [auth, '"/auth/register"', routes, "Route::post('/register'"],
  [http, '"/auth/refresh"', routes, "Route::post('/refresh'"],
  [organization, '"/workspaces"', routes, "Route::get('/workspaces'"],
  [marketplace, '"/public/courses?perPage=48"', routes, "Route::get('/public/courses'"],
  [marketplace, '"/public/academies?perPage=48"', routes, "Route::get('/public/academies'"],
  [marketplace, '"/public/bookings"', routes, "Route::post('/public/bookings'"],
  [api, '"/notifications/read-all"', routes, "Route::post('/notifications/read-all'"],
  [marketplace, '"/student/enrollments?perPage=100"', routes, "Route::get('/student/enrollments'"],
  [marketplace, '"/admin/categories"', routes, "Route::get('/categories'"]
];

for (const [client, clientMarker, server, serverMarker] of contracts) {
  assert.ok(client.includes(clientMarker), `Frontend contract missing ${clientMarker}`);
  assert.ok(server.includes(serverMarker), `Backend contract missing ${serverMarker}`);
}

assert.equal(frontendRailway.deploy.startCommand, "npm start");
assert.equal(backendRailway.deploy.healthcheckPath, "/api/v1/health/ready");
assert.ok(
  backendRailway.deploy.startCommand.includes("AIO_DEPLOYMENT_MODE"),
  "Backend deployment mode guard is missing"
);

console.log("Integration validation passed: frontend endpoints and backend routes are aligned.");

import assert from "node:assert/strict";
import { marketplaceSeed } from "../src/data/marketplaceData.js";

function assertUniqueIds(items, entityName) {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `${entityName} contains duplicate IDs`);
}

for (const [name, items] of Object.entries(marketplaceSeed)) {
  if (Array.isArray(items)) assertUniqueIds(items, name);
}

const academyIds = new Set(marketplaceSeed.academies.map((item) => item.id));
const courseIds = new Set(marketplaceSeed.courses.map((item) => item.id));
const batchIds = new Set(marketplaceSeed.batches.map((item) => item.id));
const categoryIds = new Set(marketplaceSeed.categories.map((item) => item.id));

for (const course of marketplaceSeed.courses) {
  assert.ok(academyIds.has(course.academyId), `Course ${course.id} references a missing academy`);
  assert.ok(categoryIds.has(course.categoryId), `Course ${course.id} references a missing category`);
  assert.ok(course.slug, `Course ${course.id} must have a public slug`);
  assert.ok(course.title && course.titleAr, `Course ${course.id} must be bilingual`);
}

for (const batch of marketplaceSeed.batches) {
  assert.ok(courseIds.has(batch.courseId), `Batch ${batch.id} references a missing course`);
  assert.ok(batch.capacity > 0, `Batch ${batch.id} must have positive capacity`);
  assert.ok(batch.confirmedSeats + batch.reservedSeats <= batch.capacity, `Batch ${batch.id} exceeds capacity`);
}

for (const booking of marketplaceSeed.bookings) {
  assert.ok(courseIds.has(booking.courseId), `Booking ${booking.id} references a missing course`);
  assert.ok(batchIds.has(booking.batchId), `Booking ${booking.id} references a missing batch`);
  assert.ok(booking.organizationId, `Booking ${booking.id} must be tenant-scoped`);
}

console.log(`Marketplace validation passed: ${marketplaceSeed.courses.length} courses, ${marketplaceSeed.batches.length} batches, ${marketplaceSeed.academies.length} academies.`);

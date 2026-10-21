import assert from "node:assert/strict";
import { marketplaceSeed } from "../src/data/marketplaceData.js";
import { WESAM_COURSE_SLUG, wesamNahwJourney } from "../src/data/wesamNahwJourneyData.js";

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

const wesamUnits = wesamNahwJourney.stages.flatMap((stage) => stage.units);
const wesamPracticeQuestions = wesamNahwJourney.practiceTracks.flatMap((track) => track.questions);
assert.equal(wesamNahwJourney.stages.length, 3, "Wesam grammar journey must contain three learning stages");
assert.equal(wesamUnits.length, wesamNahwJourney.unitsCount, "Wesam unit count must match the published overview");
assert.equal(new Set(wesamUnits.map((unit) => unit.number)).size, wesamUnits.length, "Wesam units must have unique numbers");
assert.ok(wesamUnits.every((unit) => unit.lessons.length >= 3), "Every Wesam unit must contain at least three lessons");
assert.ok(WESAM_COURSE_SLUG, "Wesam journey must be linked to a public course slug");
assert.equal(wesamNahwJourney.parsingExercise.words.length, 3, "The parsing demo must contain a complete sample sentence");
assert.equal(wesamNahwJourney.practiceTracks.length, 3, "Wesam practice studio must contain three skill tracks");
assert.equal(wesamPracticeQuestions.length, 18, "Wesam practice studio must contain eighteen reviewed sample questions");
assert.equal(new Set(wesamPracticeQuestions.map((question) => question.id)).size, wesamPracticeQuestions.length, "Wesam practice question IDs must be unique");
assert.ok(wesamPracticeQuestions.every((question) => question.prompt && question.correctAnswer && question.explanation), "Every Wesam practice question must include a prompt, answer, and explanation");
assert.ok(wesamPracticeQuestions.filter((question) => question.type === "text").every((question) => question.acceptedAnswers?.length), "Text practice questions must define accepted answers");

console.log(`Marketplace validation passed: ${marketplaceSeed.courses.length} courses, ${marketplaceSeed.batches.length} batches, ${marketplaceSeed.academies.length} academies, ${wesamUnits.length} Wesam grammar units, and ${wesamPracticeQuestions.length} practice questions.`);

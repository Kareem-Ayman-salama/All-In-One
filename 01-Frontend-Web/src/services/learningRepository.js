import { learningSeed } from "../data/learningData";
import { httpClient, shouldUseMockApi } from "./httpClient";

const ENTITY_KEYS = ["courses", "batches", "bookings", "enrollments", "announcements", "meetings", "tasks", "assignments", "quizzes", "submissions", "quizAttempts"];

function camelKey(key) {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelize(value) {
  if (Array.isArray(value)) return value.map(camelize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [camelKey(key), camelize(item)])
  );
}

function storageKey(organizationId) {
  return `ain-learning-workspace:${organizationId}`;
}

function seedForOrganization(organizationId) {
  return Object.fromEntries(ENTITY_KEYS.map((key) => [key, (learningSeed[key] || []).filter((item) => !item.organizationId || item.organizationId === organizationId)]));
}

export const learningRepository = {
  async loadWorkspace(organizationId) {
    if (!shouldUseMockApi()) {
      const request = (resource) => httpClient(`/organizations/${organizationId}/${resource}?perPage=100`)
        .catch((error) => {
          if ([403, 404].includes(error.status) || error.code === "MODULE_DISABLED") return [];
          throw error;
        });
      const [courses, batches, bookings, announcements, events, tasks, assignments, quizzes] = await Promise.all([
        request("courses"),
        request("batches"),
        request("bookings"),
        request("announcements"),
        request("events"),
        request("tasks"),
        request("assignments"),
        request("quizzes")
      ]);
      return {
        courses: camelize(courses),
        batches: camelize(batches),
        bookings: camelize(bookings),
        enrollments: [],
        announcements: camelize(announcements),
        assignments: camelize(assignments),
        quizzes: camelize(quizzes),
        submissions: [],
        quizAttempts: [],
        meetings: camelize(events).map((event) => ({
          ...event,
          date: event.startsAt,
          status: event.status || "scheduled"
        })),
        tasks: camelize(tasks).map((task) => ({
          ...task,
          dueDate: (task.dueAt || "").slice(0, 10),
          scope: task.room?.name || "",
          assignee: task.assignee?.name || "",
          progress: Number(task.progress || 0)
        }))
      };
    }
    const saved = window.localStorage.getItem(storageKey(organizationId));
    if (saved) {
      try { return JSON.parse(saved); } catch { window.localStorage.removeItem(storageKey(organizationId)); }
    }
    return seedForOrganization(organizationId);
  },

  async saveWorkspace(organizationId, data) {
    if (!shouldUseMockApi()) return data;
    window.localStorage.setItem(storageKey(organizationId), JSON.stringify(data));
    return data;
  },

  async createTask(organizationId, payload) {
    if (shouldUseMockApi()) return payload;
    return httpClient(`/organizations/${organizationId}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        titleAr: payload.titleAr,
        description: payload.scope ? `Scope: ${payload.scope}` : null,
        dueAt: payload.dueDate ? `${payload.dueDate}T23:59:00` : null,
        priority: payload.priority,
        status: "todo",
        progress: 0
      })
    });
  },

  async updateTask(organizationId, id, changes) {
    if (shouldUseMockApi()) return { id, ...changes };
    return httpClient(`/organizations/${organizationId}/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(changes)
    });
  },

  async createAnnouncement(organizationId, payload) {
    if (shouldUseMockApi()) return payload;
    return httpClient(`/organizations/${organizationId}/announcements`, {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        titleAr: payload.titleAr,
        body: payload.body,
        bodyAr: payload.bodyAr,
        audienceType: "organization",
        pinned: Boolean(payload.pinned),
        status: "published"
      })
    });
  },

  async createMeeting(organizationId, payload) {
    if (shouldUseMockApi()) return payload;
    const startsAt = new Date(`${payload.date}T${payload.time}:00`);
    const endsAt = new Date(startsAt.getTime() + Number(payload.duration || 60) * 60000);
    return httpClient(`/organizations/${organizationId}/events`, {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        titleAr: payload.titleAr,
        type: "meeting",
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        location: payload.roomName || null,
        status: "scheduled"
      })
    });
  },

  async createAssignment(organizationId, payload) {
    if (shouldUseMockApi()) return payload;
    return httpClient(`/organizations/${organizationId}/assignments`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async updateAssignment(organizationId, id, payload) {
    if (shouldUseMockApi()) return { id, ...payload };
    return httpClient(`/organizations/${organizationId}/assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  async gradeSubmission(organizationId, assignmentId, submissionId, payload) {
    if (shouldUseMockApi()) return { id: submissionId, ...payload };
    return httpClient(`/organizations/${organizationId}/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async submitAssignment(assignmentId, payload) {
    if (shouldUseMockApi()) return payload;
    return httpClient(`/student/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async createQuiz(organizationId, payload) {
    if (shouldUseMockApi()) return payload;
    return httpClient(`/organizations/${organizationId}/quizzes`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async submitQuizAttempt(quizId, answers) {
    if (shouldUseMockApi()) return { quizId, answers };
    return httpClient(`/student/quizzes/${quizId}/attempt`, {
      method: "POST",
      body: JSON.stringify({ answers })
    });
  }
};


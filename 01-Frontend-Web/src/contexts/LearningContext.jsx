import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useOrganization } from "./OrganizationContext";
import { useAuth } from "./AuthContext";
import { learningRepository } from "../services/learningRepository";

const LearningContext = createContext(null);
const EMPTY = {
  courses: [],
  batches: [],
  bookings: [],
  enrollments: [],
  announcements: [],
  meetings: [],
  tasks: [],
  assignments: [],
  quizzes: [],
  submissions: [],
  quizAttempts: []
};

function createId(prefix) {
  return `${prefix}-${window.crypto?.randomUUID?.() || Date.now()}`;
}

export function LearningProvider({ children }) {
  const { activeOrganization, memberships } = useOrganization();
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    if (!activeOrganization) { setData(EMPTY); setLoading(false); return () => { current = false; }; }
    setLoading(true);
    const organizationMemberships = user?.role === "end-user" && memberships.length > 1
      ? memberships
      : memberships.filter((item) => item.organizationId === activeOrganization.id);
    Promise.all(organizationMemberships.map(async (membership) => {
      const result = await learningRepository.loadWorkspace(membership.organizationId);
      const organizationName = membership.organization?.nameAr || membership.organization?.name;
      return Object.fromEntries(Object.entries({ ...EMPTY, ...result }).map(([key, items]) => [
        key,
        (items || []).map((item) => ({
          ...item,
          organizationId: item.organizationId || membership.organizationId,
          organizationName: item.organizationName || organizationName
        }))
      ]));
    }))
      .then((results) => {
        if (!current) return;
        const merged = Object.fromEntries(Object.keys(EMPTY).map((key) => [
          key,
          results.flatMap((result) => result[key] || [])
        ]));
        setData(merged);
      })
      .catch(() => {
        if (current) setData(EMPTY);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [activeOrganization, memberships, user?.role]);

  const commit = useCallback((next) => {
    setData(next);
    if (activeOrganization) {
      const organizationIds = user?.role === "end-user" && memberships.length > 1
        ? memberships.map((item) => item.organizationId)
        : [activeOrganization.id];
      organizationIds.forEach((organizationId) => {
        const scoped = Object.fromEntries(Object.keys(EMPTY).map((key) => [
          key,
          (next[key] || []).filter((item) => !item.organizationId || item.organizationId === organizationId)
        ]));
        learningRepository.saveWorkspace(organizationId, scoped);
      });
    }
    return next;
  }, [activeOrganization, memberships, user?.role]);

  const addEntity = useCallback((key, prefix, payload) => {
    const entity = { id: createId(prefix), organizationId: activeOrganization?.id, createdAt: new Date().toISOString(), ...payload };
    commit({ ...data, [key]: [entity, ...(data[key] || [])] });
    return entity;
  }, [activeOrganization, commit, data]);

  const createCourse = useCallback((payload) => addEntity("courses", "course", { status: "draft", students: 0, color: "#4f46e5", ...payload }), [addEntity]);
  const createBatch = useCallback((payload) => addEntity("batches", "batch", { status: "open", reservedSeats: 0, confirmedSeats: 0, ...payload }), [addEntity]);
  
  const createAnnouncement = useCallback(async (payload) => {
    const entity = await learningRepository.createAnnouncement(activeOrganization?.id, payload);
    setData((current) => ({ ...current, announcements: [{ ...entity, ...payload }, ...(current.announcements || [])] }));
    return entity;
  }, [activeOrganization]);

  const createMeeting = useCallback(async (payload) => {
    const entity = await learningRepository.createMeeting(activeOrganization?.id, payload);
    setData((current) => ({ ...current, meetings: [{ ...entity, ...payload }, ...(current.meetings || [])] }));
    return entity;
  }, [activeOrganization]);

  const createTask = useCallback(async (payload) => {
    const entity = await learningRepository.createTask(activeOrganization?.id, payload);
    setData((current) => ({ ...current, tasks: [{ ...entity, ...payload, status: "todo", progress: 0 }, ...(current.tasks || [])] }));
    return entity;
  }, [activeOrganization]);

  const createAssignment = useCallback(async (payload) => {
    const entity = await learningRepository.createAssignment(activeOrganization?.id, payload);
    const newAssignment = { id: entity.id || createId("assign"), organizationId: activeOrganization?.id, submissionsCount: 0, status: "published", ...payload, ...entity };
    setData((current) => ({ ...current, assignments: [newAssignment, ...(current.assignments || [])] }));
    commit({ ...data, assignments: [newAssignment, ...(data.assignments || [])] });
    return newAssignment;
  }, [activeOrganization, commit, data]);

  const deleteAssignment = useCallback(async (id) => {
    const assignments = (data.assignments || []).filter((item) => item.id !== id);
    commit({ ...data, assignments });
  }, [commit, data]);

  const submitAssignment = useCallback(async (assignmentId, payload) => {
    await learningRepository.submitAssignment(assignmentId, payload);
    const submission = {
      id: createId("sub"),
      organizationId: activeOrganization?.id,
      assignmentId,
      studentId: user?.id || "student",
      studentName: user?.name || "Student",
      studentEmail: user?.email,
      submissionText: payload.submissionText,
      attachmentUrl: payload.attachmentUrl,
      fileName: payload.fileName,
      status: "submitted",
      score: null,
      feedback: null,
      submittedAt: new Date().toISOString()
    };
    const submissions = [submission, ...(data.submissions || []).filter((s) => !(s.assignmentId === assignmentId && s.studentId === user?.id))];
    const assignments = (data.assignments || []).map((a) => a.id === assignmentId ? { ...a, mySubmission: submission, submissionsCount: (a.submissionsCount || 0) + 1 } : a);
    commit({ ...data, submissions, assignments });
    return submission;
  }, [activeOrganization?.id, commit, data, user]);

  const gradeSubmission = useCallback(async (assignmentId, submissionId, payload) => {
    await learningRepository.gradeSubmission(activeOrganization?.id, assignmentId, submissionId, payload);
    const submissions = (data.submissions || []).map((s) => s.id === submissionId ? { ...s, score: payload.score, feedback: payload.feedback, status: "graded", gradedAt: new Date().toISOString() } : s);
    const assignments = (data.assignments || []).map((a) => {
      if (a.id === assignmentId && a.mySubmission?.id === submissionId) {
        return { ...a, mySubmission: { ...a.mySubmission, score: payload.score, feedback: payload.feedback, status: "graded" } };
      }
      return a;
    });
    commit({ ...data, submissions, assignments });
  }, [activeOrganization?.id, commit, data]);

  const createQuiz = useCallback(async (payload) => {
    const entity = await learningRepository.createQuiz(activeOrganization?.id, payload);
    const newQuiz = { id: entity.id || createId("quiz"), organizationId: activeOrganization?.id, isPublished: true, ...payload, ...entity };
    setData((current) => ({ ...current, quizzes: [newQuiz, ...(current.quizzes || [])] }));
    commit({ ...data, quizzes: [newQuiz, ...(data.quizzes || [])] });
    return newQuiz;
  }, [activeOrganization?.id, commit, data]);

  const deleteQuiz = useCallback(async (id) => {
    const quizzes = (data.quizzes || []).filter((item) => item.id !== id);
    commit({ ...data, quizzes });
  }, [commit, data]);

  const submitQuizAttempt = useCallback(async (quizId, answers) => {
    const quiz = (data.quizzes || []).find((q) => q.id === quizId);
    let earned = 0;
    let total = 0;
    const questions = quiz?.questions || [];
    questions.forEach((q) => {
      total += q.points || 10;
      if (String(answers[q.id]) === String(q.correctAnswer)) {
        earned += q.points || 10;
      }
    });
    const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
    const passed = percentage >= (quiz?.passingScore || 60);

    const attempt = {
      id: createId("attempt"),
      organizationId: activeOrganization?.id,
      quizId,
      studentId: user?.id || "student",
      studentName: user?.name || "Student",
      score: earned,
      totalPoints: total,
      percentage,
      passed,
      attemptNumber: ((data.quizAttempts || []).filter((a) => a.quizId === quizId && a.studentId === user?.id).length || 0) + 1,
      startedAt: new Date(Date.now() - 600000).toISOString(),
      completedAt: new Date().toISOString()
    };
    const quizAttempts = [attempt, ...(data.quizAttempts || [])];
    commit({ ...data, quizAttempts });
    return { attempt, score: earned, totalPoints: total, percentage, passed };
  }, [activeOrganization?.id, commit, data, user]);

  const createBooking = useCallback((payload) => {
    const duplicate = data.bookings.some((item) => item.courseId === payload.courseId && item.email === user?.email && item.status !== "rejected");
    if (duplicate) return { duplicate: true };
    const booking = addEntity("bookings", "booking", {
      studentId: user?.id || user?.email,
      studentName: user?.name || "AIN learner",
      email: user?.email,
      phone: "",
      status: "pending_confirmation",
      paymentStatus: "unpaid",
      ...payload
    });
    return { duplicate: false, booking };
  }, [addEntity, data.bookings, user]);

  const updateTaskStatus = useCallback(async (id, status) => {
    await learningRepository.updateTask(activeOrganization.id, id, {
      status,
      progress: status === "done" ? 100 : status === "in_progress" ? 25 : 0
    });
    const tasks = data.tasks.map((task) => task.id === id ? { ...task, status, progress: status === "done" ? 100 : status === "in_progress" ? Math.max(task.progress, 25) : 0 } : task);
    commit({ ...data, tasks });
  }, [activeOrganization, commit, data]);

  const updateBookingStatus = useCallback((id, status) => {
    const booking = data.bookings.find((item) => item.id === id);
    if (!booking) return { ok: false, reason: "not_found" };
    const batch = data.batches.find((item) => item.id === booking.batchId);
    if (status === "confirmed" && batch && batch.confirmedSeats >= batch.capacity) return { ok: false, reason: "capacity_full" };
    const bookings = data.bookings.map((item) => item.id === id ? { ...item, status } : item);
    let batches = data.batches;
    let enrollments = data.enrollments;
    if (status === "confirmed" && booking.status !== "confirmed") {
      batches = data.batches.map((item) => item.id === booking.batchId ? { ...item, confirmedSeats: item.confirmedSeats + 1, reservedSeats: Math.max(0, item.reservedSeats - 1) } : item);
      const exists = enrollments.some((item) => item.bookingId === booking.id);
      if (!exists) enrollments = [{ id: createId("enrollment"), organizationId: booking.organizationId, courseId: booking.courseId, batchId: booking.batchId, studentId: booking.studentId, bookingId: booking.id, roomId: batch?.roomId, enrollmentStatus: "active", accessStartsAt: batch?.startDate, accessEndsAt: batch?.endDate }, ...enrollments];
    }
    commit({ ...data, bookings, batches, enrollments });
    return { ok: true };
  }, [commit, data]);

  const value = useMemo(() => ({
    loading,
    ...data,
    createCourse,
    createBatch,
    createBooking,
    createAnnouncement,
    createMeeting,
    createTask,
    updateTaskStatus,
    updateBookingStatus,
    createAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission,
    createQuiz,
    deleteQuiz,
    submitQuizAttempt
  }), [
    createAnnouncement,
    createAssignment,
    createBatch,
    createBooking,
    createCourse,
    createMeeting,
    createQuiz,
    createTask,
    data,
    deleteAssignment,
    deleteQuiz,
    gradeSubmission,
    loading,
    submitAssignment,
    submitQuizAttempt,
    updateBookingStatus,
    updateTaskStatus
  ]);

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const value = useContext(LearningContext);
  if (!value) throw new Error("useLearning must be used inside LearningProvider");
  return value;
}


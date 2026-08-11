import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useOrganization } from "./OrganizationContext";
import { useAuth } from "./AuthContext";
import { learningRepository } from "../services/learningRepository";

const LearningContext = createContext(null);
const EMPTY = { courses: [], batches: [], bookings: [], enrollments: [], announcements: [], meetings: [], tasks: [] };

function createId(prefix) {
  return `${prefix}-${window.crypto?.randomUUID?.() || Date.now()}`;
}

export function LearningProvider({ children }) {
  const { activeOrganization } = useOrganization();
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    if (!activeOrganization) { setData(EMPTY); setLoading(false); return () => { current = false; }; }
    setLoading(true);
    learningRepository.loadWorkspace(activeOrganization.id)
      .then((result) => {
        if (current) setData({ ...EMPTY, ...result });
      })
      .catch(() => {
        if (current) setData(EMPTY);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [activeOrganization]);

  const commit = useCallback((next) => {
    setData(next);
    if (activeOrganization) learningRepository.saveWorkspace(activeOrganization.id, next);
    return next;
  }, [activeOrganization]);

  const addEntity = useCallback((key, prefix, payload) => {
    const entity = { id: createId(prefix), organizationId: activeOrganization.id, createdAt: new Date().toISOString(), ...payload };
    commit({ ...data, [key]: [entity, ...data[key]] });
    return entity;
  }, [activeOrganization, commit, data]);

  const createCourse = useCallback((payload) => addEntity("courses", "course", { status: "draft", students: 0, color: "#4f46e5", ...payload }), [addEntity]);
  const createBatch = useCallback((payload) => addEntity("batches", "batch", { status: "open", reservedSeats: 0, confirmedSeats: 0, ...payload }), [addEntity]);
  const createAnnouncement = useCallback(async (payload) => {
    const entity = await learningRepository.createAnnouncement(activeOrganization.id, payload);
    setData((current) => ({ ...current, announcements: [{ ...entity, ...payload }, ...current.announcements] }));
    return entity;
  }, [activeOrganization]);
  const createMeeting = useCallback(async (payload) => {
    const entity = await learningRepository.createMeeting(activeOrganization.id, payload);
    setData((current) => ({ ...current, meetings: [{ ...entity, ...payload }, ...current.meetings] }));
    return entity;
  }, [activeOrganization]);
  const createTask = useCallback(async (payload) => {
    const entity = await learningRepository.createTask(activeOrganization.id, payload);
    setData((current) => ({ ...current, tasks: [{ ...entity, ...payload, status: "todo", progress: 0 }, ...current.tasks] }));
    return entity;
  }, [activeOrganization]);

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

  const value = useMemo(() => ({ loading, ...data, createCourse, createBatch, createBooking, createAnnouncement, createMeeting, createTask, updateTaskStatus, updateBookingStatus }), [createAnnouncement, createBatch, createBooking, createCourse, createMeeting, createTask, data, loading, updateBookingStatus, updateTaskStatus]);
  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const value = useContext(LearningContext);
  if (!value) throw new Error("useLearning must be used inside LearningProvider");
  return value;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useOrganization } from "./OrganizationContext";
import { api } from "../services/api";
import { shouldUseMockApi } from "../services/httpClient";

const WorkspaceContext = createContext(null);
const STORAGE_KEY = "ain-workspace-state-v2";

const defaultEvents = [
  {
    id: "event-product-review",
    title: "Product follow-up",
    titleAr: "اجتماع متابعة المنتج",
    roomId: 3,
    roomName: "Engineering Hub",
    date: "2026-07-23",
    time: "14:00",
    duration: 60,
    attendees: 6,
    description: "Weekly product roadmap review.",
    status: "scheduled"
  },
  {
    id: "event-policy-review",
    title: "Attendance policy review",
    titleAr: "مراجعة سياسة الحضور",
    roomId: 1,
    roomName: "HR & Policies",
    date: "2026-07-25",
    time: "11:30",
    duration: 45,
    attendees: 12,
    description: "Review the updated attendance policy.",
    status: "scheduled"
  }
];

const defaultActivity = [
  { id: "activity-1", action: "file.uploaded", actor: "Sarah Ahmed", target: "Attendance Policy 2026.pdf", area: "HR & Policies", time: "5 minutes ago", tone: "primary" },
  { id: "activity-2", action: "member.joined", actor: "Mohamed Khalil", target: "Technical team", area: "Members", time: "45 minutes ago", tone: "success" },
  { id: "activity-3", action: "security.signin_failed", actor: "Unknown device", target: "185.42.16.9", area: "Security", time: "2 hours ago", tone: "danger" }
];

function loadPersistedState(storageKey) {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "null");
  } catch {
    return null;
  }
}

function savePersistedState(storageKey, state) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function createId(prefix) {
  return `${prefix}-${window.crypto?.randomUUID?.() || Date.now()}`;
}

export function WorkspaceProvider({ initialData, children }) {
  const { activeOrganization } = useOrganization();
  const mock = shouldUseMockApi();
  const storageKey = activeOrganization ? `${STORAGE_KEY}:${activeOrganization.id}` : STORAGE_KEY;
  const persisted = useMemo(() => mock ? loadPersistedState(storageKey) : null, [mock, storageKey]);
  const [rooms, setRooms] = useState(persisted?.rooms || initialData.rooms || []);
  const [files, setFiles] = useState(persisted?.files || initialData.files || []);
  const [members, setMembers] = useState(persisted?.members || initialData.members || []);
  const [tenants] = useState(initialData.tenants || []);
  const [notifications, setNotifications] = useState(persisted?.notifications || initialData.notifications || []);
  const [events, setEvents] = useState(persisted?.events || (mock ? defaultEvents : initialData.events || []));
  const [activity, setActivity] = useState(persisted?.activity || (mock ? defaultActivity : initialData.activity || []));
  const [bookings, setBookings] = useState(persisted?.bookings || []);

  useEffect(() => {
    if (mock) savePersistedState(storageKey, { rooms, files, members, notifications, events, activity, bookings });
  }, [activity, bookings, events, files, members, mock, notifications, rooms, storageKey]);

  const persist = useCallback((overrides = {}) => {
    if (mock) savePersistedState(storageKey, { rooms, files, members, notifications, events, activity, bookings, ...overrides });
  }, [activity, bookings, events, files, members, mock, notifications, rooms, storageKey]);

  const recordActivity = useCallback((entry) => {
    const nextEntry = { id: createId("activity"), time: "Just now", tone: "primary", ...entry };
    setActivity((current) => {
      const next = [nextEntry, ...current];
      return next;
    });
    return nextEntry;
  }, [persist]);

  const addNotification = useCallback((entry) => {
    const nextEntry = { id: createId("notification"), unread: true, time: "Just now", type: "Workspace", ...entry };
    setNotifications((current) => {
      const next = [nextEntry, ...current];
      return next;
    });
    return nextEntry;
  }, [persist]);

  const createRoom = useCallback((payload) => {
    const room = {
      id: payload.id || createId("room"),
      name: payload.name,
      type: payload.type,
      members: Number(payload.members || 0),
      files: 0,
      status: "Active",
      color: payload.color || "#4F46E5"
    };
    const nextRooms = [room, ...rooms];
    let nextEvents = events;
    let nextNotifications = notifications;

    if (payload.date && payload.time) {
      const event = {
        id: createId("event"),
        title: payload.eventTitle || `${payload.name} session`,
        titleAr: payload.eventTitleAr || payload.eventTitle || `موعد ${payload.name}`,
        roomId: room.id,
        roomName: room.name,
        date: payload.date,
        time: payload.time,
        duration: Number(payload.duration || 60),
        attendees: Number(payload.members || 0),
        description: payload.description || "",
        status: "scheduled"
      };
      nextEvents = [...events, event];
      nextNotifications = [{
        id: createId("notification"),
        title: "New room event scheduled",
        body: `${event.title} on ${event.date} at ${event.time}.`,
        unread: true,
        time: "Just now",
        target: "/end-user/calendar",
        type: "Calendar"
      }, {
        id: createId("notification"),
        title: "Room event scheduled",
        body: `${event.title} on ${event.date} at ${event.time}.`,
        unread: true,
        time: "Just now",
        target: "/tenant-admin/calendar",
        type: "Calendar"
      }, ...notifications];
    }

    setRooms(nextRooms);
    setEvents(nextEvents);
    setNotifications(nextNotifications);
    const nextActivity = [{
      id: createId("activity"),
      action: "room.created",
      actor: "Workspace admin",
      target: room.name,
      area: "Rooms",
      time: "Just now",
      tone: "success"
    }, ...activity];
    setActivity(nextActivity);
    persist({ rooms: nextRooms, events: nextEvents, notifications: nextNotifications, activity: nextActivity });
    return room;
  }, [activity, events, notifications, persist, rooms]);

  const inviteMember = useCallback((payload) => {
    const member = {
      id: createId("member"),
      name: payload.name,
      email: payload.email,
      role: payload.role || "Employee",
      room: payload.room,
      status: "Pending",
      expiresAt: payload.expiresAt || "No expiry",
      progress: 0,
      device: "Pending invite"
    };
    const nextMembers = [member, ...members];
    const nextActivity = [{ id: createId("activity"), action: "member.invited", actor: "Workspace admin", target: member.email, area: member.room, time: "Just now", tone: "success" }, ...activity];
    setMembers(nextMembers);
    setActivity(nextActivity);
    persist({ members: nextMembers, activity: nextActivity });
    return member;
  }, [activity, members, persist]);

  const uploadFile = useCallback((payload) => {
    const file = {
      id: createId("file"),
      name: payload.name,
      room: payload.room,
      type: payload.type || "File",
      size: payload.size || "Unknown",
      views: 0,
      protected: payload.protected !== false,
      date: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date())
    };
    const nextFiles = [file, ...files];
    const nextActivity = [{ id: createId("activity"), action: "file.uploaded", actor: "Workspace admin", target: file.name, area: file.room, time: "Just now", tone: "success" }, ...activity];
    setFiles(nextFiles);
    setActivity(nextActivity);
    persist({ files: nextFiles, activity: nextActivity });
    return file;
  }, [activity, files, persist]);

  const removeItem = useCallback(async (collection, id) => {
    const maps = { rooms: [rooms, setRooms], files: [files, setFiles], members: [members, setMembers] };
    const pair = maps[collection];
    if (!pair) return null;
    const [items, setter] = pair;
    const removed = items.find((item) => item.id === id);
    if (!removed) return null;
    if (!mock && activeOrganization) {
      if (collection === "rooms") await api.deleteRoom(activeOrganization.id, id);
      if (collection === "files") await api.deleteContent(activeOrganization.id, id);
      if (collection === "members") await api.removeMember(activeOrganization.id, id);
    }
    const next = items.filter((item) => item.id !== id);
    const relatedEvents = collection === "rooms" ? events.filter((event) => event.roomId === id) : [];
    const nextEvents = collection === "rooms" ? events.filter((event) => event.roomId !== id) : events;
    setter(next);
    if (collection === "rooms") setEvents(nextEvents);
    persist({ [collection]: next, events: nextEvents });
    recordActivity({ action: `${collection}.deleted`, actor: "Workspace admin", target: removed.name, area: collection, tone: "danger" });
    return { removed, undo: mock ? () => {
      setter((current) => {
        const restored = [removed, ...current];
        persist({ [collection]: restored, events: collection === "rooms" ? [...relatedEvents, ...nextEvents] : events });
        return restored;
      });
      if (collection === "rooms" && relatedEvents.length) setEvents((current) => [...relatedEvents, ...current]);
      recordActivity({ action: `${collection}.restored`, actor: "Workspace admin", target: removed.name, area: collection, tone: "success" });
    } : null };
  }, [activeOrganization, events, files, members, mock, persist, recordActivity, rooms]);

  const markNotificationRead = useCallback((id) => {
    if (!mock) api.markNotificationRead(id).catch(() => {});
    const next = notifications.map((item) => item.id === id ? { ...item, unread: false } : item);
    setNotifications(next);
    persist({ notifications: next });
  }, [mock, notifications, persist]);

  const markAllNotificationsRead = useCallback(() => {
    if (!mock) api.markAllNotificationsRead().catch(() => {});
    const next = notifications.map((item) => ({ ...item, unread: false }));
    setNotifications(next);
    persist({ notifications: next });
  }, [mock, notifications, persist]);

  const createBooking = useCallback((payload) => {
    const unavailable = bookings.some((booking) => (
      booking.teacherId === payload.teacherId
      && booking.date === payload.date
      && booking.time === payload.time
      && booking.status !== "cancelled"
    ));
    if (unavailable) return { ok: false, reason: "slot_unavailable" };

    const booking = {
      id: createId("booking"),
      status: "confirmed",
      createdAt: new Date().toISOString(),
      ...payload
    };
    const event = {
      id: createId("event"),
      title: `${payload.subjectName} lesson with ${payload.teacherName}`,
      titleAr: `حصة ${payload.subjectNameAr} مع ${payload.teacherNameAr}`,
      roomId: null,
      roomName: payload.teacherName,
      date: payload.date,
      time: payload.time,
      duration: Number(payload.duration || 60),
      attendees: 2,
      description: payload.format === "onsite" ? "On-site private lesson" : "Online private lesson",
      status: "scheduled",
      bookingId: booking.id
    };
    const notification = {
      id: createId("notification"),
      title: "Lesson booking confirmed",
      titleAr: "تم تأكيد حجز الحصة",
      body: `${payload.subjectName} with ${payload.teacherName} on ${payload.date} at ${payload.time}.`,
      bodyAr: `${payload.subjectNameAr} مع ${payload.teacherNameAr} يوم ${payload.date} الساعة ${payload.time}.`,
      unread: true,
      time: "Just now",
      target: "/end-user/bookings",
      type: "Booking"
    };
    const auditEntry = {
      id: createId("activity"),
      action: "booking.created",
      actor: payload.studentName || "Student",
      target: payload.teacherName,
      area: "Bookings",
      time: "Just now",
      tone: "success"
    };
    const nextBookings = [booking, ...bookings];
    const nextEvents = [...events, event];
    const nextNotifications = [notification, ...notifications];
    const nextActivity = [auditEntry, ...activity];
    setBookings(nextBookings);
    setEvents(nextEvents);
    setNotifications(nextNotifications);
    setActivity(nextActivity);
    persist({ bookings: nextBookings, events: nextEvents, notifications: nextNotifications, activity: nextActivity });
    return { ok: true, booking };
  }, [activity, bookings, events, notifications, persist]);

  const value = useMemo(() => ({
    rooms,
    files,
    members,
    tenants,
    notifications,
    events,
    activity,
    bookings,
    createRoom,
    inviteMember,
    uploadFile,
    removeItem,
    recordActivity,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    createBooking
  }), [activity, addNotification, bookings, createBooking, createRoom, events, files, inviteMember, markAllNotificationsRead, markNotificationRead, members, notifications, recordActivity, removeItem, rooms, tenants, uploadFile]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}

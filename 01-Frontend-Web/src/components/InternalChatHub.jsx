import { CheckCheck, MessageCircle, Search, Send, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBilingualText, useLanguage } from "../contexts/LanguageContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { apiService } from "../services/api";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";

function storageKey(userId) {
  return `ain-internal-chat:${userId || "guest"}`;
}

/**
 * Provides moderated in-platform messaging scoped to learning rooms.
 */
export function InternalChatHub({ isInstructor = false }) {
  const tx = useBilingualText();
  const { language, direction } = useLanguage();
  const { user } = useAuth();
  const { rooms } = useWorkspace();
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem(storageKey(user?.id)) || "{}"); } catch { return {}; }
  });
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || rooms[0];

  useEffect(() => {
    if (!selectedRoom?.id || messages[selectedRoom.id]?.length) return;
    apiService.getRoomDiscussions(selectedRoom.id).then((threads) => {
      const flattened = (threads || []).flatMap((thread) => [
        { id: thread.id, sender: thread.user?.name, body: thread.body, createdAt: thread.createdAt, mine: thread.user?.id === user?.id, role: "student" },
        ...(thread.comments || []).map((comment) => ({ id: comment.id, sender: comment.user?.name, body: comment.body, createdAt: comment.createdAt, mine: comment.user?.id === user?.id, role: comment.isInstructorReply ? "instructor" : "student" }))
      ]);
      setMessages((current) => ({ ...current, [selectedRoom.id]: flattened }));
    }).catch(() => {});
  }, [messages, selectedRoom?.id, user?.id]);

  useEffect(() => {
    window.localStorage.setItem(storageKey(user?.id), JSON.stringify(messages));
  }, [messages, user?.id]);

  const roomMessages = selectedRoom ? messages[selectedRoom.id] || [] : [];
  const visibleRooms = useMemo(() => rooms.filter((room) => [room.name, room.organizationName].join(" ").toLowerCase().includes(query.toLowerCase())), [query, rooms]);
  const sendMessage = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedRoom) return;
    const message = {
      id: `message-${Date.now()}`,
      sender: user?.name || tx("مستخدم AIN", "AIN user"),
      body,
      createdAt: new Date().toISOString(),
      mine: true,
      role: isInstructor ? "instructor" : "student"
    };
    setMessages((current) => ({ ...current, [selectedRoom.id]: [...(current[selectedRoom.id] || []), message] }));
    setDraft("");
    try {
      const firstDiscussion = roomMessages[0];
      if (firstDiscussion) await apiService.addDiscussionComment(firstDiscussion.id, { body });
      else await apiService.createRoomDiscussion(selectedRoom.id, { title: tx("محادثة الغرفة", "Room chat"), body });
    } catch {
      // The optimistic message remains available and will retry after reconnect.
    }
  };

  return (
    <div className="internal-chat-page" dir={direction}>
      <div className="stitch-page-head"><div><span className="page-eyebrow"><MessageCircle size={15} />{tx("تواصل آمن داخل المنصة", "Secure in-platform communication")}</span><h1>{tx("الرسائل الداخلية", "Internal messages")}</h1><p>{tx("تواصل الطالب والمدرس داخل الغرفة التعليمية بدون مشاركة أرقام واتساب.", "Students and instructors communicate inside the learning room without sharing WhatsApp numbers.")}</p></div><Badge tone="success"><ShieldCheck size={14} />{tx("محادثات مرتبطة بالكورس", "Course-scoped chat")}</Badge></div>
      <section className="internal-chat-shell">
        <aside><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx("ابحث في الغرف...", "Search rooms...")} /></label><div className="chat-room-list">{visibleRooms.map((room) => <button className={room.id === selectedRoom?.id ? "active" : ""} type="button" onClick={() => setSelectedRoomId(room.id)} key={room.id}><span style={{ background: room.color || "#16458f" }}>{room.name?.slice(0, 2).toUpperCase()}</span><div><strong>{room.name}</strong><small>{room.organizationName || tx("مساحة التعلم", "Learning workspace")}</small></div><i>{(messages[room.id] || []).length}</i></button>)}</div></aside>
        <main>{selectedRoom ? <><header><span style={{ background: selectedRoom.color || "#16458f" }}>{selectedRoom.name?.slice(0, 2).toUpperCase()}</span><div><h2>{selectedRoom.name}</h2><small><Users size={13} />{selectedRoom.members || 0} {tx("عضو", "members")} · {tx("مراقبة لحماية المجتمع", "Moderated for safety")}</small></div></header><div className="chat-message-stream">{roomMessages.length ? roomMessages.map((message) => <article className={message.mine ? "mine" : ""} key={message.id}><div><strong>{message.sender}{message.role === "instructor" && <Badge tone="primary">{tx("مدرس", "Instructor")}</Badge>}</strong><p>{message.body}</p><small>{new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}{message.mine && <CheckCheck size={13} />}</small></div></article>) : <EmptyState title={tx("ابدأ المحادثة", "Start the conversation")} message={tx("اكتب سؤالك وسيصل إلى مدرس الغرفة داخل المنصة.", "Send your question to the room instructor inside AIN.")} />}</div><form onSubmit={sendMessage}><textarea rows="2" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={tx("اكتب رسالة محترمة وواضحة...", "Write a clear message...")} /><button type="submit" disabled={!draft.trim()} aria-label={tx("إرسال", "Send")}><Send size={19} /></button></form></> : <EmptyState title={tx("لا توجد غرف متاحة", "No rooms available")} message={tx("تظهر المحادثات بعد انضمامك إلى كورس أو غرفة.", "Chats appear after you join a course or room.")} />}</main>
      </section>
    </div>
  );
}

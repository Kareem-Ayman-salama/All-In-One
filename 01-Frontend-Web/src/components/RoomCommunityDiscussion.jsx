import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { useLanguage, useBilingualText } from "../contexts/LanguageContext";

/**
 * RoomCommunityDiscussion
 * Full in-room interactive community wall replacing external WhatsApp/Telegram groups.
 * Enables students to ask questions, attach context, and instructors to reply with verified badges.
 */
export function RoomCommunityDiscussion({ roomId, isInstructor = false }) {
  const { direction, language } = useLanguage();
  const bt = useBilingualText();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [commentText, setCommentText] = useState({});
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDiscussions();
  }, [roomId]);

  const loadDiscussions = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRoomDiscussions(roomId);
      setDiscussions(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      console.error("Failed to load room discussions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    setSubmitting(true);
    try {
      const created = await apiService.createRoomDiscussion(roomId, {
        title: newTitle,
        body: newBody
      });
      setDiscussions([created, ...discussions]);
      setNewTitle("");
      setNewBody("");
    } catch (err) {
      console.error("Error creating discussion:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (discId) => {
    const text = commentText[discId];
    if (!text || !text.trim()) return;

    try {
      const comment = await apiService.addDiscussionComment(discId, { body: text });
      setDiscussions(
        discussions.map((d) => {
          if (d.id === discId) {
            const existingComments = d.comments || [];
            return {
              ...d,
              commentsCount: (d.commentsCount || 0) + 1,
              comments: [...existingComments, comment]
            };
          }
          return d;
        })
      );
      setCommentText({ ...commentText, [discId]: "" });
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleTogglePin = async (discId) => {
    try {
      const res = await apiService.toggleDiscussionPin(discId);
      setDiscussions(
        discussions.map((d) => (d.id === discId ? { ...d, isPinned: res.isPinned } : d))
      );
    } catch (err) {
      console.error("Error pinning discussion:", err);
    }
  };

  const filteredDiscussions = discussions.filter(
    (d) =>
      d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.body?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" dir={direction}>
      {/* Community Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              {bt("💬 مجتمع الغرفة ونقاشات الطلاب", "💬 Room Community & Discussions")}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {bt("النقاشات والاستفسارات الأكاديمية", "Academic Discussions & Q&A")}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              {bt(
                "بيئة تعليمية تفاعلية آمنة للاستفسارات وتبادل الخبرات مع المدرس والزملاء دون الحاجة لجروبات خارجية.",
                "Safe, interactive learning environment to ask questions and discuss coursework with instructors and peers."
              )}
            </p>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={bt("🔍 بحث في الاستفسارات...", "🔍 Search discussions...")}
              className="w-full px-4 py-2 bg-slate-950/70 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* New Question Form */}
      <form onSubmit={handleCreateDiscussion} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>✍️</span> {bt("طرح سؤال أو موضوع للنقاش", "Ask a Question or Start Discussion")}
        </h3>
        <div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={bt("عنوان السؤال أو الاستفسار باختصار...", "Brief question title or topic...")}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <textarea
            rows="3"
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder={bt("اكتب تفاصيل استفسارك أو النقطة التي تحتاج توضيحاً فيها من المحاضر...", "Describe your question or the point that needs clarification...")}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all"
          >
            {submitting ? bt("جاري النشر...", "Publishing...") : bt("نشر الاستفسار", "Post Question")}
          </button>
        </div>
      </form>

      {/* Discussions Feed */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          {bt("جاري تحميل نقاشات الغرفة...", "Loading discussions...")}
        </div>
      ) : filteredDiscussions.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/30 rounded-3xl border border-slate-800 text-slate-400 text-sm">
          {bt("لا توجد استفسارات مطروحة في هذه الغرفة بعد. كن أول من يطرح سؤالاً!", "No discussions posted in this room yet. Be the first to ask!")}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDiscussions.map((disc) => (
            <div
              key={disc.id}
              className={`p-6 rounded-3xl border transition-all ${
                disc.isPinned
                  ? "bg-indigo-950/20 border-indigo-500/40 shadow-lg shadow-indigo-500/5"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-sm">
                    {disc.user?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{disc.title}</h4>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{disc.user?.name || bt("طالب", "Student")}</span>
                      <span>•</span>
                      <span>{new Date(disc.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {disc.isPinned && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      {bt("📌 مثبت", "📌 Pinned")}
                    </span>
                  )}
                  {isInstructor && (
                    <button
                      onClick={() => handleTogglePin(disc.id)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg transition-colors"
                    >
                      {disc.isPinned ? bt("إلغاء التثبيت", "Unpin") : bt("تثبيت", "Pin")}
                    </button>
                  )}
                </div>
              </div>

              {/* Question Body */}
              <p className="text-slate-300 text-sm mt-4 leading-relaxed whitespace-pre-line">{disc.body}</p>

              {/* Comments Section */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
                <div className="text-xs font-semibold text-slate-400">
                  {bt("الردود والمناقشات", "Replies & Comments")} ({disc.comments?.length || 0})
                </div>

                {disc.comments &&
                  disc.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                        comment.isInstructorReply
                          ? "bg-indigo-900/30 border border-indigo-500/30"
                          : "bg-slate-950/60 border border-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{comment.user?.name || bt("مشارك", "Participant")}</span>
                          {comment.isInstructorReply && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                              {bt("✓ المعلم المعتمد", "✓ Verified Instructor")}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(comment.createdAt).toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{comment.body}</p>
                    </div>
                  ))}

                {/* Add Reply Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={commentText[disc.id] || ""}
                    onChange={(e) => setCommentText({ ...commentText, [disc.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddComment(disc.id);
                      }
                    }}
                    placeholder={isInstructor ? bt("اكتب ردك المعتمد كمعلم...", "Write your instructor reply...") : bt("اكتب إجابتك أو تعقيبك...", "Write your comment or answer...")}
                    className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddComment(disc.id)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    {bt("إرسال", "Send")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


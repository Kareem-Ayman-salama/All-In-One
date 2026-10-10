import React, { useState, useEffect, useRef } from "react";
import { apiService } from "../services/api";
import { useLanguage, useBilingualText } from "../contexts/LanguageContext";

/**
 * SmartVideoProgressTracker
 * Automatically saves student watch progress every 10 seconds, offers resume prompt,
 * and tracks genuine lesson completion (only when >=85% watched to prevent skipping).
 */
export function SmartVideoProgressTracker({
  contentId,
  roomId,
  courseId,
  totalDurationSeconds = 600,
  onProgressUpdate,
  children
}) {
  const { direction } = useLanguage();
  const bt = useBilingualText();
  const [lastPosition, setLastPosition] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const currentSecondsRef = useRef(0);

  useEffect(() => {
    if (!contentId) return;

    apiService
      .getVideoProgress(contentId)
      .then((res) => {
        if (res.lastPositionSeconds > 15 && !res.isCompleted) {
          setLastPosition(res.lastPositionSeconds);
          setShowResumeBanner(true);
        }
        setCompletionPercentage(res.completionPercentage || 0);
        setIsCompleted(res.isCompleted || false);
      })
      .catch((e) => console.error("Error fetching video progress:", e));

    const interval = setInterval(() => {
      if (currentSecondsRef.current > 5) {
        apiService
          .saveVideoProgress({
            contentId,
            roomId,
            courseId,
            watchedSeconds: currentSecondsRef.current,
            totalDurationSeconds,
            lastPositionSeconds: currentSecondsRef.current
          })
          .then((res) => {
            setCompletionPercentage(res.completionPercentage);
            setIsCompleted(res.isCompleted);
            if (onProgressUpdate) onProgressUpdate(res);
          })
          .catch(() => {});
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [contentId]);

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = Math.floor(sec % 60);
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  return (
    <div className="space-y-3" dir={direction}>
      {/* Resume Banner */}
      {showResumeBanner && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-blue-950/80 border border-blue-500/30 rounded-2xl text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span>⏱️</span>
            <span className="text-slate-300">
              {bt("لقد توقفت في المشاهدة السابقة عند الدقيقة ", "You previously stopped at ")}
              <strong className="text-white font-mono">{formatSeconds(lastPosition)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowResumeBanner(false);
                if (window.__ainVideoPlayerSeek) {
                  window.__ainVideoPlayerSeek(lastPosition);
                }
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-md transition-colors"
            >
              {bt("استئناف من هنا", "Resume Playback")}
            </button>
            <button
              onClick={() => setShowResumeBanner(false)}
              className="text-slate-400 hover:text-white px-2 py-1 transition-colors"
            >
              {bt("بدء من البداية", "Start Over")}
            </button>
          </div>
        </div>
      )}

      {/* Progress & Completion Pill */}
      <div className="flex items-center justify-between text-xs px-2">
        <div className="flex items-center gap-2">
          <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isCompleted ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="font-mono text-slate-400">
            {completionPercentage}% {bt("مكتمل", "completed")}
          </span>
        </div>

        {isCompleted ? (
          <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            {bt("✓ تم إكمال الدرس", "✓ Lesson Completed")}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">
            {bt("يُعتمد الدرس عند إكمال 85% من الفيديو", "Marked complete at 85% watched")}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}


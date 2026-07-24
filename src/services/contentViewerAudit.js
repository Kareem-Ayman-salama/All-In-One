export const CONTENT_VIEWER_EVENTS = {
  opened: "opened",
  closed: "closed",
  failed: "failed",
  screenshotWarning: "screenshot_warning",
  screenCaptureStarted: "screen_capture_started",
  screenCaptureStopped: "screen_capture_stopped",
  downloadBlocked: "download_blocked",
  watermarkRendered: "watermark_rendered"
};

export function viewerAuditPayload(event, details = {}) {
  if (!Object.values(CONTENT_VIEWER_EVENTS).includes(event)) {
    throw new Error(`Unsupported content viewer event: ${event}`);
  }
  return {
    event,
    viewerSessionId: details.viewerSessionId,
    page: details.page,
    positionSeconds: details.positionSeconds,
    message: details.message,
    result: details.result
  };
}

import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_API_KEY || "84586d32008758c518f3334b14119150";

if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === "development",

    // Enable Session Replay
    record_sessions_percent: 100,    // Record 100% of sessions (adjust in production)
    record_mask_text_selector: '',   // unmask all text elements
    record_block_selector: '',       // unmask images and videos
  });

  mixpanel.identify(localStorage.getItem("userId") || "unknown");

  trackEvent("Page Loaded");
}

/**
 * Tracks a Mixpanel event with optional properties.
 * Automatically attaches session replay ID if recording is active.
 */
export async function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  try {
    // Get the replay ID if a session recording is currently active
    const replayProps = await mixpanel.get_session_recording_properties();

    // Send the event with merged properties + replay ID (if available)
    mixpanel.track(eventName, {
      ...properties,
      ...replayProps,
    });
  } catch (err) {
    console.error("Failed to track event with replay ID", err);
    // Fallback: send event without replay ID
    mixpanel.track(eventName, properties);
  }
}

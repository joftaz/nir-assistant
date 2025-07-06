import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_API_KEY || "84586d32008758c518f3334b14119150";

if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === "development",
    autocapture: false
  });
}

mixpanel.identify(localStorage.getItem("userId"));

export function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  mixpanel.track(eventName, {
    ...properties,
  });
}
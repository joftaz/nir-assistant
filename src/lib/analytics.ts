import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_API_KEY || "";

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
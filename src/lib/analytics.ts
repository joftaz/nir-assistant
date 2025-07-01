import mixpanel from "mixpanel-browser";
import { v4 as uuidv4 } from "uuid";

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_API_KEY || "";

if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === "development",
  });
}

mixpanel.identify(localStorage.getItem("userId"));

export default mixpanel;

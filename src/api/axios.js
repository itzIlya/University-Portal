// src/api/axios.js
import axios from "axios";

function getCSRFCookie(name = "csrftoken") {
  return document.cookie
    .split("; ")
    .find(c => c.startsWith(name + "="))
    ?.split("=")[1];
}

/* ---------- Axios instance ---------- */
const api = axios.create({
  baseURL: "/api/",          // browser → 5179 → proxy → 8000
  withCredentials: true,     // => cookies both ways
  headers: { "Content-Type": "application/json" },
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

/* ---------- Make sure every unsafe request has a token ---------- */
let csrfReady;   // memorised promise so we fetch the cookie only once

function ensureCSRFCookie() {
  if (getCSRFCookie()) return Promise.resolve(); // already present
  if (!csrfReady) {
    csrfReady = api.get("ping/");  // harmless endpoint that just returns 200 OK
  }
  return csrfReady;
}

api.interceptors.request.use(async cfg => {
  const unsafe = !/^(get|head|options|trace)$/i.test(cfg.method || "");
  if (unsafe) {
    await ensureCSRFCookie();                // get cookie if missing
    cfg.headers["X-CSRFToken"] = getCSRFCookie(); // attach it manually
  }
  return cfg;
});

export default api;

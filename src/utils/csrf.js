export function getCSRFCookie(name = "csrftoken") {
    return document.cookie
      .split("; ")
      .find(c => c.startsWith(name + "="))
      ?.split("=")[1];
  }
  
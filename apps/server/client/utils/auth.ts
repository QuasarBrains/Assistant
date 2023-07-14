import jwtDecode from "jwt-decode";
import { api } from "./axios";

export const getLoginUrl = (currentURL: string, reason: string) => {
  const query = new URLSearchParams({
    redirectUrl: currentURL,
    reason: reason || "none",
  });
  return `/login?${query.toString()}`;
};

export const logout = async (reason?: string) => {
  try {
    const decodedToken = jwtDecode(localStorage.getItem("accessToken") || "");

    const id = (decodedToken as { id: string | number }).id;

    const currentUrl = window.location.href;

    if (!id) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      window.location.href = getLoginUrl(currentUrl, reason || "");
      return;
    }

    await api.post("/users/logout", {
      refreshToken: localStorage.getItem("refreshToken"),
    });

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    window.location.href = getLoginUrl(currentUrl, reason || "");
  } catch (err) {
    console.error(err);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    const currentUrl = window.location.href;
    window.location.href = getLoginUrl(currentUrl, reason || "");
  }
};

import { BASE_URL } from "@/app/constants/apiConstants";
import axios from "axios";

export const outsideAuthInstance = axios.create({
  baseURL: BASE_URL,
});

/* export const insideAuthInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,

  headers: {
    "X-CSRFToken": window.sessionStorage.getItem("csrfToken"),
  },
}); */

export const insideAuthInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: {
    "ngrok-skip-browser-warning": "69420",
  },
});

insideAuthInstance.interceptors.request.use(
  (config) => {
    const csrfToken = window.localStorage.getItem("csrfToken");
    config.headers["X-CSRFToken"] = csrfToken;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

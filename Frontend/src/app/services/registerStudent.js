import { outsideAuthInstance } from "@/lib/AxiosInstance";
import {
  FORGOT_PASSWORD,
  GET_COURSES_OUTSIDE_AUTH,
  REGISTER,
  RESET_PASSWORD,
  VERIFY_OTP,
} from "../constants/apiConstants";
import axios from "axios";
import { handleAPIError } from "@/utils/utils";

export const getCoursesOutsideAuth = () => {
  return axios.get(GET_COURSES_OUTSIDE_AUTH, {
    headers: {
      "ngrok-skip-browser-warning": "69420",
    },
  });
};

export const registerStudent = (body) => {
  return outsideAuthInstance.post(REGISTER, body).catch(handleAPIError);
};

export const resetPassword = (payload) => {
  return axios.post(RESET_PASSWORD, payload).catch(handleAPIError);
};

export const forgotPassword = (payload) => {
  return axios
    .post(FORGOT_PASSWORD, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const verifyOtp = (payload) => {
  return axios
    .post(VERIFY_OTP, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

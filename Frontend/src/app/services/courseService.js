import axios from "axios";
import { GET_COURSES_INSIDE_AUTH } from "../constants/apiConstants";
import { handleAPIError } from "@/utils/utils";

export const getCoursesInsideAuth = () => {
  return axios
    .get(GET_COURSES_INSIDE_AUTH, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

import axios from "axios";
import Cookies from 'js-cookie';
import {
  ADD_QUESTIONS,
  ADD_STUDENTS,
  APPROVE_REGISTERED_STUDENT,
  ASSIGN_FACULTY,
  BASE_URL,
  CREATE_QUESTION,
  CREATE_TEST,
  CREATE_USER,
  USER_BASE_URL,
  TEST_BASE_URL,
  DELETE_QUESTION,
  DOUBT_BASE,
  EDIT_QUESTION,
  FORGOT_PASSWORD,
  GET_CSRF_TOKEN,
  GET_DOUBTS_LIST,
  GET_QUESTION_DETAILS,
  GET_REGISTERED_STUDENTS,
  GET_ROLES,
  GET_STUDENTS_FOR_COURSE,
  GET_SUBJECT_ENTITIES,
  GET_TESTS_LIST,
  GET_TEST_DETAILS,
  GET_TEST_RESULTS,
  GET_USERS_BY_ROLE,
  LOGIN,
  VALIDATE_SESSION,
  LOGOUT,
  RESET_PASSWORD,
  SECTION_TIME_UP,
  TAKE_TEST,
  TEST_IN_PROGRESS,
  UPCOMING_OR_FREE_SUBSCRIPTION,
  COURSE_BASE_URL,
  GET_ASSIGNED_STUDENTS,
  GET_USER_DETAILS,
  CHANGE_PASSWORD,
  GET_SUBJECTS,
  MATERIAL_BASE_URL,
  SUGGESTIONS_BASE_URL,
  ISSUES_BASE_URL,
  GET_MULTIPLE_QUESTIONS,
  CONCERNS_BASE_URL,
  MEETINGS_BASE_URL,
  FEEDBACK_BASE_URL,
  GET_QUESTIONS_FOR_SECTION,
  NOTIFICATION_BASE_URL,
  CREATE_QUESTION_MULTIPLE,
  PRACTICE_BASE_URL,
  GET_DASHBOARD_STATS,
  GET_DASHBOARD_AREAS,
  GET_DASHBOARD_TEST_PER_DAY,
  student_count_by_course_BASE_URL,
  GET_USER_BY_ID
} from "../constants/apiConstants";
import { handleAPIError } from "@/utils/utils";


export const getUserById = (userId) => {
  return axios
    .get(`${GET_USER_BY_ID}`, {
      params: { user_id: userId },
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const updateUser = (userId, data) => {
  return axios
    .post(`${BASE_URL}/api/user/update-user/`, {
      ...data,
      user_id: userId,
    }, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
         "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        
      },
    })
    .catch(handleAPIError);
};



export const loginService = (payload) => {
  axios.defaults.withCredentials = true;
  axios.defaults.headers.common["X-CSRF-TOKEN"] = null;
  return axios
    .post(LOGIN, payload, {
      // credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Cookie: `csrftoken=${window.localStorage.getItem("csrfToken")}`,
      },
    })
    .catch(handleAPIError);
};

export const validateSession = () => {
  return axios.get(VALIDATE_SESSION, {
    withCredentials: true,
    headers: {
      "ngrok-skip-browser-warning": "69420",
    },
  });
};

export const getCsrfToken = () => {
  return axios
    .get(GET_CSRF_TOKEN, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const logoutService = (csrfToken) => {
  // const cookies = Cookies.get();
   console.log("window.localStorage.getItem",window.localStorage.getItem("csrfToken"));
  return axios
    .post(
      LOGOUT,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        },
      }
      
    )
    .catch(handleAPIError);
};

export const createUser = (payload) => {
  return axios
    .post(CREATE_USER, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const editUser = (id, payload) => {
  return axios
    .patch(`${USER_BASE_URL}${id}/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getRoles = () => {
  return axios
    .get(GET_ROLES, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getUsersByRole = (params) => {
  return axios
    .get(GET_USERS_BY_ROLE, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getSubjectQuestions = ({
  courseSubId,
  page = 1,
  description = null,
  params,
}) => {
  return axios
    .get(`${GET_SUBJECT_ENTITIES}/${courseSubId}/questions/`, {
      params: { page: page, description, ...params },
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getSubjectTopics = (
  courseSubId
  // page = 1,
  // description = null
) => {
  return axios
    .get(`${GET_SUBJECT_ENTITIES}/${courseSubId}/topics/`, {
      // params: { page: page, description },
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const createQuestionService = (payload) => {
  return axios
    .post(CREATE_QUESTION, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const createQuestionMultipleService = (payload) => {
  return axios
    .post(CREATE_QUESTION_MULTIPLE, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const editQuestionService = (id, payload) => {
  return axios
    .put(`${EDIT_QUESTION}/${id}/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const deleteQuestion = (id) => {
  return axios
    .patch(
      `${DELETE_QUESTION}${id}/deactivate/`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        },
      }
    )
    .catch(handleAPIError);
};

export const activateQuestion = (id) => {
  return axios
    .patch(
      `${CREATE_QUESTION}${id}/activate/`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        },
      }
    )
    .catch(handleAPIError);
};

export const deleteUser = (id) => {
  return axios
    .patch(
      `${USER_BASE_URL}${id}/deactivate/`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        },
      }
    )
    .catch(handleAPIError);
};

export const getRegisteredStudents = (page = 1,search = "") => {
  return axios
    .get(GET_REGISTERED_STUDENTS, {
      params: { page: page ,search:search},
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const approveStudent = (payload) => {
  return axios
    .post(APPROVE_REGISTERED_STUDENT, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getUpcomingOrFreeSubStudents = (page = 1,search = "") => {
  return axios
    .get(UPCOMING_OR_FREE_SUBSCRIPTION, {
      params: { page: page,search :search },
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getTestsList = (params) => {
  return axios
    .get(GET_TESTS_LIST, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getDashboardStats = (params) => {
  return axios
    .get(GET_DASHBOARD_STATS, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getAreas = (params) => {
  return axios
    .get(GET_DASHBOARD_AREAS, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getTestsPerDay = (params) => {
  return axios
    .get(GET_DASHBOARD_TEST_PER_DAY, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const createTest = (payload) => {
  return axios
    .post(CREATE_TEST, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const deleteTest = (id) => {
  return axios
    .patch(
      `${TEST_BASE_URL}${id}/deactivate/`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        },
      }
    )
    .catch(handleAPIError);
};

export const getTestDetails = (testId) => {
  return axios
    .get(`${GET_TEST_DETAILS}/${testId}/`, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const addQuestionsService = (testId, payload) => {
  return axios
    .post(`${ADD_QUESTIONS}/${testId}/add-questions/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const addStudentsService = (testId, payload) => {
  return axios
    .post(`${ADD_STUDENTS}/${testId}/students/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getStudentsForCourse = (courseId) => {
  return axios
    .get(`${GET_STUDENTS_FOR_COURSE}/${courseId}/students`, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getQuestionDetails = (questionId, params = {}) => {
  return axios.get(`${GET_QUESTION_DETAILS}/${questionId}/`, {
    params,  // ✅ send query params
    withCredentials: true,
    headers: {
      "ngrok-skip-browser-warning": "69420",
    },
  }).catch(handleAPIError);
};


export const getMultipleQuestions = (payload) => {
  return axios
    .post(GET_MULTIPLE_QUESTIONS, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const takeTestService = (testId, payload) => {
  return axios
    .post(`${TAKE_TEST}/${testId}/take-test/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getTestResult = (params) => {
  return axios
    .get(`${GET_TEST_RESULTS}`, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getTestInProgress = (testId, params) => {
  return axios
    .get(`${TEST_IN_PROGRESS}/${testId}/test-progress/`, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getQuestionsForSection = (testId, params) => {
  return axios
    .get(`${GET_QUESTIONS_FOR_SECTION}${testId}/section-questions/`, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const postOnSectionTimeUp = (testId, payload) => {
  return axios
    .post(`${SECTION_TIME_UP}/${testId}/skip-section/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const raiseDoubt = (payload) => {
  console.log("payload",payload)
  return axios
    .post(DOUBT_BASE, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getDoubtsList = (params) => {
  return axios
    .get(DOUBT_BASE, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const patchAssignFaculty = (id, payload) => {
  return axios
    .patch(`${DOUBT_BASE}${id}/assign_faculty/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const patchMarkResolve = (id, payload) => {
  return axios
    .patch(`${DOUBT_BASE}${id}/resolve_doubt/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const createCourse = (payload) => {
  return axios
    .post(COURSE_BASE_URL, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getCourseDetails = (courseId) => {
  return axios
    .get(`${COURSE_BASE_URL}${courseId}/`, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getUserDetails = (id) => {
  return axios
    .get(`${GET_USER_DETAILS}${id}`, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const editCourse = (id, payload) => {
  return axios
    .put(`${COURSE_BASE_URL}${id}/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const deleteCourse = (id) => {
  return axios
    .patch(
      `${COURSE_BASE_URL}${id}/deactivate/`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        },
      }
    )
    .catch(handleAPIError);
};

export const searchCourses = async (query) => {
  return axios.get(`${BASE_URL}/api/course/`, {
    params: { search: query },
  }, {
        withCredentials: true,
      });
};

export const getTestAssignedStudents = (id, page) => {
  return axios
    .get(`${GET_ASSIGNED_STUDENTS}${id}/assigned-students/`, {
      params: { page: page },
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getTestEligibleStudents = (id, params) => {
  return axios
    .get(`${TEST_BASE_URL}${id}/eligible-students/`, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const changePasswordService = (payload) => {
  return axios
    .post(`${CHANGE_PASSWORD}`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getSubjects = () => {
  return axios
    .get(GET_SUBJECTS, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getMaterialsList = (params) => {
  return axios
    .get(MATERIAL_BASE_URL, {
      params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const uploadMaterial = (formData) => {
  return axios
    .post(MATERIAL_BASE_URL, formData, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        "Content-Type": "multipart/form-data",
      },
    })
    .catch(handleAPIError);
};

export const getMaterialDetails = (id) => {
  return axios
    .get(`${MATERIAL_BASE_URL}${id}`, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const deleteMaterial = (id) => {
  return axios
    .patch(
      `${MATERIAL_BASE_URL}${id}/deactivate/`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        },
      }
    )
    .catch(handleAPIError);
};


export const getSuggestionsList = async (params = {}) => {
  return axios.get(`${BASE_URL}/api/suggestion/`, {
    params,
    withCredentials: true,
  });
};

export const approveSuggestion = (id) => {
  return axios
    .post(`${SUGGESTIONS_BASE_URL}${id}/approve/`, null, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const rejectSuggestion = (id) => {
  return axios
    .post(
      `${SUGGESTIONS_BASE_URL}${id}/reject/`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        },
      }
    )
    .catch(handleAPIError);
};

export const makeSuggestion = (payload) => {
  return axios
    .post(SUGGESTIONS_BASE_URL, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getSuggestionForQuestion = (question_id) => {
  return axios
    .get(`${SUGGESTIONS_BASE_URL}suggestion-for-question/`, {
      params: { question_id },
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getIssuesList = (params) => {
  return axios
    .get(ISSUES_BASE_URL, {
      params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const raiseIssue = (payload) => {
  return axios
    .post(ISSUES_BASE_URL, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const resolveIssue = (id, payload) => {
  return axios.patch(`${ISSUES_BASE_URL}${id}/resolve/`, payload, {
    withCredentials: true,
    headers: {
      "X-CSRFToken": window.localStorage.getItem("csrfToken"),
    },
  }).catch(handleAPIError);
};

export const getConcernsList = (params = {}) => {
  return axios
    .get(CONCERNS_BASE_URL, {
      params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const raiseConcern = (payload) => {
  return axios
    .post(CONCERNS_BASE_URL, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const resolveConcern = (id, payload) => {
  return axios
    .patch(`${CONCERNS_BASE_URL}${id}/resolve/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getMeetingsList = (params = {}) => {
  return axios
    .get(MEETINGS_BASE_URL, {
      params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const scheduleMeeting = (payload) => {
  return axios
    .post(`${MEETINGS_BASE_URL}schedule/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const approveMeeting = (id, payload) => {
  return axios
    .post(`${MEETINGS_BASE_URL}${id}/approve/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const markMeetingAsComplete = (id) => {
  return axios
    .post(
      `${MEETINGS_BASE_URL}${id}/mark-complete/`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        },
      }
    )
    .catch(handleAPIError);
};

export const raiseFeedback = (payload) => {
  return axios
    .post(FEEDBACK_BASE_URL, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getFeedbackList = (params) => {
  return axios
    .get(FEEDBACK_BASE_URL, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getPracticeTestQuestions = (course_subject_id, params) => {
  return axios
    .get(`${PRACTICE_BASE_URL}${course_subject_id}/`, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getNotificationList = () => {
  return axios
    .get(`${NOTIFICATION_BASE_URL}`, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getStudentCountByCourse = () => { 
  return axios
  .get(`${student_count_by_course_BASE_URL}`, {
    withCredentials: true,
    headers: {
      "ngrok-skip-browser-warning": "69420",
    },
  })
  .catch(handleAPIError);
  
  // Adjust the endpoint as per your setup
};

// export const getUnreadNotificationCount = () => {
//   return axios
//     .get(`${NOTIFICATION_BASE_URL}unread/`, {
//       withCredentials: true,
//       headers: {
//         "ngrok-skip-browser-warning": "69420",
//       },
//     })
//     .catch(handleAPIError);
// };

export const getUnreadNotificationCount = ({ startDate, endDate, filter } = {}) => {
  const params = {};

  if (filter) {
    params.filter = filter;
  } else if (startDate && endDate) {
    params.start_date = startDate;
    params.end_date = endDate;
  }

  return axios
    .get(`${NOTIFICATION_BASE_URL}unread/`, {
      params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const getNotificationsForCategory = (params) => {
  return axios
    .get(`${NOTIFICATION_BASE_URL}category/`, {
      params: params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const reassignExpiredTest = (test_submission_id) => {
  return axios
    .post(
      `${TEST_BASE_URL}${test_submission_id}/reassign-expired-test/`,
      {},
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": window.localStorage.getItem("csrfToken"),
        },
      }
    )
    .catch(handleAPIError);
};

export const getPracticeTests = (params) => {
  return axios
    .get(`${PRACTICE_BASE_URL}`, {
      params,
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const startPractice = (payload) => {
  return axios
    .post(`${PRACTICE_BASE_URL}start-practice/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const takePracticeTest = (practice_test_id, payload) => {
  return axios
    .post(`${PRACTICE_BASE_URL}${practice_test_id}/take-test/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const getPracticeResults = (practice_test_id) => {
  return axios
    .get(`${PRACTICE_BASE_URL}${practice_test_id}/results/`, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    })
    .catch(handleAPIError);
};

export const postTestFeedback = (payload) => {
  return axios
    .post(`${BASE_URL}/api/test-feedback/`, payload, {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    })
    .catch(handleAPIError);
};

export const updateMaterial = (id, formData) => {
  return axios.put(`${BASE_URL}/api/material/${id}/`, formData, {
    withCredentials: true,
    headers: {
      "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      "Content-Type": "multipart/form-data",
      "ngrok-skip-browser-warning": "69420",
    },
  });
};


export async function deleteTestAssignment(test_submission_id) {
  return await axios.delete(`${BASE_URL}/api/test/delete-assignment`, {
    withCredentials: true,
    params: { test_submission_id },
     headers: {
      "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      "Content-Type": "multipart/form-data",
      "ngrok-skip-browser-warning": "69420",
    },
  });
}

export const softDeactivateQuestion = (id) => {
  return axios.patch(
    `${BASE_URL}/api/question/${id}/soft-deactivate/`,
    {},
    {
      withCredentials: true,
      headers: {
        "X-CSRFToken": window.localStorage.getItem("csrfToken"),
      },
    }
  ).catch(handleAPIError);
};






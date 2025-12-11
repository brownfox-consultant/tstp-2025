export const BASE_URL = "http://localhost:8000" // "https://mathforusa.com";

export const LOGIN = `${BASE_URL}/api/user/login/`;
export const VALIDATE_SESSION = `${BASE_URL}/api/user/session_validate/`;
export const LOGOUT = `${BASE_URL}/api/user/logout/`;
export const REGISTER = `${BASE_URL}/api/student/register/`;
export const VERIFY_OTP = `${BASE_URL}/api/student/verify-otp/`;
export const RESET_PASSWORD = `${BASE_URL}/api/user/reset_password/`;
export const FORGOT_PASSWORD = `${BASE_URL}/api/user/forgot_password/`;
export const GET_COURSES_OUTSIDE_AUTH = `${BASE_URL}/api/course/list/`;
export const GET_COURSES_INSIDE_AUTH = `${BASE_URL}/api/course/`;
export const GET_CSRF_TOKEN = `${BASE_URL}/api/user/csrf/`;
export const CREATE_USER = `${BASE_URL}/api/user/`;
export const USER_BASE_URL = `${BASE_URL}/api/user/`;
export const GET_ROLES = `${BASE_URL}/api/user/roles/`;
export const GET_USERS_BY_ROLE = `${BASE_URL}/api/user/`;
export const GET_SUBJECT_ENTITIES = `${BASE_URL}/api/course`;
export const CREATE_QUESTION = `${BASE_URL}/api/question/`;
export const CREATE_QUESTION_MULTIPLE = `${BASE_URL}/api/question/create-multiple/`;
export const EDIT_QUESTION = `${BASE_URL}/api/question`;
export const DELETE_QUESTION = `${BASE_URL}/api/question/`;
export const GET_QUESTION_DETAILS = `${BASE_URL}/api/question`;
export const GET_MULTIPLE_QUESTIONS = `${BASE_URL}/api/question/details/`;
export const GET_REGISTERED_STUDENTS = `${BASE_URL}/api/student/registered/`;
export const APPROVE_REGISTERED_STUDENT = `${BASE_URL}/api/user/approve_student_subscription/`;
export const UPCOMING_OR_FREE_SUBSCRIPTION = `${BASE_URL}/api/user/upcoming-subscription-or-free/`;
export const GET_STUDENTS_FOR_COURSE = `${BASE_URL}/api/course`;
export const GET_TESTS_LIST = `${BASE_URL}/api/test/`;
export const TEST_BASE_URL = `${BASE_URL}/api/test/`;
export const CREATE_TEST = `${BASE_URL}/api/test/`;
export const TAKE_TEST = `${BASE_URL}/api/test`;
export const GET_TEST_RESULTS = `${BASE_URL}/api/result/details/`;
export const GET_TEST_DETAILS = `${BASE_URL}/api/test`;
export const ADD_QUESTIONS = `${BASE_URL}/api/test`;
export const GET_ASSIGNED_STUDENTS = `${BASE_URL}/api/test/`;
export const ADD_STUDENTS = `${BASE_URL}/api/test`;
export const GET_QUESTIONS_FOR_SECTION = `${BASE_URL}/api/test/`;
export const TEST_IN_PROGRESS = `${BASE_URL}/api/test`;
export const SECTION_TIME_UP = `${BASE_URL}/api/test`;
export const DOUBT_BASE = `${BASE_URL}/api/doubt/`;
export const GET_USER_DETAILS = `${BASE_URL}/api/user/`;
export const GET_SUBJECTS = `${BASE_URL}/api/subject/`;
// export const ASSIGN_FACULTY = `${BASE_URL}/api/doubt`;
// export const RESOLVE_DOUBT = `${BASE_URL}/api/doubt`;

//Course APIs
export const COURSE_BASE_URL = `${BASE_URL}/api/course/`;

//Material APIs
export const MATERIAL_BASE_URL = `${BASE_URL}/api/material/`;

//password
export const CHANGE_PASSWORD = `${BASE_URL}/api/user/change_password/`;

//suggestion
export const SUGGESTIONS_BASE_URL = `${BASE_URL}/api/suggestion/`;

export const ISSUES_BASE_URL = `${BASE_URL}/api/issue/`;

export const CONCERNS_BASE_URL = `${BASE_URL}/api/concern/`;

export const MEETINGS_BASE_URL = `${BASE_URL}/api/meeting/`;

export const FEEDBACK_BASE_URL = `${BASE_URL}/api/feedback/`;

export const NOTIFICATION_BASE_URL = `${BASE_URL}/api/notification/`;

export const student_count_by_course_BASE_URL = `${BASE_URL}/api/user/student-count-by-course/`;

export const PRACTICE_BASE_URL = `${BASE_URL}/api/practice/`;

//dashboard
export const GET_DASHBOARD_STATS = `${BASE_URL}/api/test/test-stats`;
export const GET_DASHBOARD_AREAS = `${BASE_URL}/api/test/user-areas`;
export const GET_DASHBOARD_TEST_PER_DAY = `${BASE_URL}/api/test/tests-per-day`;
export const GET_Courses = `${BASE_URL}/api/course/list/`;
export const GET_Students = `${BASE_URL}/api/user/students-list/`;
export const GET_USER_BY_ID = `${BASE_URL}/api/user/get-user-by-id`;


import { Tag, notification } from "antd";
import DOMPurify from "dompurify";

export function timeInHHMMSS(time) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  const timeRemainingInHHMMSS = `${hours}:${formatTimeToString(
    minutes
  )}:${formatTimeToString(seconds)}`;
  return timeRemainingInHHMMSS;
}

export function timeInMMSS(time) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  const timeRemainingInHHMMSS = `${formatTimeToString(
    minutes
  )}:${formatTimeToString(seconds)}`;
  return timeRemainingInHHMMSS;
}

export const handleAPIError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    // console.log(error.response.data);
    notification.error({
      message: (
        <p
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(error.response.data.detail, {
              USE_PROFILES: { html: true },
            }),
          }}
        ></p>
      ),
      // description: error.response.data.error.message,
    });
    // console.log(error.response.status);
    // console.log(error.response.headers);
    console.log(error.response);

    if (error.response.status == "403") {
      setTimeout(() => {
      window.location.href = "/login";
       window.localStorage.clear();
      }, [3000]);
    }
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error", error);
  }
  console.log("error status", error.status, error.message);

  return Promise.reject(error);
};

export function formatTimeToString(number) {
  return String(number).padStart(2, "0");
}

export const handleReduxAPIError = (error) => {
  if (error.message) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    // console.log(error.response.data);
    notification.error({
      message: (
        <p
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(error.message, {
              USE_PROFILES: { html: true },
            }),
          }}
        ></p>
      ),
      // description: error.response.data.error.message,
    });
    // console.log(error.response.status);
    // console.log(error.response.headers);
    console.log(error);

    if (error.status == "403") {
      setTimeout(() => {
       window.location.href = "/login";
        window.localStorage.clear();
      }, [3000]);
    }
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error", error);
  }
  console.log("error status", error.status, error.message);

  return Promise.reject(error);
};

export const difficultyTagsMap = {
  VERY_EASY: {
    label: "Very Easy",
    color: "green",
  },
  EASY: {
    label: "Easy",
    color: "blue",
  },
  MODERATE: {
    label: "Moderate",
    color: "green",
  },
  HARD: {
    label: "Hard",
    color: "purple",
  },
  VERY_HARD: {
    label: "Very Hard",
    color: "red",
  },
};

export const questionSubtypeMap = {
  SINGLE_CHOICE: "Single Choice",
  MULTI_CHOICE: "Multi Choice",
  FILL_IN_BLANKS: "Fill in the Blanks",
  READING_COMPREHENSION: "Reading Comprehension",
  SINGLE_ANSWER: "Single Answer",
  MULTI_ANSWER: "Multi Answer",
  RANGE_BASED_ANSWER: "Range Based Answer",
};

export const questionSubtypeFilters = Object.entries(questionSubtypeMap).map(([value, label]) => ({
  text: label,
  value,
}));


export const difficultyTags = [
  {
    value: "VERY_EASY",
    label: "Very Easy",
    color: "green",
  },
  {
    value: "EASY",
    label: "Easy",
    color: "blue",
  },
  {
    value: "MODERATE",
    label: "Moderate",
    color: "green",
  },
  {
    value: "HARD",
    label: "Hard",
    color: "purple",
  },
  {
    value: "VERY_HARD",
    label: "Very Hard",
    color: "red",
  },
];

export const testFormatTypeFilters = [
  { value: "DYNAMIC", text: "DYNAMIC" },
  { value: "LINEAR", text: "LINEAR" },
];

export const difficultyFilters = [
  {
    value: "VERY_EASY",
    text: "Very Easy",
  },
  {
    value: "EASY",
    text: "Easy",
  },
  {
    value: "MODERATE",
    text: "Moderate",
  },
  {
    value: "HARD",
    text: "Hard",
  },
  {
    value: "VERY_HARD",
    text: "Very Hard",
  },
];
export const questionTypeFilters = [
  { value: "GRIDIN", text: "Grid In" },
  { value: "MCQ", text: "MCQ" },
];

export const questionTypeMap = {
  GRIDIN: "Grid In",
  MCQ: "MCQ",
};

// export const questionSubTypeMap = {
//   SINGLE_CHOICE: "Single Choice",
//   MULTI_CHOICE: "Multi Choice",
//   READING_COMPREHENSION: "Reading Comprehension",
//   SINGLE_ANSWER: "Single Value Correct",
//   MULTI_ANSWER: "Multiple Value Correct",
//   RANGE_BASED_ANSWER: "Range Correct",
// };

export const showCalculatorOptionsMap = {
  true: "Yes",
  false: "No",
};

export const testTypeFilters = [
  {
    value: "FULL_LENGTH_TEST",
    text: "Full Length Test",
  },
  {
    value: "SELF_PRACTICE_TEST",
    text: "Practice Questions",
  },
];

export function convertSecondsToTime(seconds) {
  console.log("seconds",seconds)
  if (isNaN(seconds) || seconds < 0) {
    return "-";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  let result = `${minutes} min${minutes !== 1 ? "s" : ""}`;
  if (remainingSeconds > 0) {
    result += `, ${remainingSeconds} second${
      remainingSeconds !== 1 ? "s" : ""
    }`;
  }
  return new Date(Number(seconds) * 1000).toISOString().substring(11, 19);
}

export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export const alphatbetArray = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export const stringToOperatorMap = {
  gt: ">",
  lt: "<",
  lte: "<=",
  gte: ">=",
  eq: "=",
};

export const stringToOperatorInverseMap = {
  gt: "<",
  lt: ">",
  lte: ">=",
  gte: "<=",
  eq: "=",
};

export function convertOptionToFormState(optionObject) {
  let obj = {};
  const [exp1, exp2] = Object.entries(optionObject).sort((a, b) => a[1] - b[1]);
  obj["value1"] = exp1[1];
  obj["operator1"] = stringToOperatorInverseMap[exp1[0]];
  obj["value2"] = exp2[1];
  obj["operator2"] = stringToOperatorMap[exp2[0]];
  // Object.entries(optionObject).map(([key, value], index) => {
  //   obj[`value${index + 1}`] = value;
  //   obj[`operator${index + 1}`] = stringToOperatorInverseMap[key];
  // });

  return obj;
}

export function convertOptionToExpression(options) {
  let arr = [];
  for (let i = 0; i < options.length; i++) {
    const [key, value] = Object.entries(options[i])[0];
    console.log({ key, value });
    console.log("val", value, typeof value);
    if (typeof value === "string") {
      arr.push({
        variable: "ANS",
        value: value,
        operator: stringToOperatorMap[key],
      });
    }
  }

  return arr.length > 0 ? arr : null;
}

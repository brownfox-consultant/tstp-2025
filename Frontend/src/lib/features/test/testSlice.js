import { insideAuthInstance } from "@/lib/AxiosInstance";
import { handleReduxAPIError } from "@/utils/utils";
import { handleAPIError } from "@/utils/utils";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";
const initialState = {
  status: "idle",
  questionsStatus: "idle",
  error: null,
  name: "Practice Questions",
  username: "",
  instructions: `<p className="">
  The questions in this section address a number of important reading and writing skills. Each
  question includes one or more passages, which may include a table or graph. Read each passage
  and question carefully, and then choose the best answer to the question based on the passage(s).
  All questions in this section are multiple-choice with four answer choices. Each question has a
  single best answer. </p>`,
  testId: null,
  testType: null,
  testSubmissionId: null,
  courseSubject: null,
  sectionId: null,
  currentQuestionIndex: 0,
  questions: [],
  currentArraySectionIndex: 0,
  answerMap: {},
  isTimer: false,
  timeLeft: null,
  isTimeUp: false,
  isTestCompleted: false,
  isSectionCompleted: false,
  lastRecordedTime: null,
  showTime: true,
  isReviewPage: false,
  showStrikeThrough: false,
  sectionOrderItems: [],
  courseName: null,
  totalSections: 0,
  isTestRunning: false,
  breakTimer: 300,
};

export const fetchMultipleQuestionDetails = createAsyncThunk(
  "test/queDetails",
  async (QustionIds) => {
    // try {
    const response = await insideAuthInstance.post("/question/details/", {
      question_ids: QustionIds,
    });
    return response.data;
    // } catch (error) {
    //   handleAPIError(error);
    // }
  }
);

export const testInProgress = createAsyncThunk(
  "test/testInProgress",
  async ({ testId, test_submission_id, username }) => {
    // try {
    const response = await insideAuthInstance.get(
      `/test/${testId}/test-progress/`,
      {
        params: { test_submission_id: test_submission_id },
      }
    );

    return {
      data: response.data,
      testSubmissionId: test_submission_id,
      testId: testId,
      username: username,
    };
    // } catch (error) {
    //   handleAPIError(error);
    // }
  }
);

export const getQuestionForSection = createAsyncThunk(
  "test/getQuestionForSection",
  async ({ testId, test_submission_id }, thunkAPI) => {
    const testState = thunkAPI.getState().test;
    const { sectionOrderItems, currentArraySectionIndex } = testState;
    const params = {
      course_subject_id:
        sectionOrderItems[currentArraySectionIndex].course_subject,
      section_id: sectionOrderItems[currentArraySectionIndex].section_id,
      test_submission_id,
    };

    try {
      const response = await insideAuthInstance.get(
        `test/${testId}/section-questions/`,
        { params }
      );
      return thunkAPI.dispatch(fetchMultipleQuestionDetails(response.data));
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Something went wrong while loading questions.";
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);


export const saveAndMove = createAsyncThunk(
  "test/save-and-move",
  async ({ operation = "", questionIndex = null }, thunkAPI) => {
    const testState = thunkAPI.getState().test;
    const {
      testId,
      questions,
      currentQuestionIndex,
      answerMap,
      lastRecordedTime,
      testSubmissionId,
      sectionId,
      courseSubject,
      testType,
    } = testState;

    const questionId = questions[currentQuestionIndex].id;
    const question_type = questions[currentQuestionIndex].question_type;
    const isPractice = testType == "practice";

    const currentTime = Math.floor(new Date().getTime() / 1000);

    const selectedOptionIndices = Object.keys(
      answerMap[questionId].selected_options
    )
      .filter((key) => answerMap[questionId].selected_options[key] === 1)
      .map((key) => parseInt(key, 10));

    const strikedOptionIndices = Object.keys(
      answerMap[questionId].striked_options
    )
      .filter((key) => answerMap[questionId].striked_options[key] === 1)
      .map((key) => parseInt(key, 10));

    let payload = {
      answer: {
        [questionId]:
          question_type == "GRIDIN"
            ? [answerMap[questionId].gridinAnswer ?? ""]
            : selectedOptionIndices,
      },
      striked_options: { [questionId]: strikedOptionIndices }, // 👈 NEW FIELD
      is_marked_for_review: answerMap[questionId].is_marked_for_review,
      is_skipped:
        question_type == "GRIDIN"
          ? !answerMap[questionId].gridinAnswer
          : selectedOptionIndices.length === 0,
      time_taken: currentTime - lastRecordedTime,
    };

    let examPayload = {
      ...payload,
      test_submission_id: testSubmissionId,
      course_subject: courseSubject,
      section_id: sectionId,
    };

    const response = await insideAuthInstance.post(
      `${isPractice ? "practice" : "test"}/${testId}/take-test/`,
      isPractice ? payload : examPayload
    );

    return { operation, questionIndex, data: response.data };
  }
);


export const sectionComplete = createAsyncThunk(
  "test/section-complete",
  async ({ via }, thunkAPI) => {
    const testState = thunkAPI.getState().test;
    const { testType, testId, sectionId, testSubmissionId, courseSubject } =
      testState;

    if (testType == "practice") {
      return { isTestCompleted: true };
    } else {
      let payload = {
        test_submission_id: testSubmissionId,
        section_id: sectionId,
        course_subject_id: courseSubject,
      };
      // try {
      const response = await insideAuthInstance.post(
        `/test/${testId}/skip-section/`,
        payload
      );
      return { data: response.data, via: via };
      // } catch (error) {
      //   handleAPIError(error);
      // }
    }
  }
);


export const recordSelectionHistory = createAsyncThunk(
  "test/recordSelectionHistory",
  async ({ testId, testSubmissionId, questionId, selectedOptions, strikedOptions, actionType }, thunkAPI) => {
    try {
      const response = await insideAuthInstance.post(
        `${BASE_URL}/api/test/${testId}/selection-history/`,
        {
          test_submission_id: testSubmissionId,
          question_id: questionId,
          selected_options: selectedOptions,
          striked_options: strikedOptions,
          action_type: actionType,
        }
      );
      return response.data;
    } catch (error) {
      handleAPIError(error);
      return thunkAPI.rejectWithValue(error.response?.data || "Failed to record selection history");
    }
  }
);


const testSlice = createSlice({
  name: "test",
  initialState,
  reducers: {
    resetTestSlice: (state, action) => {
      return initialState;
    },
    createAnswerObject: (state, action) => {
      state.answerMap[action.payload] = {
        is_marked_for_review: false,
        isAnswered: false,
        selected_options: {},
        striked_options: {},
        gridinAnswer: "",
        selectionHistory: [],
      };
    },
    toggleShowTime: (state, action) => {
      state.showTime = action.payload;
    },
    toggleStrikeThrough: (state, action) => {
      state.showStrikeThrough = action.payload;
    },
    toggleMarkedForReview: (state, action) => {
      if (!state.answerMap) {
        state.answerMap = {};
      }
      if (state.answerMap[action.payload.questionId]) {
        state.answerMap[action.payload.questionId]["is_marked_for_review"] =
          action.payload.newValue;
      } else {
        state.answerMap[action.payload.questionId] = {
          is_marked_for_review: action.payload.newValue,
        };
      }
    },
    incrementQuestionIndex: (state) => {
      let totalQuestions = state.questions.length;
      if (state.currentQuestionIndex < totalQuestions - 1) {
        state.currentQuestionIndex++;
      }
    },
    decrementQuestionIndex: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
      }
    },
    goToQuestion: (state, action) => {
      let totalQuestions = state.questions.length;

      if (action.payload >= 0 && action.payload <= totalQuestions - 1) {
        state.currentQuestionIndex = action.payload;
      }
    },
    updateCurrentQuestionIndex: (state, action) => {
      state.currentQuestionIndex = action.payload;
    },
    setTestDetails: (state, action) => {
      state.testId = action.payload.testId;
      state.isTimer = action.payload.time > 0 ? true : false;
      state.timeLeft = action.payload.time;
      state.testSubmissionId = action.payload.testSubmissionId;
      state.testType = action.payload.testType;
    },
    strikeOption: (state, action) => {
      state.answerMap[action.payload.questionId].striked_options[
        action.payload.optionIndex
      ] = 1;
      state.answerMap[action.payload.questionId].selected_options[
        action.payload.optionIndex
      ] = 0;
    },
    unstrikeOption: (state, action) => {
      state.answerMap[action.payload.questionId].striked_options[
        action.payload.optionIndex
      ] = 0;
    },
    selectOption: (state, action) => {
      const { questionId, optionIndex, questionType } = action.payload;
      const currentTime = new Date().toISOString();
      if (action.payload.questionType == "MULTI_CHOICE") {
        state.answerMap[action.payload.questionId].selected_options[
          action.payload.optionIndex
        ] = 1;
      } else {
        state.answerMap[action.payload.questionId].selected_options = {
          [action.payload.optionIndex]: 1,
        };
      }
      state.answerMap[action.payload.questionId].striked_options[
        action.payload.optionIndex
      ] = 0;

      state.answerMap[questionId].selectionHistory.push({
    action: "select",
    option: optionIndex,
    timestamp: currentTime,
      });
      
    },
    unselectOption: (state, action) => {
      const { questionId, optionIndex, questionType } = action.payload;
      const currentTime = new Date().toISOString();
      
      if (action.payload.questionType == "MULTI_CHOICE") {
        state.answerMap[action.payload.questionId].selected_options[
          action.payload.optionIndex
        ] = 0;
      } else {
        state.answerMap[action.payload.questionId].selected_options = {};
      }
      state.answerMap[questionId].selectionHistory.push({
    action: "unselect",
    option: optionIndex,
    timestamp: currentTime,
  });
    },
    saveValue: (state, action) => {
      if (state.answerMap[action.payload.questionId]) {
        state.answerMap[action.payload.questionId]["gridinAnswer"] =
          action.payload.value;
      }
    },
    setIsReviewPage: (state, action) => {
      state.isReviewPage = action.payload;
    },
    setLastRecordedTime: (state, action) => {
      state.lastRecordedTime = Math.floor(new Date().getTime() / 1000);
    },
    setTimeAsUp: (state, action) => {
      state.isTimeUp = true;
    },
    setTestRunning: (state, action) => {
      state.isTestRunning = action.payload;
    },
    setTestAsCompleted: (state, action) => {
      state.isTestCompleted = true;
      state.isSectionCompleted = true;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(saveAndMove.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
      })

    

     .addCase(saveAndMove.fulfilled, (state, action) => {
  state.status = "idle";
  state.lastRecordedTime = Math.floor(new Date().getTime() / 1000);

  switch (action.payload.operation) {
    case "NEXT":
      let totalQuestions = state.questions.length;
      if (state.currentQuestionIndex < totalQuestions - 1) {
        state.currentQuestionIndex++;
      } else if (state.currentQuestionIndex == totalQuestions - 1) {
        state.isReviewPage = true;
      }
      break;

    case "PREV":
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
      }
      break;

    case "EXIT":
      // Mark test/section as completed on exit
      state.isSectionCompleted = true;
      state.isTestCompleted = true;
      break;

    default:
      let totalQuestionsDefault = state.questions.length;
      if (
        action.payload.questionIndex >= 0 &&
        action.payload.questionIndex <= totalQuestionsDefault - 1
      ) {
        state.currentQuestionIndex = action.payload.questionIndex;
      }
      state.isReviewPage = false;
      break;
  }
        // if (state.isTimeUp) {
        //   if(state.testType == 'practice')
        //     state.isTestCompleted = true;
        //   else{
        //     state.isSectionCompleted = true;
        //   }
        // }
})


       
      
      .addCase(saveAndMove.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
        handleReduxAPIError(action.error);
      })
      .addCase(fetchMultipleQuestionDetails.pending, (state) => {
        state.questionsStatus = "loading";
      })
      .addCase(fetchMultipleQuestionDetails.fulfilled, (state, action) => {
        state.questions = action.payload?.map((question) => ({
          id: question.id,
          description: question.description,
          reading_comprehension_passage: question.reading_comprehension_passage,
          directions: question.directions,
          question_type: question.question_type,
          question_subtype: question.question_subtype,
          options: question.options,
          show_calculator: question.show_calculator,
        }));
        state.questionsStatus = "idle";
      })
      .addCase(fetchMultipleQuestionDetails.rejected, (state, action) => {
        state.questionsStatus = "error";
        state.error = action.error.message || "Faced some issue";

        handleReduxAPIError(action.error);
      })
      .addCase(testInProgress.pending, (state) => {
        state.status = "loading";
      })
      .addCase(testInProgress.fulfilled, (state, action) => {
        const { data, testSubmissionId, testId, username } = action.payload;
        state.name = data.test_name;
        state.username = username;
        state.testType = "test";
        state.courseName = data.course_name;
        // state.name = data.test_name;

        state.testSubmissionId = Number(testSubmissionId);
        state.testId = Number(testId);
        state.questions = [];
        state.currentQuestionIndex = data.question_index;
        state.isSectionCompleted = false;
        state.isTestCompleted = false;
        state.answerMap = data.answer_map;
        state.currentArraySectionIndex =
          2 * Number(data.course_subject_index) + Number(data.section_index);

        state.sectionOrderItems = data.subject
          ?.map((subject) =>
            subject.sections.map((section) => ({
              subject_id: subject.id,
              course_subject: subject.course_subject,
              title: `${subject.name} - ${section.name}`,
              section_id: section.id,
              section_name: section.name,
              duration: section.duration,
              no_of_questions: section.no_of_questions,
            }))
          )
          .flat();
        state.status = "idle";
        state.isTimeUp = false;
        state.isReviewPage = false;

        const { currentArraySectionIndex, sectionOrderItems } = state;
        state.totalSections = sectionOrderItems.length;
        state.courseSubject =
          sectionOrderItems[currentArraySectionIndex].course_subject;
        state.sectionId =
          sectionOrderItems[currentArraySectionIndex].section_id;
        const remainingTimeForFirstSection =
          sectionOrderItems[currentArraySectionIndex].duration * 60;
        state.timeLeft =
          data.remaining_time == -1
            ? remainingTimeForFirstSection
            : data.remaining_time;
        state.isTimer = true;
        // state.timeLeft = 10;
      })
      .addCase(testInProgress.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message || "Faced some issue";
        console.log("Test in progress error", action);
        handleReduxAPIError(action.error);
      })
      .addCase(getQuestionForSection.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getQuestionForSection.fulfilled, (state, action) => {
        state.status = "idle";
      })
      // .addCase(getQuestionForSection.rejected, (state, action) => {
      //   state.status = "error";
      //   state.error = action.error.message || "Faced some issue";

      //   handleReduxAPIError(action.error);
      // })
      .addCase(getQuestionForSection.rejected, (state, action) => {
  state.status = "error";
  state.error = action.payload || action.error.message || "Faced some issue";
})

      .addCase(sectionComplete.pending, (state) => {
        state.status = "loading";
      })
      .addCase(sectionComplete.fulfilled, (state, action) => {
        const { currentArraySectionIndex, sectionOrderItems, testType } = state;
        console.log({
  idx: currentArraySectionIndex,
  total: state.totalSections,
  currCourse: sectionOrderItems?.[currentArraySectionIndex]?.course_subject,
  nextCourse: sectionOrderItems?.[currentArraySectionIndex + 1]?.course_subject,
  currTitle: sectionOrderItems?.[currentArraySectionIndex]?.title,
  nextTitle: sectionOrderItems?.[currentArraySectionIndex + 1]?.title
        });
        
           const currTitle = sectionOrderItems?.[currentArraySectionIndex]?.title || "";

  // Reset break
  state.breakTimer = 0;

  // if (currTitle.toLowerCase().includes("sec a")) {
  //   state.breakTimer = 600; // 10 min
  //       } 
        
        if (state.currentArraySectionIndex != state.totalSections - 1) {
          console.log("state.currentArraySectionIndex", state.currentArraySectionIndex);
          console.log("state.totalSections - 1",state.totalSections - 1)
          if (
            state.currentArraySectionIndex==1
          ) {
            state.breakTimer = 600;
          } 
          else {
            state.breakTimer = 0;
          }
        }

        // if (state.currentArraySectionIndex != state.totalSections - 1) {
        //   console.log("state.currentArraySectionIndex", state.currentArraySectionIndex);
        //   console.log("state.totalSections - 1",state.totalSections - 1)
        //   if (
        //     sectionOrderItems &&
        //     sectionOrderItems[currentArraySectionIndex] &&
        //     sectionOrderItems[currentArraySectionIndex].course_subject ==
        //       sectionOrderItems[currentArraySectionIndex + 1].course_subject
        //   ) {
        //     state.breakTimer = 10;
        //   } else {
        //     state.breakTimer = 600;
        //   }
        // }
        if (state.testType == "practice") {
          state.isTestCompleted = action.payload.isTestCompleted;
          state.isSectionCompleted = true;
        } else {
          // if (state.currentArraySectionIndex == state.totalSections - 1) {
          //   state.isTestCompleted = true;
          //   state.isSectionCompleted = true;
          // } else {
          //   state.currentArraySectionIndex = state.currentArraySectionIndex + 1;
          //   state.isSectionCompleted = true;
          // }
          if (
  state.currentArraySectionIndex == state.totalSections - 1 &&
  action.payload.via === "FINISH"
) {
    state.isTestCompleted = true;
    state.isSectionCompleted = true;
} else {
    state.currentArraySectionIndex += 1;
    state.isSectionCompleted = true;
}

          // if (action.payload.via == "TIMEUP") state.isTimeUp = true;
        }
        // state.questions = [];
        state.answerMap = {};

        state.status = "idle";
      })
      .addCase(sectionComplete.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message || "Faced some issue";
        handleReduxAPIError(action.error);
      });
  },
});

export const {
  toggleShowTime,
  createAnswerObject,
  incrementQuestionIndex,
  goToQuestion,
  decrementQuestionIndex,
  updateCurrentQuestionIndex,
  setTestDetails,
  toggleStrikeThrough,
  toggleMarkedForReview,
  selectOption,
  unselectOption,
  saveValue,
  strikeOption,
  unstrikeOption,
  setTimeAsUp,
  setLastRecordedTime,
  setTestAsCompleted,
  setIsReviewPage,
  resetTestSlice,
  setTestRunning,
} = testSlice.actions;
export default testSlice.reducer;

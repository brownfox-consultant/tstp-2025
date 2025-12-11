// data.js

export const COLORS = {
  ORANGE: '#F59403',
  LIGHT_ORANGE: '#FFD36A',
  DARK_BROWN: '#2E2725',
  MID_BROWN: '#8D5B30',
  BLUE: '#0071BC',
  CYAN: '#70D9E4',
};

export const subjectColors = {
  English: {
    practice: COLORS.ORANGE,
    accuracy: COLORS.BLUE,
  },
  Math: {
    practice: COLORS.LIGHT_ORANGE,
    accuracy: COLORS.CYAN,
  },
};

export const reportData = {
  fullLength: {
    subjects: [
      {
        name: "English",
        practicedQuestions: 65,
        totalQuestionsInDb: 100,
        rightQuestions: 78,
        totalAttempted: 90,
        totalTimeSeconds: 280,
      },
      {
        name: "Math",
        practicedQuestions: 35,
        totalQuestionsInDb: 100,
        rightQuestions: 52,
        totalAttempted: 80,
        totalTimeSeconds: 420,
      },
    ],
    dateWiseTime: [
      { dayLabel: "1", seconds: 120 },
      { dayLabel: "2", seconds: 0 },
      { dayLabel: "3", seconds: 300 },
      { dayLabel: "4", seconds: 480 },
      { dayLabel: "5", seconds: 60 },
      { dayLabel: "6", seconds: 0 },
      { dayLabel: "7", seconds: 900 },
      { dayLabel: "8", seconds: 240 },
      { dayLabel: "9", seconds: 120 },
      { dayLabel: "10", seconds: 60 },
      { dayLabel: "11", seconds: 0 },
      { dayLabel: "12", seconds: 420 },
      { dayLabel: "13", seconds: 180 },
      { dayLabel: "14", seconds: 600 },
    ],
  },

  practiceTest: {
    subjects: [
      {
        name: "English",
        practicedQuestions: 45,
        totalQuestionsInDb: 100,
        rightQuestions: 60,
        totalAttempted: 80,
        totalTimeSeconds: 210,
      },
      {
        name: "Math",
        practicedQuestions: 55,
        totalQuestionsInDb: 100,
        rightQuestions: 58,
        totalAttempted: 90,
        totalTimeSeconds: 360,
      },
    ],
    dateWiseTime: [
      { dayLabel: "1", seconds: 60 },
      { dayLabel: "2", seconds: 20 },
      { dayLabel: "3", seconds: 300 },
      { dayLabel: "4", seconds: 0 },
      { dayLabel: "5", seconds: 600 },
      { dayLabel: "6", seconds: 90 },
      { dayLabel: "7", seconds: 480 },
      { dayLabel: "8", seconds: 0 },
    ],
  },
};

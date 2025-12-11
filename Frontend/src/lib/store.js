import { configureStore } from "@reduxjs/toolkit";
import testReducer from "@/lib/features/test/testSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      test: testReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });
};

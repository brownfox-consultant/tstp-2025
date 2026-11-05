import React, { Suspense } from "react";
import Loading from "../loading";

function layout({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

export default layout;

import Loading from "@/app/loading";
import React, { Suspense } from "react";

function layout({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

export default layout;

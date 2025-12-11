import React, { Suspense } from "react";
import Loading from "./loading";

function layout({ children }) {
  return (
    <>
      <div className="login-register-bg min-h-screen"></div>
      <div className="login-register-component">
        {" "}
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </div>
    </>
  );
}
// flex items-center relative
export default layout;

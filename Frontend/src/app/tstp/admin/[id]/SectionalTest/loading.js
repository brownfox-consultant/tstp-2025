import { LoadingOutlined } from "@ant-design/icons";
import React from "react";

function Loading() {
  return (
    <div className="w-full flex justify-center align-middle h-full">
      <LoadingOutlined spin style={{ fontSize: "50px" }} />
    </div>
  );
}

export default Loading;

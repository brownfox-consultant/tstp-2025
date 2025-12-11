import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import React from "react";

function Loading() {
  return (
    <div className="w-full flex justify-center align-middle h-full mt-10">
      <Spin style={{ fontSize: "50px" }} />
    </div>
  );
}

export default Loading;

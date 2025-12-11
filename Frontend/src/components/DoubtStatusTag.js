import { Tag } from "antd";
import React from "react";

function DoubtStatusTag({ status }) {
  return status == "RAISED" ? (
    <Tag color="warning">{status}</Tag>
  ) : status == "RESOLVED" ? (
    <Tag color="success">{status}</Tag>
  ) : (
    status == "ASSIGNED_TO_FACULTY" && (
      <Tag color="processing">ASSIGNED TO FACULTY</Tag>
    )
  );
}

export default DoubtStatusTag;

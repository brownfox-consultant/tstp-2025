import { Tag } from "antd";
import React from "react";

function SuggestionStatusTag({ status }) {
  return status == "REJECTED" ? (
    <Tag color="error">{status}</Tag>
  ) : status == "APPROVED" ? (
    <Tag color="success">{status}</Tag>
  ) : (
    status == "IN_REVIEW" && <Tag color="processing">IN REVIEW</Tag>
  );
}

export default SuggestionStatusTag;

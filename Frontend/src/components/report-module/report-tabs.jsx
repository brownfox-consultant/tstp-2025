import { Segmented } from "antd";
import React from "react";

function ReportTabs({ options, selectedValue, handleChange }) {
  return (
    <div>
      <Segmented
        block
        options={options}
        value={selectedValue}
        onChange={(obj) => handleChange(obj)}
      />
    </div>
  );
}

export default ReportTabs;

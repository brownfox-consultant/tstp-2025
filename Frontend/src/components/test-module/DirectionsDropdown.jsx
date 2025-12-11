"use client";

import { DownOutlined } from "@ant-design/icons";
import { Button, Dropdown, Menu } from "antd";
import DOMPurify from "dompurify";
import React, { useState } from "react";
import { useSelector } from "react-redux";

function DirectionsDropdown({ dropdownVisible, setDropdownVisible }) {
  const instructions = useSelector((state) => state.test.instructions);
  const questions = useSelector((state) => state.test.questions);
  const currentQuestionIndex = useSelector(
    (state) => state.test.currentQuestionIndex
  );
  const question = questions[currentQuestionIndex];

  const textOverlay = (
    <Menu>
      <Menu.Item key="instructions">
        <div className="px-10 py-3 h-full flex flex-col gap-10 justify-between w-full">
          <div
  className="mt-3"
  dangerouslySetInnerHTML={{
  __html: question?.directions || instructions,
}}
></div>

          <div className="w-full text-end m-3">
            <Button
              type="primary"
              shape="round"
              onClick={() => setDropdownVisible(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="text-sm font-medium">
      {dropdownVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setDropdownVisible(false)}
        ></div>
      )}
      <Dropdown
        open={dropdownVisible}
        onOpenChange={(visible) => setDropdownVisible(visible)}
        arrow="bottomRight"
        placement="bottomLeft"
        overlayClassName="bg-white h-50 max-w-3xl"
       // menu={textOverlay} // <-- Use "menu" instead of "overlay"
        overlay={textOverlay}
        trigger={["click"]}
      >
        <p className="cursor-pointer">
          Directions <DownOutlined className="w-3 h-3 pt-5" />
        </p>
      </Dropdown>
    </div>
  );
}

export default DirectionsDropdown;

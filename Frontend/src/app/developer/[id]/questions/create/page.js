"use client";

import "react-quill/dist/quill.snow.css";
import React from "react";
import { LeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import QuestionForm from "@/components/QuestionForm";

function page() {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <div className="text-xl font-bold mb-5 flex align-middle">
        <LeftOutlined
          className="mr-2 text-base hover:font-extrabold cursor-pointer"
          onClick={() => handleBack()}
        />{" "}
        Create a new question
      </div>
      <QuestionForm />
    </>
  );
}

const CustomToolbar = () => (
  <div id="toolbar">
    {toobarFormats.map((classes) => {
      return (
        <span className="ql-formats">
          {classes.map((formatData) => {
            return formatData.options
              ? renderOptions(formatData)
              : renderSingle(formatData);
          })}
        </span>
      );
    })}
  </div>
);

const colors = ["red", "green", "blue", "orange", "violet"];

const toobarFormats = [
  [
    // {
    //   className: "ql-font",
    //   options: ["serif", "monospace"],
    // },
    {
      className: "ql-size",
      options: ["small", "large", "huge"],
    },
  ],
  [
    { className: "ql-bold" },
    { className: "ql-italic" },
    { className: "ql-underline" },
  ],
  [
    {
      className: "ql-color",
      options: colors,
    },
    {
      className: "ql-background",
      options: colors,
    },
  ],
  [
    {
      className: "ql-script",
      value: "sub",
    },
    {
      className: "ql-script",
      value: "super",
    },
  ],
  [
    {
      className: "ql-blockquote",
    },
  ],
  [
    {
      className: "ql-list",
      value: "ordered",
    },
    {
      className: "ql-list",
      value: "bullet",
    },
  ],
  [
    {
      className: "ql-align",
      options: ["right", "center", "justify"],
    },
  ],
  [
    { className: "ql-link" },
    { className: "ql-image" },
    { className: "ql-formula" },
  ],
];

const formats = [
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "color",
  "background",
  "script",
  "header",
  "blockquote",
  "indent",
  "list",
  "align",
  "link",
  "image",
  "formula",
];

const modules = {
  toolbar: {
    container: "#toolbar",
  },
};

const renderOptions = (formatData) => {
  const { className, options } = formatData;
  return (
    <select className={className}>
      <option selected="selected"></option>
      {options.map((value) => {
        return <option value={value}></option>;
      })}
    </select>
  );
};

const renderSingle = (formatData) => {
  const { className, value } = formatData;
  return <button className={className} value={value}></button>;
};

export default page;

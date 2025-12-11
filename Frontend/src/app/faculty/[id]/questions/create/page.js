"use client";

import { useForm } from "antd/es/form/Form";
import "react-quill/dist/quill.snow.css";
import React, { useEffect, useState } from "react";
import { LeftOutlined } from "@ant-design/icons";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { createQuestionService } from "@/app/services/authService";
import { useRouter } from "next/navigation";
import QuestionForm from "@/components/QuestionForm";

function page() {
  const [form] = useForm();
  const [question, setQuestion] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const router = useRouter();

  const toolbarOptions = {
    toolbar: [
      [{ font: [] }],
      [{ header: [1, 2, 3] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }, { align: [] }],
      ["link", "image", "formula"],
    ],
  };

  useEffect(() => {
    getCoursesInsideAuth()
      .then((res) => {
        setCourses(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (courses && courses.length > 0) {
      setSubjectOptions(
        courses
          .find((course) => course.name == selectedCourse)
          ?.subjects.map((subject) => {
            return {
              value: subject.course_subject_id,
              label: subject.name,
            };
          })
      );
    }
  }, [courses, selectedCourse]);

  const onSubmit = (values) => {
    createQuestionService({ ...values, description: question })
      .then((res) => {
        router.back();
      })
      .catch((err) => console.log("err2", err));
  };

  const handleBack = () => {
    form.resetFields();
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

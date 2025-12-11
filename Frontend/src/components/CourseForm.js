import React, { useEffect, useState, useRef } from "react";
import {
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Radio,
  Dropdown,
  notification,
} from "antd";
import {
  createCourse,
  editCourse,
  getSubjects,
} from "@/app/services/authService";
import { useParams, useRouter } from "next/navigation";
import CustomSelect from "./CustomSelect";
import deleteIcon from "../../public/icons/trash-orange.svg";
import simpledeleteIcon from "../../public/icons/trash.svg";
import plusIcon from "../../public/icons/plus-circle.svg";
import Image from "next/image";

function CourseForm({ courseData = {}, isEdit = false }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const { id, courseId } = useParams();
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [addSubjectCount, setAddSubjectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState("add_new");
  const [sectionCount, setSectionCount] = useState(0);
  const subjectListRef = useRef();
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    getSubjects()
      .then((res) => {
        setSubjectOptions(res.data.map(({ name }) => name));
      })
      .catch((err) => console.log("err", err));
    if (isEdit) {
      setShowSubjectForm(true);
    }
  }, []);

  useEffect(() => {
    if (isSuccess) {
      openNotification();
    }
  }, [isSuccess]);


  const handleDeleteSubject = (removeFn, fieldName) => {
  Modal.confirm({
    title: "Are you sure you want to delete this subject?",
    content:
      "Deleting this subject will remove all related questions, tests, and results permanently.",
    okText: "Yes, Delete",
    okType: "danger",
    cancelText: "Cancel",
    onOk() {
      removeFn(fieldName);
      notification.success({
        message: "Deleted",
        description: "Subject and its related data have been deleted.",
      });
    },
  });
};

  const openNotification = () => {
    notification.success({
      message: "Success",
      description: "Course created successfully",
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      placement: "topRight",
      style: {
        fontSize: "16px",
        borderRadius: "8px",
        padding: "10px 20px",
      },
    });
  };

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const onFinish = (values) => {
  console.log("Came Here", values);

  // ✅ Manual validation: check each subject has at least one section
  const hasEmptySections = (values.subjects || []).some((subject, index) => {
    if (!subject.sections || subject.sections.length === 0) {
      notification.error({
        message: `Validation Error`,
        description: `Subject ${index + 1}: Section is required.`,
        placement: "topRight",
      });
      return true;
    }
    return false;
  });

  if (hasEmptySections) {
    return; // ❌ Stop if validation fails
  }

  setLoading(true);

  const request = isEdit ? editCourse(courseId, values) : createCourse(values);

  request
    .then(({ data }) => {
      Modal.success({
        title: data.detail,
        onOk: () => router.back(),
      });
      notification.success({
        message: "Success",
        description: data.detail,
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      });
    })
    .catch((err) => {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.detail ||
        "Something went wrong";
      notification.error({
        message: "Error",
        description: msg,
        placement: "topRight",
      });
      console.log("err", err);
    })
    .finally(() => setLoading(false));
};


  const onFieldsChange = (_, allFields) => {
    console.log("Form values:", allFields);
    const isFormValid = allFields.every((field) => {
      if (!field.value || field.errors.length > 0) {
        return false;
      } else {
        console.log("ERROR", field.error);
      }
      return true;
    });

    //setIsSubmitDisabled(!isFormValid);
  };

  const handleAddSubjectClick = () => {
    setShowSubjectForm(true);
    const subjectsList = form.getFieldValue("subjects") || [];
    subjectsList.push({}); // Push a new empty object
    form.setFieldsValue({ subjects: subjectsList });
    setAddSubjectCount(addSubjectCount + 1);
  };

  const handleShowSectionClick = () => {
    setShowSection(true);
  };

  return (
    <div className="h-[78vh] border border-gray-300 mt-8 rounded-lg">
      <Form
        form={form}
        name="course_form"
        autoComplete="off"
        initialValues={courseData}
        onFinish={onFinish}
        className="h-full flex flex-col"
      >
        <div className="flex h-full">
          <div className="w-1/2 flex p-6 border-r border-gray-300 relative">
            <div className="flex flex-col w-full">
              <Form.Item
                label={<div className="">Course Name</div>}
                wrapperCol={{
                  span: 8,
                }}
                name="name"
                labelAlign="left"
                required
              >
                <Input placeholder="Course Name"></Input>
              </Form.Item>
              <div className="flex items-center justify-between mt-4">
                <h3 className="text-left text-lg font-bold">Add Subject</h3>
                {showSubjectForm ? (
                  <div
                    className="flex items-center cursor-pointer"
                    /* onClick={() => add()} */
                    onClick={handleAddSubjectClick}
                  >
                    <Image
                      src={plusIcon}
                      alt="Add Subject"
                      width={20} // Adjust the size as per your need
                      height={20}
                    />
                    <span
                      className="ml-2 font-semibold"
                      style={{ color: "#f59403" }}
                    >
                      Add Subject
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            {showSubjectForm && (
              <Form.List name="subjects">
                {(fields, { remove }) => (
                  <div className="absolute left-5 right-5 mt-32">
                    {fields.map((field) => (
                      <div
                        key={field.key}
                        className="w-full border border-orange-300 bg-orange-50 text-orange-500 p-4 rounded-lg mb-2 group"
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {`Subject ${field.name + 1}`}

                        <Image
  className="cursor-pointer hidden group-hover:block"
  src={deleteIcon}
  alt="delete"
  width={20}
  height={20}
  onClick={() => handleDeleteSubject(remove, field.name)} // confirmation before delete
/>

                      </div>
                    ))}
                  </div>
                )}
              </Form.List>
            )}

            {!showSubjectForm && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button type="dashed" onClick={handleAddSubjectClick}>
                  + Add Subject
                </Button>
              </div>
            )}
          </div>

          <div
            className="w-1/2 flex overflow-y-auto h-full m-2"
            style={{ maxHeight: "calc(87vh - 100px)", overflowY: "auto" }}
          >
            {showSubjectForm && (
              <Form.Item required className="w-full">
                <Form.List name="subjects" ref={subjectListRef}>
                  {(fields, { add, remove }) => (
                    <Row gutter={8} className="w-full">
                      {fields.map((field) => (
                        <Col className="mt-3 w-full" key={field.key}>
                          <h3 className="font-semibold text-xl mb-2">
                            Subject {field.name + 1}
                          </h3>
                          <Card
                            hoverable
                            size="small"
                            className="mx-2 bg-gray-50 rounded-lg m-4"
                            /* extra={
                              <CloseOutlined
                                onClick={() => {
                                  remove(field.name);
                                  setAddSubjectCount(addSubjectCount - 1);
                                }}
                              />
                            } */
                          >
                            <Row gutter={16}>
                              <Col span={24}>
                                <Form.Item
                                  label={
                                    <p
                                      style={{
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        color: "#344054",
                                      }}
                                    >
                                      Subject name
                                    </p>
                                  }
                                  //label="Subject Name"
                                  required
                                  labelCol={{ span: 24 }}
                                  wrapperCol={{ span: 24 }}
                                  labelStyle={{
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    color: "#344054",
                                  }}
                                >
                                  <Radio.Group
                                    onChange={handleOptionChange}
                                    value={selectedOption}
                                    className="flex justify-between w-full"
                                  >
                                    <div
                                      className={`flex-1 border border-gray-300 rounded-md p-2 mr-2 ${
                                        selectedOption === "select_existing"
                                          ? "bg-orange-50 border-orange-300"
                                          : ""
                                      }`}
                                    >
                                      <Radio
                                        value="select_existing"
                                        className={`w-full text-center ${
                                          selectedOption === "select_existing"
                                            ? "text-orange-500"
                                            : ""
                                        }`}
                                      >
                                        <p
                                          style={{
                                            fontSize: "16px",
                                            fontWeight: 500,
                                            color: "#344054",
                                          }}
                                        >
                                          Select from existing
                                        </p>
                                      </Radio>
                                    </div>
                                    <div
                                      className={`flex-1 border border-gray-300 rounded-md p-2 ${
                                        selectedOption === "add_new"
                                          ? "bg-orange-50 text-orange-500 border-orange-300"
                                          : ""
                                      }`}
                                    >
                                      <Radio
                                        value="add_new"
                                        className={`w-full text-center ${
                                          selectedOption === "add_new"
                                            ? "text-orange-500"
                                            : ""
                                        }`}
                                      >
                                        <p
                                          style={{
                                            fontSize: "16px",
                                            fontWeight: 500,
                                            color:
                                              selectedOption === "add_new"
                                                ? "#f59403"
                                                : "#344054",
                                          }}
                                        >
                                          Add new
                                        </p>
                                      </Radio>
                                    </div>
                                  </Radio.Group>
                                </Form.Item>

                                {selectedOption === "select_existing" ? (
                                  <Form.Item
                                    name={[field.name, "name"]} // Keep the name consistent
                                    required
                                  >
                                    <CustomSelect
                                      fieldName="Subject"
                                      options={subjectOptions}
                                      style={{
                                        width: "100%",
                                        marginBottom: "6px",
                                      }}
                                      selectStyle={{
                                        fontSize: "18px", // Font size
                                        fontWeight: 400, // Font weight
                                      }}
                                    />
                                  </Form.Item>
                                ) : (
                                  <Form.Item
                                    name={[field.name, "name"]} // Use the same name for new subjects
                                    required
                                    rules={[
                                      {
                                        required: true,
                                        message: "Please enter a new subject",
                                      },
                                    ]}
                                  >
                                    <Input style={{ width: "100%" }} />
                                  </Form.Item>
                                )}

                                <Row gutter={16}>
                                  <Col span={24} md={8}>
                                    <div
                                      className="label"
                                      style={{
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        color: "#344054",
                                      }}
                                    >
                                      Marks on Correct
                                    </div>
                                  </Col>
                                  <Col span={24} md={8}>
                                    <div
                                      className="label"
                                      style={{
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        color: "#344054",
                                      }}
                                    >
                                      Marks on Incorrect
                                    </div>
                                  </Col>
                                  <Col span={24} md={8}>
                                    <div
                                      className="label"
                                      style={{
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        color: "#344054",
                                      }}
                                    >
                                      Order
                                    </div>
                                  </Col>
                                </Row>
                                <Row gutter={16}>
                                  <Col span={24} md={8}>
                                    <Form.Item
                                      wrapperCol={{ span: 24 }}
                                      className="w-full"
                                      required
                                      name={[
                                        field.name,
                                        "correct_answer_marks",
                                      ]}
                                    >
                                      <InputNumber
                                        min={0}
                                        className="input-number w-full"
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={24} md={8}>
                                    <Form.Item
                                      wrapperCol={{ span: 24 }}
                                      className="w-full"
                                      required
                                      name={[
                                        field.name,
                                        "incorrect_answer_marks",
                                      ]}
                                    >
                                      <InputNumber
                                        min={0}
                                        className="input-number w-full"
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={24} md={8}>
                                    <Form.Item
                                      wrapperCol={{ span: 24 }}
                                      className="w-full"
                                      required
                                      name={[field.name, "order"]}
                                    >
                                      <InputNumber
                                        min={1}
                                        className="input-number w-full"
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </Col>
                            </Row>
                          </Card>
                          <Form.List name={[field.name, "sections"]}>
                            {(subFields, subOpt) => (
                              <>
                                {/* Conditional Button rendering */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <h3 className="font-semibold text-xl mt-2 mb-2">
                                    Sections
                                  </h3>

                                  {/* Render "Add Section" next to the header only if subFields.length > 0 */}
                                  {subFields.length > 0 && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Image
                                        src={plusIcon}
                                        alt="Add section"
                                        width={20}
                                        height={20}
                                        onClick={() => subOpt.add()} // Add section on click
                                      />
                                      <span
                                        className="ml-1 font-semibold mr-2"
                                        style={{
                                          color: "#f59403",
                                          cursor: "pointer",
                                        }}
                                        onClick={() => subOpt.add()} // Add section on click
                                      >
                                        Add section
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <Card
                                  hoverable
                                  size="small"
                                  className="mx-2 bg-gray-50 rounded-lg m-4 mt-2"
                                  style={{ position: "relative" }}
                                >
                                  <Row gutter={16} className="w-full">
                                    <Col span={24}>
                                      <Row className="justify-center h-full w-full">
                                        {subFields.length === 0 ? (
                                          <Col className="w-full text-center">
                                            <Button
                                              type="dashed"
                                              onClick={() => subOpt.add()}
                                            >
                                              + Add Section
                                            </Button>
                                          </Col>
                                        ) : (
                                          subFields.map((subField, index) => (
                                            <Col
                                              className="w-full rounded-md p-2 mt-2"
                                              key={subField.key}
                                              style={{ position: "relative" }}
                                            >
                                              {/* Section content */}
                                              <div
                                                style={{
                                                  display: "flex",
                                                  justifyContent:
                                                    "space-between",
                                                  alignItems: "center",
                                                  marginBottom: "8px",
                                                }}
                                              >
                                                <span
                                                  style={{ fontSize: "16px" }}
                                                >
                                                  Section Name
                                                </span>

                                                <div
                                                  style={{ cursor: "pointer" }}
                                                  onClick={() =>
                                                    subOpt.remove(subField.name)
                                                  }
                                                >
                                                  <Image
                                                    src={simpledeleteIcon}
                                                    alt="Delete"
                                                    width={20}
                                                    height={20}
                                                  />
                                                </div>
                                              </div>

                                              <Form.Item
                                                name={[subField.name, "name"]}
                                                required
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                className="w-full"
                                              >
                                                <Input
                                                  style={{ width: "100%" }}
                                                  placeholder="Name of Section"
                                                />
                                              </Form.Item>

                                              {/* Questions and Time Limit */}
                                              <Row gutter={32} className="mb-2">
                                                <Col span={24} md={12}>
                                                  <div className="label">
                                                    No. of Questions
                                                  </div>
                                                </Col>
                                                <Col span={24} md={12}>
                                                  <div className="label">
                                                    Time Limit
                                                  </div>
                                                </Col>
                                              </Row>
                                              <Row gutter={16}>
                                                <Col span={12}>
                                                  <Form.Item
                                                    name={[
                                                      subField.name,
                                                      "no_of_questions",
                                                    ]}
                                                    className="w-full"
                                                    required
                                                  >
                                                    <InputNumber
                                                      style={{ width: "100%" }}
                                                      placeholder="No. of Questions"
                                                    />
                                                  </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                  <Form.Item
                                                    name={[
                                                      subField.name,
                                                      "time_limit",
                                                    ]}
                                                    className="w-full"
                                                    required
                                                  >
                                                    <InputNumber
                                                      style={{ width: "100%" }}
                                                      placeholder="Time Limit"
                                                    />
                                                  </Form.Item>
                                                </Col>
                                              </Row>
                                            </Col>
                                          ))
                                        )}
                                      </Row>
                                    </Col>
                                  </Row>
                                </Card>
                              </>
                            )}
                          </Form.List>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Form.List>
              </Form.Item>
            )}
          </div>
        </div>
      </Form>

      {/* Submit Button */}
      <div className="flex justify-end p-3">
        <Button type="primary" loading={loading} onClick={() => form.submit()}>
          {isEdit ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default CourseForm;

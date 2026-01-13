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
        // notification.success({
        //   message: "Success",
        //   description: data.detail,
        //   icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        // });
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mt-6 h-[calc(90vh-100px)]">
      <Form
        form={form}
        name="course_form"
        autoComplete="off"
        initialValues={courseData}
        onFinish={onFinish}
        className="h-full flex flex-col"
      >
        <div className="flex h-full">
          {/* Left Side - Configuration */}
          <div className="w-1/3 flex flex-col p-6 border-r border-gray-100 bg-gray-50/50 relative">
            <div className="flex flex-col w-full">
              <Form.Item
                label={<div className="">Course Name</div>}
                wrapperCol={{
                  span: 8,
                }}
                name="name"
                labelAlign="left"
                rules={[
                  {
                    required: true,
                    message: "Required",
                  },
                ]}
              >
                <Input placeholder="Course Name"></Input>
              </Form.Item>
              <div className="flex items-center justify-between mt-4">
                <h3 className="text-left text-lg font-bold text-gray-800">Subjects</h3>
                {showSubjectForm ? (
                  <div
                    className="flex items-center cursor-pointer hover:bg-orange-50 px-3 py-1.5 rounded-full transition-all duration-200"
                    /* onClick={() => add()} */
                    onClick={handleAddSubjectClick}
                  >
                    <PlusOutlined className="text-[#F59405] mr-2" />
                    <span
                      className="font-semibold text-[#F59405]"
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
                  <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-3">
                    {fields.map((field) => (
                      <div
                        key={field.key}
                        className="w-full bg-white border border-gray-200 hover:border-[#F59405] hover:shadow-md p-4 rounded-xl group transition-all duration-200"
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                       <span className="font-semibold text-gray-700 group-hover:text-[#F59405] transition-colors">
                          {`Subject ${field.name + 1}`}
                       </span>

                        <DeleteOutlined 
                          className="cursor-pointer text-gray-400 hover:text-red-500 text-lg opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => handleDeleteSubject(remove, field.name)}
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

          {/* Right Side - Subject Details */}
          <div
            className="w-2/3 flex overflow-y-auto h-full p-6"
            style={{ maxHeight: "calc(90vh - 100px)", overflowY: "auto" }}
          >
            {showSubjectForm && (
              <Form.Item rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]} className="w-full">
                <Form.List name="subjects" ref={subjectListRef}>
                  {(fields, { add, remove }) => (
                    <Row gutter={8} className="w-full">
                      {fields.map((field) => (
                        <Col className="mt-3 w-full" key={field.key}>
                          <h3 className="font-semibold text-xl mb-2">
                            Subject {field.name + 1}
                          </h3>
                          <Card
                            hoverable={false}
                            bordered={false}
                            size="small"
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-6"
                          >
                            <Row gutter={16}>
                              <Col span={24}>
                                  <Form.Item
                                    label={<span className="text-sm font-semibold text-gray-700">Subject Type</span>}
                                    rules={[{ required: true, message: "Required" }]}
                                    labelCol={{ span: 24 }}
                                    wrapperCol={{ span: 24 }}
                                    className="mb-4"
                                  >
                                    <Radio.Group
                                      onChange={handleOptionChange}
                                      value={selectedOption}
                                      className="flex w-full gap-4"
                                    >
                                      <div
                                        className={`flex-1 border rounded-xl p-3 cursor-pointer text-center transition-all ${
                                          selectedOption === "select_existing"
                                          ? "bg-orange-50 border-[#F59405] text-[#F59405]"
                                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                                        }`}
                                      >
                                        <Radio value="select_existing" className="w-full text-center">
                                          <span className="font-medium text-base">Select from existing</span>
                                        </Radio>
                                      </div>
                                      
                                      <div
                                        className={`flex-1 border rounded-xl p-3 cursor-pointer text-center transition-all ${
                                          selectedOption === "add_new"
                                          ? "bg-orange-50 border-[#F59405] text-[#F59405]"
                                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                                        }`}
                                      >
                                        <Radio value="add_new" className="w-full text-center">
                                          <span className="font-medium text-base">Add new</span>
                                        </Radio>
                                      </div>
                                    </Radio.Group>
                                  </Form.Item>

                                {selectedOption === "select_existing" ? (
                                  <Form.Item
                                    name={[field.name, "name"]} // Keep the name consistent
                                    rules={[
                                      {
                                        required: true,
                                        message: "Required",
                                      },
                                    ]}
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

                                <Row gutter={16} className="mt-4">
                                  <Col span={24} md={8}>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Marks on Correct</label>
                                  </Col>
                                  <Col span={24} md={8}>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Marks on Incorrect</label>
                                  </Col>
                                  <Col span={24} md={8}>
                                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Order</label>
                                  </Col>
                                </Row>
                                <Row gutter={16}>
                                  <Col span={24} md={8}>
                                    <Form.Item
                                      wrapperCol={{ span: 24 }}
                                      className="w-full"
                                      rules={[
                                        {
                                          required: true,
                                          message: "Required",
                                        },
                                      ]}
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
                                      rules={[
                                        {
                                          required: true,
                                          message: "Required",
                                        },
                                      ]}
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
                                      rules={[
                                        {
                                          required: true,
                                          message: "Required",
                                        },
                                      ]}
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
                                      className="flex items-center cursor-pointer hover:bg-orange-50 px-3 py-1 rounded-full transition-all"
                                      onClick={() => subOpt.add()}
                                    >
                                      <PlusOutlined className="text-[#F59405] mr-1" />
                                      <span className="font-semibold text-[#F59405]">Add section</span>
                                    </div>
                                  )}
                                </div>

                                <Card
                                  hoverable={false}
                                  bordered={false}
                                  size="small"
                                  className="bg-gray-50 rounded-xl border border-gray-200 p-2 mt-4"
                                  style={{ position: "relative" }}
                                >
                                  <Row gutter={16} className="w-full">
                                    <Col span={24}>
                                      <Row className="justify-center h-full w-full">
                                        {subFields.length === 0 ? (
                                          <Col className="w-full text-center py-4">
                                            <Button
                                              type="dashed"
                                              onClick={() => subOpt.add()}
                                              className="w-full h-12 border-2 border-dashed border-gray-300 hovered-border-[#F59405] text-gray-500 hover:text-[#F59405] rounded-xl flex items-center justify-center gap-2 text-lg font-medium"
                                              icon={<PlusOutlined />}
                                            >
                                              Add Section
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
                                                <span className="text-sm font-semibold text-gray-700">Section Name</span>

                                                <div
                                                  className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                                                  onClick={() => subOpt.remove(subField.name)}
                                                >
                                                  <DeleteOutlined className="text-lg" />
                                                </div>
                                              </div>

                                              <Form.Item
                                                name={[subField.name, "name"]}
                                                rules={[
                                                  {
                                                    required: true,
                                                    message: "Required",
                                                  },
                                                ]}
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                className="w-full"
                                              >
                                                <Input
                                                  style={{ width: "100%" }}
                                                  placeholder="Name of Section"
                                                />
                                              </Form.Item>

                                              <Row gutter={32} className="mb-1">
                                                <Col span={24} md={12}>
                                                  <label className="text-sm font-semibold text-gray-700 block">No. of Questions</label>
                                                </Col>
                                                <Col span={24} md={12}>
                                                  <label className="text-sm font-semibold text-gray-700 block">Time Limit</label>
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
                                                    rules={[
                                                      {
                                                        required: true,
                                                        message: "Required",
                                                      },
                                                    ]}
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
                                                    rules={[
                                                      {
                                                        required: true,
                                                        message: "Required",
                                                      },
                                                    ]}
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

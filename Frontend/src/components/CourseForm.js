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
    <div className="h-[80vh] bg-white shadow-sm border border-gray-200 mt-4 rounded-xl overflow-hidden">
      <Form
        form={form}
        name="course_form"
        autoComplete="off"
        initialValues={courseData}
        onFinish={onFinish}
        className="h-full flex flex-col"
        layout="vertical"
      >
        <div className="flex h-full">
          {/* Left Panel: Navigation/Subject List */}
          <div className="w-1/3 flex flex-col p-6 border-r border-gray-100 bg-gray-50/50">
            <div>
              <Form.Item
                label={<span className="font-semibold text-gray-700">Course Name</span>}
                name="name"
                required
                className="mb-0"
              >
                <Input
                  placeholder="Enter Course Name"
                  className="rounded-lg border-gray-300 h-11"
                />
              </Form.Item>
            </div>

            <div className="flex items-center justify-between my-5">
              <h3 className="text-gray-900 font-semibold text-lg">Subjects</h3>
              {showSubjectForm && (
                <button
                  type="text"
                  icon={<PlusOutlined className="text-[#F28C28]" />}
                  onClick={handleAddSubjectClick}
                  className="bg-[#F28C28] hover:bg-[#d4761f] border-none px-2 py-1 rounded-md font-semibold flex items-center gap-1"
                >
                  <PlusOutlined/>
                  Add Subject
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {showSubjectForm && (
                <Form.List name="subjects">
                  {(fields, { remove }) => (
                    <div className="space-y-3">
                      {fields.map((field, index) => {
                        const subjectName = form.getFieldValue(['subjects', field.name, 'name']) || `Subject ${index + 1}`;
                        return (
                          <div
                            key={field.key}
                            className="group relative flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#F28C28] font-bold text-sm">
                                {index + 1}
                              </div>
                              <span className="font-medium text-gray-700 truncate max-w-[150px]">
                                {subjectName}
                              </span>
                            </div>

                            <Button
                              type="text"
                              size="small"
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubject(remove, field.name);
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Form.List>
              )}

              {!showSubjectForm && (
                <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
                  <span className="text-gray-400 mb-2">No subjects added yet</span>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddSubjectClick}
                    className="bg-[#F28C28] hover:bg-[#d4761f] border-none"
                  >
                    Add First Subject
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Content/Details */}
          <div className="w-2/3 flex flex-col h-full bg-white">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {showSubjectForm && (
                <Form.List name="subjects" ref={subjectListRef}>
                  {(fields, { add, remove }) => (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.key} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                            Subject {index + 1} Details
                          </h3>

                          <div className="space-y-4">
                            {/* Subject Name Selection */}
                            <Form.Item className="mb-0">
                              <Radio.Group
                                onChange={handleOptionChange}
                                value={selectedOption}
                                className="hidden"
                              >
                              </Radio.Group>
                              <div className="bg-gray-100 p-2 rounded-lg inline-flex w-full mb-4">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOption("select_existing")}
                                  className={`flex-1 ${selectedOption === "select_existing" ? "bg-white text-[#F28C28] shadow-sm py-2 rounded-md" : "text-gray-500 hover:text-gray-700 bg-transparent"
                                    }`}
                                >
                                  Select Existing Subject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOption("add_new")}
                                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${selectedOption === "add_new" ? "bg-white text-[#F28C28] shadow-sm py-2 rounded-md" : "text-gray-500 hover:text-gray-700 bg-transparent"
                                    }`}
                                >
                                  Create New Subject
                                </button>
                              </div>

                              {selectedOption === "select_existing" ? (
                                <Form.Item
                                  name={[field.name, "name"]}
                                  required
                                  label="Subject Name"
                                  className="mb-0 font-semibold"
                                >
                                  <CustomSelect
                                    fieldName="Subject"
                                    options={subjectOptions}
                                    style={{ width: "100%", height: "44px" }}
                                  />
                                </Form.Item>
                              ) : (
                                <Form.Item
                                  name={[field.name, "name"]}
                                  required
                                  label="Subject Name"
                                  rules={[{ required: true, message: "Please enter a new subject" }]}
                                  className="mb-0 font-semibold"
                                >
                                  <Input placeholder="Enter Subject Name" className="rounded-lg h-11" />
                                </Form.Item>
                              )}
                            </Form.Item>

                            {/* Marks & Order Grid */}
                            <div className="grid grid-cols-3 gap-4">
                              <Form.Item
                                label="Marks (Correct)"
                                name={[field.name, "correct_answer_marks"]}
                                required
                                className="mb-0 font-semibold"
                              >
                                <InputNumber min={0} className="w-full h-11 rounded-lg flex items-center" placeholder="e.g. 4" />
                              </Form.Item>
                              <Form.Item
                                label="Marks (Incorrect)"
                                name={[field.name, "incorrect_answer_marks"]}
                                required
                                className="mb-0 font-semibold"
                              >
                                <InputNumber min={0} className="w-full h-11 rounded-lg flex items-center" placeholder="e.g. -1" />
                              </Form.Item>
                              <Form.Item
                                label="Order"
                                name={[field.name, "order"]}
                                required
                                className="mb-0 font-semibold"
                              >
                                <InputNumber min={1} className="w-full h-11 rounded-lg flex items-center" placeholder="Seq. No." />
                              </Form.Item>
                            </div>
                          </div>

                          <Divider className="my-3" />

                          {/* Sections */}
                          <Form.List name={[field.name, "sections"]}>
                            {(subFields, subOpt) => (
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-gray-700 font-bold flex items-center gap-2">
                                    <span className="bg-gray-200 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">S</span>
                                    Sections
                                  </h4>
                                  <Button
                                    type="dashed"
                                    size="small"
                                    onClick={() => subOpt.add()}
                                    className="border-orange-300 text-orange-500 bg-white hover:border-orange-500 hover:text-orange-600"
                                    icon={<PlusOutlined />}
                                  >
                                    Add Section
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  {subFields.length === 0 && (
                                    <div className="text-center py-6 text-gray-400 text-sm">
                                      No sections added. Click "Add Section" to start.
                                    </div>
                                  )}

                                  {subFields.map((subField) => (
                                    <div key={subField.key} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative group">
                                      <Button
                                        type="text"
                                        size="small"
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                        icon={<DeleteOutlined />}
                                        onClick={() => subOpt.remove(subField.name)}
                                      />

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Form.Item
                                          name={[subField.name, "name"]}
                                          required
                                          label="Section Name"
                                          className="mb-0 col-span-2"
                                        >
                                          <Input placeholder="e.g. Logical Reasoning" className="rounded-lg h-10" />
                                        </Form.Item>

                                        <Form.Item
                                          name={[subField.name, "no_of_questions"]}
                                          required
                                          label="Questions"
                                          className="mb-0"
                                        >
                                          <InputNumber className="w-full h-10 rounded-lg flex items-center" placeholder="Count" />
                                        </Form.Item>

                                        <Form.Item
                                          name={[subField.name, "time_limit"]}
                                          required
                                          label="Time (Min)"
                                          className="mb-0"
                                        >
                                          <InputNumber className="w-full h-10 rounded-lg flex items-center" placeholder="Minutes" />
                                        </Form.Item>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Form.List>
                        </div>
                      ))}
                    </div>
                  )}
                </Form.List>
              )}
            </div>

            {/* Footer / Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <Button
                onClick={() => router.back()}
                className="mr-3 h-11 px-6 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={() => form.submit()}
                className="bg-[#F28C28] hover:bg-[#d4761f] border-none h-11 px-8 rounded-lg shadow-md font-semibold text-lg"
              >
                {isEdit ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}

export default CourseForm;

import React, { useEffect, useState } from "react";
import {
  DeleteOutlined,
  PlusOutlined,
  BookOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Radio,
  notification,
  Empty,
  Typography,
} from "antd";
import Select from "react-select";
import {
  createCourse,
  editCourse,
  getSubjects,
} from "@/app/services/authService";
import { useParams, useRouter } from "next/navigation";

const { Title, Text } = Typography;

// --- Wrapper for React Select to work with Ant Design Form ---
const ReactSelectWrapper = ({
  value,
  onChange,
  options,
  placeholder,
  isLoading,
  ...props
}) => {
  // FIX: Fallback to creating a temporary object if the option isn't found yet
  // This ensures the data shows up even if options are still loading or empty
  const selectedOption =
    options?.find((opt) => opt.value === value) ||
    (value ? { label: value, value: value } : null);

  const handleChange = (selected) => {
    // Pass just the value string back to Ant Form
    onChange(selected ? selected.value : null);
  };

  return (
    <Select
      {...props}
      value={selectedOption}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      isLoading={isLoading}
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
          ...base,
          height: "40px", // Match AntD Input height
          borderColor: "#d9d9d9",
          borderRadius: "8px",
          boxShadow: "none",
          "&:hover": { borderColor: "#40a9ff" },
        }),
        valueContainer: (base) => ({
          ...base,
          height: "40px",
          padding: "0 8px",
        }),
        menu: (base) => ({
          ...base,
          zIndex: 9999,
        }),
      }}
    />
  );
};

function CourseForm({ courseData = {}, isEdit = false }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingSubjects, setFetchingSubjects] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const { courseId } = useParams();
  const router = useRouter();

  useEffect(() => {
    setFetchingSubjects(true);
    getSubjects()
      .then((res) => {
        setSubjectOptions(
          res.data.map(({ name }) => ({ label: name, value: name })),
        );
      })
      .catch((err) => console.log("err", err))
      .finally(() => setFetchingSubjects(false));
  }, []);

  const handleDeleteSubject = (removeFn, index) => {
    Modal.confirm({
      title: "Delete Subject?",
      content: "This will remove the subject and all its sections.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        removeFn(index);
        notification.success({
          message: "Deleted",
          description: "Subject removed.",
        });
      },
    });
  };

  const onFinish = (values) => {
    if (!values.subjects || values.subjects.length === 0) {
      notification.error({
        message: "Validation Error",
        description: "Please add at least one subject.",
      });
      return;
    }

    const hasError = values.subjects.some((subject, index) => {
      if (!subject.sections || subject.sections.length === 0) {
        notification.error({
          message: "Validation Error",
          description: `Subject ${index + 1} must have at least one section.`,
        });
        return true;
      }
      return false;
    });

    if (hasError) return;

    setLoading(true);
    const request = isEdit
      ? editCourse(courseId, values)
      : createCourse(values);

    request
      .then(({ data }) => {
        Modal.success({
          title: "Success",
          content: data.detail || "Course saved successfully!",
          onOk: () => router.back(),
        });
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.msg ||
          err?.response?.data?.detail ||
          "Error occurred";
        notification.error({ message: "Error", description: msg });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <Form
        form={form}
        name="course_form"
        layout="vertical"
        initialValues={{
          subjects: [],
          ...courseData,
        }}
        onFinish={onFinish}
        className="h-full flex flex-col gap-4"
      >
        {/* --- HEADER SECTION --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full lg:w-1/2">
            <Form.Item
              name="name"
              label={
                <span className="font-bold text-gray-700">Course Name</span>
              }
              rules={[{ required: true, message: "Course Name is required" }]}
              className="mb-0"
            >
              <Input
                placeholder="e.g. Mathematics Class 10"
                size="large"
                prefix={<BookOutlined className="text-gray-400" />}
              />
            </Form.Item>
          </div>
          <div className="flex gap-3">
            <Button size="large" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={() => form.submit()}
              className="bg-[#F59405] hover:bg-[#e08604] border-none"
            >
              {isEdit ? "Update Course" : "Save Course"}
            </Button>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
          <Form.List name="subjects">
            {(fields, { add, remove }) => (
              <>
                {/* --- LEFT SIDE --- */}
                <div className="w-full lg:w-1/4 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <Text strong className="text-gray-600">
                      Subjects ({fields.length})
                    </Text>
                    <Button
                      type="dashed"
                      size="medium"
                      onClick={() => add({ subjectType: "add_new" })}
                      icon={<PlusOutlined />}
                      className="text-[#F59405] border-[#F59405]"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="overflow-y-auto block lg:flex-1 p-3 space-y-2 md:h-24">
                    {fields.length === 0 && (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No subjects added"
                      />
                    )}
                    {fields.map((field, index) => (
                      <div
                        key={field.key}
                        className="p-3 rounded-lg border border-gray-100 bg-white hover:border-[#F59405] hover:shadow-sm transition-all group flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <div className="bg-orange-100 text-[#F59405] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          {/* Display Name Preview */}
                          <Form.Item shouldUpdate noStyle>
                            {({ getFieldValue }) => {
                              const name = getFieldValue([
                                "subjects",
                                index,
                                "name",
                              ]);
                              return (
                                <span
                                  className="font-medium text-gray-700 truncate max-w-[120px]"
                                  title={name}
                                >
                                  {name || `Subject ${index + 1}`}
                                </span>
                              );
                            }}
                          </Form.Item>
                        </div>
                        <DeleteOutlined
                          className="text-gray-300 hover:text-red-500 cursor-pointer"
                          onClick={() =>
                            handleDeleteSubject(remove, field.name)
                          }
                        />
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      block
                      onClick={() => add({ subjectType: "add_new" })}
                      className="mt-4 h-12 border-gray-300 text-gray-500 hover:text-[#F59405] hover:border-[#F59405]"
                    >
                      + Add New Subject
                    </Button>
                  </div>
                </div>

                {/* --- RIGHT SIDE --- */}
                <div className="w-full :w-3/4 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <Title level={5} className="m-0 text-gray-700">
                      Subject Details
                    </Title>
                  </div>

                  <div className="overflow-y-auto flex-1 p-6 bg-gray-50/30">
                    {fields.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <BookOutlined
                          style={{
                            fontSize: 48,
                            marginBottom: 16,
                            opacity: 0.5,
                          }}
                        />
                        <p>
                          Select "Add" on the left to start adding subjects.
                        </p>
                      </div>
                    ) : (
                      fields.map((field, index) => (
                        <Card
                          key={field.key}
                          title={`Subject ${index + 1}`}
                          className="mb-6 shadow-sm border-gray-200 rounded-lg overflow-hidden"
                          headStyle={{
                            backgroundColor: "#fff",
                            borderBottom: "1px solid #f0f0f0",
                          }}
                          extra={
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() =>
                                handleDeleteSubject(remove, field.name)
                              }
                            >
                              Remove
                            </Button>
                          }
                        >
                          {/* Subject Type Selection - FIXED STYLE */}
                          <Form.Item
                            name={[field.name, "subjectType"]}
                            initialValue="add_new"
                            className="mb-4"
                          >
                            <Radio.Group className="w-full grid grid-cols-2 gap-4">
                              <Radio.Button
                                value="select_existing"
                                className="flex items-center justify-center text-center !rounded-md h-10 before:!hidden border-gray-300 shadow-sm"
                              >
                                Select Existing
                              </Radio.Button>
                              <Radio.Button
                                value="add_new"
                                className="flex items-center justify-center text-center !rounded-md h-10 before:!hidden border-gray-300 shadow-sm !border-l"
                              >
                                Create New
                              </Radio.Button>
                            </Radio.Group>
                          </Form.Item>

                          <Form.Item
                            noStyle
                            shouldUpdate={(prev, curr) =>
                              prev.subjects?.[index]?.subjectType !==
                              curr.subjects?.[index]?.subjectType
                            }
                          >
                            {({ getFieldValue }) => {
                              const subjects = getFieldValue("subjects") || [];
                              const currentSubject = subjects[index] || {};
                              const type =
                                currentSubject.subjectType || "add_new";

                              return type === "select_existing" ? (
                                <Form.Item
                                  name={[field.name, "name"]}
                                  label="Select Subject"
                                  rules={[
                                    {
                                      required: true,
                                      message: "Please select a subject",
                                    },
                                  ]}
                                >
                                  {/* Using React Select Wrapper with Loading State */}
                                  <ReactSelectWrapper
                                    options={subjectOptions}
                                    isLoading={fetchingSubjects}
                                    placeholder="Search or select a subject..."
                                  />
                                </Form.Item>
                              ) : (
                                <Form.Item
                                  name={[field.name, "name"]}
                                  label="New Subject Name"
                                  rules={[
                                    {
                                      required: true,
                                      message: "Please enter subject name",
                                    },
                                  ]}
                                >
                                  <Input
                                    placeholder="Enter subject name"
                                    size="large"
                                    className="!rounded-lg"
                                  />
                                </Form.Item>
                              );
                            }}
                          </Form.Item>

                          <Row gutter={16}>
                            <Col xs={24} md={8}>
                              <Form.Item
                                name={[field.name, "correct_answer_marks"]}
                                label="Marks (Correct)"
                                rules={[
                                  { required: true, message: "Required" },
                                ]}
                              >
                                <InputNumber
                                  min={0}
                                  className="w-full h-10 flex items-center"
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                              <Form.Item
                                name={[field.name, "incorrect_answer_marks"]}
                                label="Marks (Incorrect)"
                                rules={[
                                  { required: true, message: "Required" },
                                ]}
                              >
                                <InputNumber
                                  min={0}
                                  className="w-full h-10 flex items-center"
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                              <Form.Item
                                name={[field.name, "order"]}
                                label="Display Order"
                                rules={[
                                  { required: true, message: "Required" },
                                ]}
                              >
                                <InputNumber
                                  min={1}
                                  className="w-full h-10 flex items-center"
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                            <Form.List name={[field.name, "sections"]}>
                              {(subFields, subOpt) => (
                                <>
                                  <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold text-gray-700 m-0">
                                      Sections
                                    </h4>
                                    <Button
                                      type="dashed"
                                      size="medium"
                                      onClick={() => subOpt.add()}
                                      icon={<PlusOutlined />}
                                      className="text-[#F59405] border-[#F59405]"
                                    >
                                      Add Section
                                    </Button>
                                  </div>

                                  {subFields.length === 0 && (
                                    <Empty
                                      description="No sections added yet"
                                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                  )}

                                  {subFields.map((subField) => (
                                    <div
                                      key={subField.key}
                                      className="bg-white p-3 rounded-lg border border-gray-200 mb-3 relative group"
                                    >
                                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DeleteOutlined
                                          onClick={() =>
                                            subOpt.remove(subField.name)
                                          }
                                          className="text-red-400 hover:text-red-600 cursor-pointer"
                                        />
                                      </div>

                                      <Row gutter={16}>
                                        <Col xs={8}>
                                          <Form.Item
                                            name={[subField.name, "name"]}
                                            label="Section Name"
                                            rules={[
                                              {
                                                required: true,
                                                message: "Required",
                                              },
                                            ]}
                                            className="mb-2"
                                          >
                                            <Input
                                              placeholder="e.g. Part A"
                                              className="w-full h-10 flex items-center"
                                            />
                                          </Form.Item>
                                        </Col>
                                        <Col xs={8}>
                                          <Form.Item
                                            name={[
                                              subField.name,
                                              "no_of_questions",
                                            ]}
                                            label="Questions"
                                            rules={[
                                              {
                                                required: true,
                                                message: "Required",
                                              },
                                            ]}
                                            className="mb-0"
                                          >
                                            <InputNumber
                                              min={1}
                                              className="w-full h-10 flex items-center"
                                            />
                                          </Form.Item>
                                        </Col>
                                        <Col xs={8}>
                                          <Form.Item
                                            name={[subField.name, "time_limit"]}
                                            label="Time (mins)"
                                            rules={[
                                              {
                                                required: true,
                                                message: "Required",
                                              },
                                            ]}
                                            className="mb-0"
                                          >
                                            <InputNumber
                                              min={1}
                                              className="w-full h-10 flex items-center"
                                            />
                                          </Form.Item>
                                        </Col>
                                      </Row>
                                    </div>
                                  ))}
                                </>
                              )}
                            </Form.List>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </Form.List>
        </div>
      </Form>
    </div>
  );
}

export default CourseForm;

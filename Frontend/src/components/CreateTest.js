import { createTest } from "@/app/services/authService";
import { getCoursesOutsideAuth } from "@/app/services/registerStudent";
import {
  FileTextOutlined,
  FormOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Form, Input, Select, Spin, Button } from "antd";
import { useForm } from "antd/es/form/Form";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const { Option } = Select;

function CreateTest({ setTestDetails }) {
  const params = useParams();
  const router = useRouter();
  const [options, setOptions] = useState([]);
  const [form] = useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState(null);

  const onFieldsChange = (_, allFields) => {
    const isFormValid = allFields.every((field) => {
      if (!field.value || field.errors.length > 0) {
        return false;
      }
      return true;
    });
    setIsSubmitDisabled(!isFormValid);
  };

  useEffect(() => {
    getCoursesOutsideAuth()
      .then((res) => {
        setOptions(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  const onSubmit = (values) => {
    setCreateLoading(true);
    createTest(values)
      .then((res) => {
        setTestDetails(res.data);

        window.sessionStorage.setItem(
          `test-${res.data.id}`,
          JSON.stringify(res.data),
        );
        router.push(`/admin/${params.id}/tests/edit/${res.data.id}`);
      })
      .finally(() => setCreateLoading(false));
  };

  const handleFormatSelect = (value) => {
    setSelectedFormat(value);
    form.setFieldsValue({ format_type: value });
    form.validateFields(["format_type"]);
  };

  return (
    <div>
      {/* Consistent input heights */}
      <style jsx global>{`
        .create-test-form .ant-select-selector,
        .create-test-form .ant-input,
        .create-test-form .ant-input-affix-wrapper {
          height: 48px !important;
          min-height: 48px !important;
          border-radius: 8px !important;
        }
        .create-test-form .ant-select-selector {
          display: flex !important;
          align-items: center !important;
          padding: 0 12px !important;
        }
        .create-test-form .ant-select-selection-search-input {
          height: 46px !important;
        }
        .create-test-form
          .ant-select-single
          .ant-select-selector
          .ant-select-selection-item,
        .create-test-form
          .ant-select-single
          .ant-select-selector
          .ant-select-selection-placeholder {
          line-height: 46px !important;
        }
        .create-test-form .ant-input-affix-wrapper {
          display: flex !important;
          align-items: center !important;
          padding: 0 12px !important;
        }
        .create-test-form .ant-input-affix-wrapper .ant-input {
          height: auto !important;
          min-height: auto !important;
        }
      `}</style>

      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Create New Test</h1>
            <p className="text-sm text-gray-500">
              Configure your test settings
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="w-fit px-4 py-2 flex items-center justify-center gap-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium shadow-sm transition-all text-sm"
          >
            ← Back
          </button>
        </div>

        <Form
          form={form}
          onFinish={onSubmit}
          onFieldsChange={onFieldsChange}
          layout="vertical"
          className="create-test-form space-y-4"
        >
          {/* Test Configuration Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileTextOutlined />
                Test configuration
              </h2>
            </div>

            {/* Card Body */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Course */}
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700 text-sm">
                      Course
                    </span>
                  }
                  name="course"
                  rules={[
                    { required: true, message: "Please select a course" },
                  ]}
                  className="!mb-0"
                >
                  <Select
                    placeholder="Select Course"
                    size="large"
                    className="w-full"
                    suffixIcon={<AppstoreOutlined className="text-gray-400" />}
                  >
                    {options &&
                      options.map(({ id, name }) => (
                        <Option key={id} value={id}>
                          {name}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>

                {/* Test Name */}
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700 text-sm">
                      Test Name
                    </span>
                  }
                  name="name"
                  rules={[
                    { required: true, message: "Please enter test name" },
                  ]}
                  className="!mb-0"
                >
                  <Input
                    prefix={<FormOutlined className="text-gray-400" />}
                    placeholder="Enter test name"
                    size="large"
                  />
                </Form.Item>

                {/* Test Format - Compact Style */}
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700 text-sm">
                      Test Format
                    </span>
                  }
                  name="format_type"
                  rules={[
                    { required: true, message: "Please select test format" },
                  ]}
                  className="md:col-span-2 !  mb-0"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {/* Linear Option */}
                    <div
                      onClick={() => handleFormatSelect("LINEAR")}
                      className={`
                        cursor-pointer p-3 rounded-lg border transition-all duration-200 flex items-center gap-3
                        ${
                          selectedFormat === "LINEAR"
                            ? "border-blue-600 bg-blue-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }
                      `}
                    >
                      <div
                        className={`
                        w-8 h-8 rounded-md flex items-center justify-center shrink-0
                        ${selectedFormat === "LINEAR" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}
                      `}
                      >
                        <OrderedListOutlined className="text-base" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`font-semibold text-sm ${selectedFormat === "LINEAR" ? "text-blue-600" : "text-gray-700"}`}
                          >
                            Linear
                          </h3>
                          {selectedFormat === "LINEAR" && (
                            <CheckCircleOutlined className="text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          Sequential question flow
                        </p>
                      </div>
                    </div>

                    {/* Dynamic Option */}
                    <div
                      onClick={() => handleFormatSelect("DYNAMIC")}
                      className={`
                        cursor-pointer p-3 rounded-lg border transition-all duration-200 flex items-center gap-3
                        ${
                          selectedFormat === "DYNAMIC"
                            ? "border-blue-600 bg-blue-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }
                      `}
                    >
                      <div
                        className={`
                        w-8 h-8 rounded-md flex items-center justify-center shrink-0
                        ${selectedFormat === "DYNAMIC" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}
                      `}
                      >
                        <ThunderboltOutlined className="text-base" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`font-semibold text-sm ${selectedFormat === "DYNAMIC" ? "text-blue-600" : "text-gray-700"}`}
                          >
                            Dynamic
                          </h3>
                          {selectedFormat === "DYNAMIC" && (
                            <CheckCircleOutlined className="text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          Adaptive question flow
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Hidden input for form validation */}
                  <Input type="hidden" />
                </Form.Item>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              size="large"
              className="cancel-button !px-5 !h-11 border-white !rounded-md"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="large"     
              className="action-button !px-5 !h-11"   
            >
              {createLoading && <Spin size="small" />}
              Create Test
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default CreateTest;

import { createTest } from "@/app/services/authService";
import { getCoursesOutsideAuth } from "@/app/services/registerStudent";
import { FileTextOutlined, FormOutlined, AppstoreOutlined, OrderedListOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Form, Input, Select, Spin } from "antd";
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
          JSON.stringify(res.data)
        );
        router.push(`/admin/${params.id}/tests/edit/${res.data.id}`);
      })
      .finally(() => setCreateLoading(false));
  };

  const handleFormatSelect = (value) => {
    setSelectedFormat(value);
    form.setFieldsValue({ format_type: value });
    form.validateFields(['format_type']);
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
        .create-test-form .ant-select-single .ant-select-selector .ant-select-selection-item,
        .create-test-form .ant-select-single .ant-select-selector .ant-select-selection-placeholder {
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 md:mb-8 justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Create New Test</h1>
            <p className="text-sm text-gray-500 mt-1">Configure your test settings and format</p>
          </div>
          <button 
            onClick={() => router.back()}
            className="w-fit px-5 py-2.5 flex items-center justify-center gap-2 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium shadow-sm transition-all duration-300 hover:shadow-md"
          >
            ← Back
          </button>
        </div>

        <Form
          form={form}
          onFinish={onSubmit}
          onFieldsChange={onFieldsChange}
          layout="vertical"
          className="create-test-form space-y-6"
        >
          {/* Test Configuration Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-4">
              <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                <FileTextOutlined />
                Test Configuration
              </h2>
            </div>
            
            {/* Card Body */}
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Course */}
                <Form.Item
                  label={<span className="font-medium text-gray-700">Course</span>}
                  name="course"
                  rules={[{ required: true, message: "Please select a course" }]}
                  className="mb-0"
                >
                  <Select 
                    placeholder="Select Course" 
                    size="large"
                    className="w-full h-12 rounded-md"
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
                  label={<span className="font-medium text-gray-700">Test Name</span>} 
                  name="name" 
                  rules={[{ required: true, message: "Please enter test name" }]}
                  className="mb-0"
                >
                  <Input 
                    prefix={<FormOutlined className="text-gray-400" />}
                    placeholder="Enter test name" 
                    size="large"
                    className="h-12 rounded-md"
                  />
                </Form.Item>

                {/* Test Format - Custom Card Style */}
                <Form.Item 
                  label={<span className="font-medium text-gray-700">Test Format</span>} 
                  name="format_type" 
                  rules={[{ required: true, message: "Please select test format" }]}
                  className="md:col-span-2 mb-0"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {/* Linear Option */}
                    <div 
                      onClick={() => handleFormatSelect("LINEAR")}
                      className={`
                        cursor-pointer p-4 md:p-5 rounded-xl border-2 transition-all duration-300
                        ${selectedFormat === "LINEAR" 
                          ? "border-blue-600 bg-blue-50 shadow-md" 
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className={`
                          w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0
                          ${selectedFormat === "LINEAR" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}
                        `}>
                          <OrderedListOutlined className="text-lg md:text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold text-base md:text-lg ${selectedFormat === "LINEAR" ? "text-blue-600" : "text-gray-800"}`}>
                              Linear
                            </h3>
                            {selectedFormat === "LINEAR" && (
                              <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-gray-500 mt-1">Sequential question flow with fixed order</p>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Option */}
                    <div 
                      onClick={() => handleFormatSelect("DYNAMIC")}
                      className={`
                        cursor-pointer p-4 md:p-5 rounded-xl border-2 transition-all duration-300
                        ${selectedFormat === "DYNAMIC" 
                          ? "border-blue-600 bg-blue-50 shadow-md" 
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className={`
                          w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0
                          ${selectedFormat === "DYNAMIC" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}
                        `}>
                          <ThunderboltOutlined className="text-lg md:text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold text-base md:text-lg ${selectedFormat === "DYNAMIC" ? "text-blue-600" : "text-gray-800"}`}>
                              Dynamic
                            </h3>
                            {selectedFormat === "DYNAMIC" && (
                              <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-gray-500 mt-1">Adaptive question flow based on responses</p>
                        </div>
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
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 pt-2 pb-4">
            <button 
              type="button"
              className="h-12 px-8 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow order-2 sm:order-1" 
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled || createLoading}
              className={`
                h-12 px-10 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 order-1 sm:order-2
                ${isSubmitDisabled || createLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
            >
              {createLoading && <Spin size="small" />}
              Create Test
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default CreateTest;

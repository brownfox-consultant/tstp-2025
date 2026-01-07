import {
  createUser,
  getRoles,
} from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { LeftOutlined, UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined, CalendarOutlined, TeamOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import dayjs from 'dayjs';
import Select, { components } from "react-select";

// Custom Dropdown Indicator with rotating arrow
const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <svg
        className={`w-4 h-4 transition-transform duration-200 ${props.selectProps.menuIsOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="#0071BC"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </components.DropdownIndicator>
  );
};

// Custom styles for react-select
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '44px',
    borderColor: state.isFocused ? '#0071BC' : '#E5E7EB',
    boxShadow: state.isFocused ? '0 0 0 1px #0071BC' : 'none',
    '&:hover': {
      borderColor: '#0071BC',
    },
    borderRadius: '0.5rem',
    backgroundColor: 'white',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#0071BC'
      : state.isFocused
        ? '#E6F4FF'
        : 'white',
    color: state.isSelected ? 'white' : '#1F2937',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#0071BC',
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#E6F4FF',
    borderRadius: '0.375rem',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#0071BC',
    fontWeight: '500',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#0071BC',
    '&:hover': {
      backgroundColor: '#0071BC',
      color: 'white',
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    zIndex: 9999,
  }),
};

function CreateUserForm() {
  const [form] = useForm();
  const router = useRouter();
  const { id } = useParams();
  const [options, setOptions] = useState([]);
  const [roleState, setRoleState] = useState(null);
  const [roleName, setRoleName] = useState();
  const [courseOptions, setCourseOptions] = useState([]);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [countryCodes, setCountryCodes] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [altCountryCode, setAltCountryCode] = useState("+91");


  const handlePhoneNumberChange = (e, name) => {
    const filtered = e.target.value.replace(/\D/g, "");
    form.setFieldsValue({ [name]: filtered });
  };

  useEffect(() => {
    getRoles().then((res) => setOptions(res.data));
    getCoursesInsideAuth()
      .then((res) => setCourseOptions(res.data))
      .catch(console.log);
  }, []);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=idd")
      .then((res) => res.json())
      .then((data) => {
        const codes = data
          .map((c) => {
            const root = c.idd?.root;
            const suffixes = c.idd?.suffixes;
            if (!root || !suffixes) return [];
            return suffixes.map((s) => `${root}${s}`);
          })
          .flat()
          .filter(Boolean);

        const uniqueCodes = [...new Set(codes)].sort((a, b) =>
          a.localeCompare(b)
        );

        setCountryCodes(uniqueCodes);
        setSelectedCountryCode("+91");
        setAltCountryCode("+91");
      })
      .catch(console.error);
  }, []);


  const handleRoleChange = (selected) => {
    setRoleState(selected);
    setRoleName(selected?.name);
    form.setFieldValue("role", selected?.value);
  };

  const handleSubmit = (formData) => {
    if (formData.dob) {
      formData.dob = dayjs(formData.dob).format("YYYY-MM-DD");
    }

    // 🔥 add country codes
    formData.phone_number = `${selectedCountryCode}${formData.phone_number}`;

    if (formData.alternative_number) {
      formData.alternative_number =
        `${altCountryCode}${formData.alternative_number}`;
    }
    setLoading(true);

    createUser(formData)
      .then((res) => {
        form.resetFields();
        if (roleState != 5) {
          Modal.success({
            content: "User created successfully,Once Parent and Course details are added, User Registartion email will be sent to activate the account",
            onOk: () => router.back(),
          });
        } else {
          window.sessionStorage.setItem(
            "approveStudentDetails",
            JSON.stringify(res.data)
          );
          window.sessionStorage.setItem("requireParentDetails", true);
          window.sessionStorage.setItem("isCreatedFromAdmin", true);
          window.sessionStorage.setItem("areParentDetailsCompulsory", true);
          Modal.success({ title: "User successfully created" });
          router.push(`/admin/${id}/users/students/approve`);
        }
      })
      .catch(console.log)
      .finally(() => setLoading(false));
  };

  const onFieldsChange = (_, allFields) => {
    const hasErrors = allFields.some((field) => field.errors.length > 0);
    const requiredFields = ["name", "email", "phone_number", "dob", "address", "role"];
    const requiredFilled = requiredFields.every((name) => {
      const field = allFields.find((f) => f.name[0] === name);
      return field?.value !== undefined && field?.value !== "";
    });
    setIsSubmitDisabled(hasErrors || !requiredFilled);
  };

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Create New User</h1>
            <p className="text-sm text-gray-500">Fill in the details to create a new user account</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-5 py-3 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow  transition-all duration-300 hover:scale-105"
          >
            Back
          </button>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          onFieldsChange={onFieldsChange}
          layout="vertical"
          className="space-y-6"
        >
          {/* Global style for consistent input heights */}
          <style jsx global>{`
            .ant-form-item {
              margin-bottom: 0 !important;
            }
            .ant-input, 
            .ant-input-affix-wrapper,
            .ant-picker,
            .ant-select-selector {
              min-height: 44px !important;
              height: 44px !important;
              display: flex !important;
              align-items: center !important;
            }
            .ant-input-affix-wrapper .ant-input {
              height: auto !important;
              min-height: auto !important;
            }
            .ant-input-affix-wrapper .ant-input-prefix {
              display: flex;
              align-items: center;
              margin-right: 8px;
            }
            .ant-select-selection-search-input {
              height: 42px !important;
            }
            .ant-select-multiple .ant-select-selector {
              min-height: 44px !important;
              height: auto !important;
            }
            .ant-select-single .ant-select-selector .ant-select-selection-item,
            .ant-select-single .ant-select-selector .ant-select-selection-placeholder {
              line-height: 42px !important;
            }
            .ant-picker-input > input {
              height: auto !important;
            }
            .ant-select-arrow {
              display: flex !important;
              align-items: center !important;
              height: 100% !important;
              top: 0 !important;
              margin-top: 8px !important;
              transition:transform 0.3s ease !important;
            }
            .ant-select-open .ant-select-arrow {
              transform: rotate(180deg) !important;
            }
          `}</style>
          {/* Personal Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#0071BC] text-white px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserOutlined />
                Personal Details
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Name */}
                <Form.Item
                  label={<span className="font-medium text-gray-700">Full Name</span>}
                  name="name"
                  rules={[{ required: true, message: "Please enter name" }]}
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Enter full name"
                    className="h-11 rounded-lg"
                  />
                </Form.Item>

                {/* Email */}
                <Form.Item
                  label={<span className="font-medium text-gray-700">Email Address</span>}
                  name="email"
                  rules={[{ required: true }, { type: "email", message: "Please enter valid email" }]}
                >
                  <Input
                    prefix={<MailOutlined className="text-gray-400" />}
                    placeholder="Enter email address"
                    className="h-11 rounded-lg"
                  />
                </Form.Item>

                {/* Contact Number */}
                <Form.Item
                  label={<span className="font-medium text-gray-700">Contact Number</span>}
                  name="phone_number"
                  rules={[{ required: true }, { pattern: /^\d{10}$/, message: "Must be 10 digits" }]}
                >
                  <Input
                    addonBefore={
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => setSelectedCountryCode(e.target.value)}
                        className="border-0 bg-transparent outline-none"
                      >
                        {countryCodes.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    }
                    maxLength={10}
                    onChange={(e) => handlePhoneNumberChange(e, "phone_number")}
                    placeholder="Enter 10 digit number"
                    className="h-11 rounded-lg"
                  />
                </Form.Item>

                {/* Alternative Number */}
                <Form.Item
                  label={<span className="font-medium text-gray-700">Alternative Number</span>}
                  name="alternative_number"
                  rules={[{ pattern: /^\d{10}$/, message: "Must be 10 digits" }]}
                >
                  <Input
                    addonBefore={
                      <select
                        value={altCountryCode}
                        onChange={(e) => setAltCountryCode(e.target.value)}
                        className="border-0 bg-transparent outline-none"
                      >
                        {countryCodes.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    }
                    maxLength={10}
                    onChange={(e) => handlePhoneNumberChange(e, "alternative_number")}
                    placeholder="Enter alternative number"
                    className="h-11 rounded-lg"
                  />
                </Form.Item>

                {/* Date of Birth */}
                <Form.Item
                  label={<span className="font-medium text-gray-700">Date of Birth</span>}
                  name="dob"
                  rules={[{ required: true, message: "Please select date" }]}
                >
                  <DatePicker
                    className="w-full h-11 rounded-lg"
                    format="YYYY-MM-DD"
                    placeholder="Select date"
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                </Form.Item>

                {/* Blood Group */}
                <Form.Item
                  label={<span className="font-medium text-gray-700">Blood Group</span>}
                  name="blood_group"
                >
                  <div>
                    <Select
                      value={selectedBloodGroup}
                      onChange={(selected) => {
                        setSelectedBloodGroup(selected);
                        form.setFieldValue("blood_group", selected?.value);
                      }}
                      options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(group => ({ value: group, label: group }))}
                      placeholder="Select blood group"
                      components={{ DropdownIndicator }}
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      isClearable
                    />
                  </div>
                </Form.Item>

                {/* Address */}
                <Form.Item
                  label={<span className="font-medium text-gray-700">Address</span>}
                  name="address"
                  rules={[{ required: true, message: "Please enter address" }]}
                  className="md:col-span-2 lg:col-span-1"
                >
                  <Input
                    prefix={<HomeOutlined className="text-gray-400" />}
                    placeholder="Enter address"
                    className="h-11 rounded-lg"
                  />
                </Form.Item>

                {/* Role */}
                <Form.Item
                  label={<span className="font-medium text-gray-700">Role</span>}
                  name="role"
                  rules={[{ required: true, message: "Please select role" }]}
                >
                  <div>
                    <Select
                      value={roleState}
                      onChange={handleRoleChange}
                      options={options
                        ?.filter(({ name }) => name !== "parent")
                        .map(({ id, name, label }) => ({ value: id, label, name }))}
                      placeholder="Select Role"
                      components={{ DropdownIndicator }}
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      isClearable
                    />
                  </div>
                </Form.Item>

                {/* Course - Only for students */}
                {roleName === "student" && (
                  <Form.Item
                    label={<span className="font-medium text-gray-700">Course</span>}
                    name="courses"
                    rules={[{ required: true, message: "Please select course" }]}
                  >
                    <div>
                      <Select
                        isMulti
                        value={selectedCourses}
                        onChange={(selected) => {
                          setSelectedCourses(selected || []);
                          form.setFieldValue("courses", selected?.map(s => s.value) || []);
                        }}
                        options={courseOptions.map(({ id, name }) => ({ value: name, label: name }))}
                        placeholder="Select Course"
                        components={{ DropdownIndicator }}
                        styles={customSelectStyles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        isClearable
                      />
                    </div>
                  </Form.Item>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              className="h-12 px-8 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              type="primary"
              htmlType="submit"
              loading={loading}
              // disabled={isSubmitDisabled}
              className="h-12 px-10 rounded-xl font-semibold shadow-lg bg-[#0071bc] hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 text-white"
            >
              Submit
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default CreateUserForm;

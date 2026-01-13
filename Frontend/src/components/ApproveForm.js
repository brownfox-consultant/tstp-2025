import { approveStudent, getUsersByRole } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import {
  CloseOutlined,
  PlusCircleTwoTone,
  PlusOutlined,
  UserAddOutlined,
  UserOutlined, 
  MailOutlined,
  HomeOutlined
} from "@ant-design/icons";
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select as AntSelect,
} from "antd";
import ReactSelect, { components } from "react-select";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import CourseMetaDetailsForm from "./CourseMetaDetailsForm";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { useParams, useRouter } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import { useCountryCode } from "@/hooks/useCountryCode";

const { Option } = AntSelect;

// Wrapper component to bridge Ant Design Form (value=ID) and React Select (value=Object)
const IdSelect = ({ value, onChange, options, ...props }) => {
  // Find the full option object based on the ID value passed by Form.Item
  const selectedOption = options?.find(opt => opt.value === value) || null;
  
  return (
    <ReactSelect
      {...props}
      options={options}
      value={selectedOption}
      onChange={(val) => {
        // Pass only the ID back to the Form
        onChange(val?.value || null);
      }}
    />
  );
};

// Custom Dropdown Indicator with SVG (Consistent with CreateUserForm and CourseMetaDetailsForm)
const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <svg
        className={`w-4 h-4 transition-transform duration-200 ${props.selectProps.menuIsOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="#805830"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </components.DropdownIndicator>
  );
};

// Global Custom Select Styles
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '44px', // Match the h-11 class used in AntD inputs (approx 44px)
    borderColor: state.isFocused ? '#F59405' : '#D1D5DB', // Using the orange theme color
    boxShadow: state.isFocused ? '0 0 0 1px #F59405' : 'none',
    '&:hover': {
      borderColor: '#F59405',
    },
    borderRadius: '0.5rem',
    backgroundColor: 'white',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#F59405'
      : state.isFocused
        ? '#FFF7E6' // Light orange
        : 'white',
    color: state.isSelected ? 'white' : '#1F2937',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#F59405',
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

function ApproveForm({
  data,
  is_temp_user = false,
  requireParentDetails = true,
  isCreatedFromAdmin,
}) {
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [mentorOptions, setMentorOptions] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);
  const [showFatherForm, setShowFatherForm] = useState(
    !!data?.parent_details?.father?.name
  );
  const [showMotherForm, setShowMotherForm] = useState(
    !!data?.parent_details?.mother?.name
  );
  const [approveLoader, setApproveLoader] = useState(false);
  const [form] = useForm();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const { roles } = useGlobalContext();
  const [courses, setCourses] = useState([]);
  const router = useRouter();


  const { id, testId } = useParams();

  // Use the hook to get country codes list
  const { countryCodes } = useCountryCode();

  const prefixSelector = (name) => (
    <Form.Item name={name} noStyle initialValue="+91">
      <AntSelect
        showSearch
        style={{ width: 90 }}
        bordered={false}
        optionLabelProp="label"
        dropdownMatchSelectWidth={false}
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option.countryName || '').toLowerCase().includes(input.toLowerCase()) ||
          String(option.value).includes(input)
        }
        dropdownStyle={{ zIndex: 10000, width: 300 }}
        className="country-code-select"
      >
        {countryCodes.map((country) => (
          <AntSelect.Option
            key={country.cca2}
            value={country.code}
            label={country.code}
            countryName={country.name}
          >
            <div className="flex items-center gap-2">
              <span>{country.name}</span>
              <span className="text-gray-400">({country.code})</span>
            </div>
          </AntSelect.Option>
        ))}
      </AntSelect>
    </Form.Item>
  );

  useEffect(() => {
    getCoursesInsideAuth()
      .then((res) => {
        setCourses(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (Array.isArray(roles) && roles.length != 0) {
      const facultyRole = roles.find(({ name }) => name == "faculty");
      if (facultyRole) {
        getUsersByRole({ role: facultyRole.id }).then((res) => {
          setFacultyOptions(
            res.data.results.map((user) => ({
              label: user.name,
              value: user.id,
            }))
          );
        });
      }

      const mentorRole = roles.find(({ name }) => name == "mentor");
      if (mentorRole) {
        getUsersByRole({ role: mentorRole.id }).then((res) => {
          setMentorOptions(
            res.data.results.map((user) => ({
              label: user.name,
              value: user.id,
            }))
          );
        });
      }

      if (requireParentDetails) {
        const parentRole = roles.find(({ name }) => name == "parent");
        if (parentRole) {
          getUsersByRole({ role: parentRole.id }).then((res) => {
            setParentOptions(
              res.data.results.map((user) => ({
                label: user.name,
                value: user.id,
              }))
            );
          });
        }
      }
    }
  }, [roles, requireParentDetails]);

  const onFinish = (values) => {
    setApproveLoader(true);
    
    // Combine country code and phone number
    const fatherPhone = values.father_phone_number && values.father_country_code 
      ? `${values.father_country_code}${values.father_phone_number}`
      : values.father_phone_number;
      
    const motherPhone = values.mother_phone_number && values.mother_country_code 
      ? `${values.mother_country_code}${values.mother_phone_number}`
      : values.mother_phone_number;

    let payload = {
      ...values,
      father_phone_number: fatherPhone,
      mother_phone_number: motherPhone,
      is_temp_user,
      student: data.id,
      courses: values.courses.map((course) => {
        return {
          ...course,
          subscription_start_date: dayjs(course.subscription_start_date).format(
            "YYYY-MM-DD"
          ),
          subscription_end_date: dayjs(course.subscription_end_date).format(
            "YYYY-MM-DD"
          ),
        };
      }),
    };

    // Clean up auxiliary fields used for country codes
    delete payload.father_country_code;
    delete payload.mother_country_code;

    approveStudent(payload)
      .then((res) => {
        Modal.success({
          content: res.data.detail,
          onOk: () => {
            Modal.destroyAll();
            if (isCreatedFromAdmin) {
              router.push(`/admin/${id}/users/all`);
            } else {
              router.back();
            }
            form.resetFields();
            window.sessionStorage.removeItem("approveStudentDetails");
            window.sessionStorage.removeItem("requireParentDetails");
            window.sessionStorage.removeItem("isTempUser");
            window.sessionStorage.removeItem("isCreatedFromAdmin");
          },
        });
      })
      .finally(() => setApproveLoader(false));
  };

  const handleFatherPhoneNumberChange = (e) => {
    const filteredValue = e.target.value.replace(/\D/g, "");
    form.setFieldsValue({ father_phone_number: filteredValue });
  };

  const handleMotherPhoneNumberChange = (e) => {
    const filteredValue = e.target.value.replace(/\D/g, "");
    form.setFieldsValue({ mother_phone_number: filteredValue });
  };

  const onFieldsChange = (_, allFields) => {
    function fieldValidChecker(field) {
      if (field.name[0] === "mentor" || field.name[0] === "faculty") {
        return true;
      } else if (
        field.name[0].includes("mother") ||
        field.name[0].includes("father")
      ) {
        return true;
      } else if (field.value && field.errors.length == 0) {
        return true;
      }
      return false;
    }

    function parentFieldValidChecker(field) {
      if (field.value && field.errors.length == 0) {
        return true;
      }
      return false;
    }

    const areCommonFieldsValid = allFields.every(fieldValidChecker);

    const areMotherFieldsValid = allFields
      .filter((field) => field.name[0].includes("mother"))
      .every(parentFieldValidChecker);

    const areFatherFieldsValid = allFields
      .filter((field) => field.name[0].includes("father"))
      .every(parentFieldValidChecker);

    const isFormValid =
      areCommonFieldsValid && (areMotherFieldsValid || areFatherFieldsValid);
    setIsSubmitDisabled(!isFormValid);
  };

  // Helper to parse phone number into country code and number
  const parsePhoneNumber = (fullNumber) => {
    if (!fullNumber) return { code: "+91", number: "" };
    
    // Sort codes by length desc to match +971 before +9
    // Use countryCodes from hook or fallback if not ready map logic
    if (countryCodes.length > 0) {
       const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
       for (const { code } of sortedCodes) {
         if (fullNumber.startsWith(code)) {
           return { 
             code: code, 
             number: fullNumber.slice(code.length) 
           };
         }
       }
    } else {
        // Fallback for initial render if hook data isn't ready
        if (fullNumber.startsWith('+91')) return { code: '+91', number: fullNumber.slice(3) };
    }
    
    if (!fullNumber.startsWith('+')) {
         return { code: "+91", number: fullNumber };
    }
    
    return { code: "+91", number: fullNumber };
  };

  const getUserInitialValues = (data) => {
    const fatherPhone = parsePhoneNumber(data?.parent_details?.father?.phone_number);
    const motherPhone = parsePhoneNumber(data?.parent_details?.mother?.phone_number);

    return {
      name: data?.name,
      mentor: data?.mentor_details?.id,
      faculty: data?.faculty_details?.id,
      father_email: data?.parent_details?.father?.email,
      father_phone_number: fatherPhone.number,
      father_country_code: fatherPhone.code,
      father_name: data?.parent_details?.father?.name,
      father_id: data?.parent_details?.father?.id, 
      mother_id: data?.parent_details?.mother?.id,
      mother_email: data?.parent_details?.mother?.email,
      mother_phone_number: motherPhone.number,
      mother_country_code: motherPhone.code,
      mother_name: data?.parent_details?.mother?.name,
      courses: data?.course_details
        ? data?.course_details.map((course_detail) => {
            const {
              course,
              subscription_start_date,
              subscription_end_date,
              subscription_type,
            } = course_detail;
            return {
              course: course.name,
              subscription_type,
              subscription_end_date: dayjs(subscription_end_date).format(
                "YYYY-MM-DD"
              ),
              subscription_start_date: dayjs(subscription_start_date).format(
                "YYYY-MM-DD"
              ),
            };
          })
        : data?.courses.map((course_name) => {
            return {
              course: course_name,
            };
          }),
    };
  };

  const userInitalValues = getUserInitialValues(data);

  // Custom components for react-select (pass DropdownIndicator here)
  const customComponents = {
    DropdownIndicator,
  };

  return (
    <>
      {/* Global style for consistent input heights and clean selectors */}
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
        .ant-input-group-addon {
          background-color: transparent !important;
          border: none !important;
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
        /* Country Code Select Styling */
        .country-code-select .ant-select-selector {
          border: none !important;
          border-right: 1px solid #E5E7EB !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 12px 0 12px !important;
          margin-right: 12px !important;
        }
        .country-code-select .ant-select-selection-search {
          left: 8px !important;
        }
        .country-code-select .ant-select-selection-item {
          padding: 0 !important;
          font-weight: 500;
          color: #374151;
        }
        .country-code-select .ant-select-arrow {
          color: #6B7280;
          right: 0 !important;
        }
        .country-code-select:hover .ant-select-selector {
          border-right: 1px solid #D1D5DB !important;
        }
        .country-code-select.ant-select-focused .ant-select-selector {
          border-right: 1px solid #0071BC !important;
        }
        /* Any other global styles from CreateUserForm if needed */
        .phone-input-wrapper .ant-input-wrapper {
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .phone-input-wrapper .ant-input-wrapper:hover {
          border-color: #4096ff;
        }
        .phone-input-wrapper .ant-input-wrapper:focus-within {
           border-color: #0071BC;
           box-shadow: 0 0 0 2px rgba(0, 113, 188, 0.1);
        }
        .phone-input-wrapper .ant-input {
           border: none !important;
           box-shadow: none !important;
           padding-left: 12px !important;
        }
        .phone-input-wrapper .ant-input-group-addon {
           border: none !important;
           background: transparent !important;
           padding: 0 !important;
        }
      `}</style>

      <Form
        form={form}
        onFinish={onFinish}
        onFieldsChange={onFieldsChange}
        initialValues={userInitalValues}
        layout="vertical"
        className="space-y-6"
      >
        {/* Student Details Card */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-[#F59405]">Student Information</h3>
            <p className="text-sm text-gray-500 mt-1">Basic student details and assignments</p>
          </div>
          <Divider className="my-2 border-gray-200" />
          
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label={<div className="text-base font-semibold text-gray-700">Name</div>}>
                <Input placeholder={data.name} disabled className="h-10" />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label={<div className="text-base font-semibold text-gray-700">Faculty</div>}
                name="faculty"
              >
                <IdSelect
                  placeholder="Select Faculty"
                  options={facultyOptions}
                  components={customComponents}
                  styles={customSelectStyles}
                  isClearable
                  isSearchable
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label={<div className="text-base font-semibold text-gray-700">Mentor</div>}
                name="mentor"
              >
                <IdSelect
                  placeholder="Select Mentor"
                  options={mentorOptions}
                  components={customComponents}
                  styles={customSelectStyles}
                  isClearable
                  isSearchable
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Parent Details Card */}
        {requireParentDetails && (
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-[#007FBC]">Parent Details</h3>
              <p className="text-sm text-gray-500 mt-1">Add or select parent information</p>
            </div>
            <Divider className="my-2 border-gray-200" />

            <Row gutter={[24, 24]}>
              {/* Father Details */}
              <Col xs={24} xl={12}>
                {showFatherForm ? (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200 h-full shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                           <UserAddOutlined />
                         </div>
                         <div className="text-lg font-bold text-gray-800">Father Details</div>
                      </div>
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          form.setFieldsValue({
                            father_name: null,
                            father_email: null,
                            father_phone_number: null,
                          });
                          form.validateFields();
                          setShowFatherForm(false);
                        }}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                      />
                    </div>
                    
                    <Row gutter={[12, 12]}>
                      <Col xs={24}>
                        <Form.Item
                          name="father_name"
                          label={<div className="text-sm font-semibold text-gray-600">Full Name</div>}
                          rules={[{ required: true, message: "Please input father name!" }]}
                          className="mb-3"
                        >
                          <Input placeholder="e.g. John Doe" className="h-10 rounded-lg bg-white/80" />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24}>
                        <Form.Item
                          label={<div className="text-sm font-semibold text-gray-600">Email Address</div>}
                          name="father_email"
                          rules={[
                            { required: true, message: "Please input father's email!" },
                            { type: "email", message: "Invalid email format!" },
                          ]}
                          className="mb-3"
                        >
                          <Input placeholder="e.g. john@example.com" className="h-10 rounded-lg bg-white/80" />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24}>
                        <Form.Item
                          label={<div className="text-sm font-semibold text-gray-600">Contact Number</div>}
                          name="father_phone_number"
                          rules={[
                            { required: true, message: "Please enter phone number!" },
                          ]}
                          className="mb-0"
                        >
                          <Input
                            addonBefore={prefixSelector("father_country_code")}
                            maxLength={10}
                            onChange={handleFatherPhoneNumberChange}
                            placeholder="Phone number"
                            className="h-10 rounded-lg bg-white/80 phone-input-wrapper"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <div className="h-full flex flex-col gap-4">
                    <Form.Item
                      label={<div className="text-base font-semibold text-gray-700">Father</div>}
                      name="father_id"
                      className="mb-0"
                    >
                      <IdSelect
                        placeholder="Search & Select Father"
                        options={parentOptions}
                        components={customComponents}
                        styles={customSelectStyles}
                        isClearable
                        isSearchable
                        isDisabled={showFatherForm}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}

                      />
                    </Form.Item>
                    
                    <div className="text-center text-gray-400 text-sm my-1">- OR -</div>
                    
                    <Button
                      type="dashed"
                      icon={<PlusCircleTwoTone twoToneColor="#1890ff" />}
                      onClick={() => {
                        form.setFieldValue("father_id", null);
                        setShowFatherForm(true);
                      }}
                      className="h-14 border-2 border-dashed border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-400 text-gray-600 hover:text-blue-600 font-semibold text-base w-full rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      Add New Father Details
                    </Button>
                  </div>
                )}
              </Col>

              {/* Mother Details */}
              <Col xs={24} xl={12}>
                {showMotherForm ? (
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-5 border border-pink-200 h-full shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                           <UserAddOutlined />
                         </div>
                         <div className="text-lg font-bold text-gray-800">Mother Details</div>
                      </div>
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          form.setFieldsValue({
                            mother_name: null,
                            mother_email: null,
                            mother_phone_number: null,
                          });
                          form.validateFields();
                          setShowMotherForm(false);
                        }}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                      />
                    </div>
                    
                    <Row gutter={[12, 12]}>
                      <Col xs={24}>
                        <Form.Item
                          name="mother_name"
                          label={<div className="text-sm font-semibold text-gray-600">Full Name</div>}
                          rules={[{ required: true, message: "Please input mother name!" }]}
                          className="mb-3"
                        >
                          <Input placeholder="e.g. Jane Doe" className="h-10 rounded-lg bg-white/80" />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24}>
                        <Form.Item
                          label={<div className="text-sm font-semibold text-gray-600">Email Address</div>}
                          name="mother_email"
                          rules={[
                            { required: true, message: "Please input mother's email!" },
                            { type: "email", message: "Invalid email format!" },
                          ]}
                          className="mb-3"
                        >
                          <Input placeholder="e.g. jane@example.com" className="h-10 rounded-lg bg-white/80" />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24}>
                        <Form.Item
                          label={<div className="text-sm font-semibold text-gray-600">Contact Number</div>}
                          name="mother_phone_number"
                          rules={[
                            { required: true, message: "Please enter phone number!" },
                          ]}
                          className="mb-0"
                        >
                          <Input
                            addonBefore={prefixSelector("mother_country_code")}
                            maxLength={10}
                            onChange={handleMotherPhoneNumberChange}
                            placeholder="Phone number"
                            className="h-10 rounded-lg bg-white/80 phone-input-wrapper"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <div className="h-full flex flex-col gap-4">
                     <Form.Item
                      label={<div className="text-base font-semibold text-gray-700">Mother</div>}
                      name="mother_id"
                      className="mb-0"
                    >
                      <IdSelect
                        placeholder="Search & Select Mother"
                        options={parentOptions}
                        components={customComponents}
                        styles={customSelectStyles}
                        isClearable
                        isSearchable
                        isDisabled={showMotherForm}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}

                      />
                    </Form.Item>
                    
                    <div className="text-center text-gray-400 text-sm my-1">- OR -</div>

                    <Button
                      type="dashed"
                      icon={<PlusCircleTwoTone twoToneColor="#eb2f96" />}
                      onClick={() => {
                        form.setFieldValue("mother_id", null);
                        setShowMotherForm(true);
                      }}
                       className="h-14 border-2 border-dashed border-pink-200 bg-pink-50/30 hover:bg-pink-50 hover:border-pink-400 text-gray-600 hover:text-pink-600 font-semibold text-base w-full rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      Add New Mother Details
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </div>
        )}

        {/* Course Subscription Card */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-[#F59405]">Course Subscription</h3>
            <p className="text-sm text-gray-500 mt-1">Add course details and subscription information</p>
          </div>
          <Divider className="my-2 border-gray-200" />
          
          <Form.List
            name="courses"
            initialValue={
              data
                ? Array(1).fill({})
                : data?.courses?.map((value) => ({ course: value }))
            }
          >
            {(fields, { add, remove }) => {
              return (
                <div className="space-y-3">
                  {fields.map(({ key, name, ...restField }, index) => {
                    return (
                      <CourseMetaDetailsForm
                        key={key}
                        index={index}
                        name={name}
                        fields={fields}
                        courses={courses}
                        restField={restField}
                        add={add}
                        remove={remove}
                      />
                    );
                  })}

                  {fields.length <= 5 && (
                    <div className="flex justify-center mt-4">
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                        className="h-10 px-8 rounded-xl border-2 border-dashed border-[#FFD46A] hover:border-[#F59405] hover:text-[#F59405] font-medium"
                      >
                        Add Course
                      </Button>
                    </div>
                  )}
                </div>
              );
            }}
          </Form.List>
        </div>

        {/* Submit Button Card */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex justify-center">
            <Button
              type="primary"
              htmlType="submit"
              disabled={isSubmitDisabled}
              loading={approveLoader}
              size="large"
              className="h-10 px-12 rounded-xl bg-[#F59405] border-0 hover:bg-[#E08904] font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Approve Student
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}

export default ApproveForm;

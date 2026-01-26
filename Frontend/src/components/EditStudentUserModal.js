import { editUser, getUsersByRole } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import { useCountryCode } from "@/hooks/useCountryCode";
import { EditOutlined, PlusOutlined, UserOutlined, MailOutlined, PhoneOutlined, TeamOutlined, BookOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Modal, Row, Divider, Select as AntSelect } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import CourseMetaDetailsForm from "./CourseMetaDetailsForm";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import dayjs from "dayjs";

// Custom styles for React Select
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '36px',
    height: '36px',
    borderColor: state.isFocused ? '#4b5563' : '#d1d5db',
    borderRadius: '0.375rem',
    boxShadow: 'none',
    fontSize: '0.875rem',
    '&:hover': {
      borderColor: '#9ca3af',
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: '36px',
    padding: '0 8px',
  }),
  input: (provided) => ({
    ...provided,
    margin: '0px',
    padding: '0px',
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: '36px',
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: '0.875rem',
    color: '#9ca3af',
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 10000,
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected ? '#e5e7eb' : state.isFocused ? '#f3f4f6' : 'white',
    color: '#374151',
    '&:active': {
      backgroundColor: '#e5e7eb',
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#e5e7eb',
    borderRadius: '0.25rem',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    fontSize: '0.875rem',
    color: '#374151',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#6b7280',
    '&:hover': {
      backgroundColor: '#d1d5db',
      color: '#374151',
    },
  }),
};

function EditStudentUserModal({ recordData, updated, setUpdated }) {
  const [form] = useForm();
  const [isModalOpen, setIsModalOpen] = useState();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [mentorOptions, setMentorOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const { roles } = useGlobalContext();

  const {
    countryCodes,
    selectedCountryCode: studentCountryCode,
    setSelectedCountryCode: setStudentCountryCode,
    parsePhoneNumber,
  } = useCountryCode("+91", recordData?.phone_number);

  const {
    selectedCountryCode: fatherCountryCode,
    setSelectedCountryCode: setFatherCountryCode,
  } = useCountryCode("+91", recordData?.parent_details?.father?.phone_number);

  const {
    selectedCountryCode: motherCountryCode,
    setSelectedCountryCode: setMotherCountryCode,
  } = useCountryCode("+91", recordData?.parent_details?.mother?.phone_number);

  useEffect(() => {
    if (isModalOpen) {
      form.setFieldsValue(getUserInitialValues(recordData));
      getCoursesInsideAuth().then((res) => {
        setCourses(res.data);
      });

      getUsersByRole({
        role: roles.find(({ name }) => name == "faculty").id,
      }).then((res) => {
        setFacultyOptions(
          res.data.results.map((user) => {
            return {
              label: user.name,
              value: user.id,
            };
          })
        );
      });

      getUsersByRole({
        role: roles.find(({ name }) => name == "mentor").id,
      }).then((res) => {
        setMentorOptions(
          res.data.results.map((user) => {
            return {
              label: user.name,
              value: user.id,
            };
          })
        );
      });
    }
  }, [isModalOpen]);

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  function handleSubmit(formData) {
    setLoading(true);

    const formattedCourses = formData.courses.map((course) => ({
      ...course,
      subscription_start_date: dayjs(course.subscription_start_date).format("YYYY-MM-DD"),
      subscription_end_date: dayjs(course.subscription_end_date).format("YYYY-MM-DD"),
    }));

    const finalPayload = {
      ...formData,
      phone_number: `${studentCountryCode}${formData.phone_number}`,
      father_phone_number: formData.father_phone_number ? `${fatherCountryCode}${formData.father_phone_number}` : undefined,
      mother_phone_number: formData.mother_phone_number ? `${motherCountryCode}${formData.mother_phone_number}` : undefined,
      courses: formattedCourses,
    };

    console.log("Submitting", recordData.id, finalPayload);

    editUser(recordData.id, finalPayload)
      .then((res) => {
        form.resetFields();
        setUpdated(!updated);
        handleCancel();
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }

  const handlePhoneNumberChange = (e) => {
    const filteredValue = e.target.value.replace(/\D/g, "");
    form.setFieldsValue({ phone_number: filteredValue });
  };

  const onFieldsChange = (_, allFields) => {
    const isFormValid = allFields.every((field) => {
      if (!field.value || field.errors.length > 0) {
        return false;
      }
      return true;
    });
    setIsSubmitDisabled(!isFormValid);
  };

  const getUserInitialValues = (data) => {
    return {
      name: data?.name,
      email: data?.email,
      phone_number: parsePhoneNumber(data?.phone_number),
      mentor: data?.mentor_details?.id,
      faculties: data?.faculty_details?.map((faculty) => faculty.id),
      father_email: data?.parent_details?.father?.email,
      father_phone_number: parsePhoneNumber(data?.parent_details?.father?.phone_number),
      father_name: data?.parent_details?.father?.name,
      mother_email: data?.parent_details?.mother?.email,
      mother_phone_number: parsePhoneNumber(data?.parent_details?.mother?.phone_number),
      mother_name: data?.parent_details?.mother?.name,
      courses: data?.course_details?.map((course_detail) => {
        const {
          course,
          subscription_start_date,
          subscription_end_date,
          subscription_type,
        } = course_detail;

        const isValidStartDate = dayjs(subscription_start_date).isValid();
        const isValidEndDate = dayjs(subscription_end_date).isValid();

        return {
          course: course?.name,
          subscription_type,
          subscription_start_date: isValidStartDate ? dayjs(subscription_start_date) : null,
          subscription_end_date: isValidEndDate ? dayjs(subscription_end_date) : null,
        };
      }),
    };
  };

  return (
    <>
      <EditOutlined
        onClick={showModal}
        className="mr-2 cursor-pointer text-gray-600 hover:text-blue-600 transition-colors duration-300"
      />

      <Modal
        title={
          <div className="flex items-center gap-3 text-gray-800 pb-3 border-b border-gray-200">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-lg shadow-md">
              <UserOutlined className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold m-0 text-gray-900">Edit Student Profile</h2>
              <p className="text-xs text-gray-500 m-0">Update student information and course details</p>
            </div>
          </div>
        }
        open={isModalOpen}
        footer={null}
        onCancel={handleCancel}
        width={1100}
        className="edit-student-modal"
        destroyOnClose
        centered
        styles={{
          body: { maxHeight: '80vh', overflowY: 'auto', overflowX: 'hidden', padding: '10px' }
        }}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          initialValues={getUserInitialValues(recordData)}
          onFieldsChange={onFieldsChange}
          layout="vertical"
          className="space-y-5"
        >
          {/* Student Information Card */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-md">
                <UserOutlined className="text-white text-sm" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 m-0">Student Information</h3>
            </div>
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label={<span className="text-xs font-medium text-gray-600">Full Name</span>}
                  name="name"
                  className="mb-0"
                  rules={[{ required: true, message: "Please enter name" }]}
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400 text-xs" />}
                    placeholder="Enter full name"
                    className="h-9 rounded-md border-gray-300 hover:border-gray-400 focus:border-gray-600 text-sm"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label={<span className="text-xs font-medium text-gray-600">Email Address</span>}
                  name="email"
                  className="mb-0"
                  rules={[
                    { required: true, message: "Please enter email" },
                    { type: "email", message: "Invalid email" }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined className="text-gray-400 text-xs" />}
                    placeholder="student@example.com"
                    className="h-9 rounded-md border-gray-300 hover:border-gray-400 focus:border-gray-600 text-sm"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label={<span className="text-xs font-medium text-gray-600">Contact Number</span>}
                  name="phone_number"
                  className="mb-0"
                  rules={[
                    { required: true, message: "Please enter contact number" },
                    { pattern: /^\d{10}$/, message: "Must be 10 digits" }
                  ]}
                >
                  <div className="flex items-center border border-gray-300 rounded-md hover:border-gray-400 focus-within:border-gray-600 h-9 overflow-hidden">
                    <AntSelect
                      showSearch
                      value={studentCountryCode}
                      onChange={(value) => setStudentCountryCode(value)}
                      optionLabelProp="label"
                      dropdownMatchSelectWidth={false}
                      suffixIcon={<span className="text-gray-400 text-xs">▼</span>}
                      filterOption={(input, option) =>
                        (option.countryName || '').toLowerCase().includes(input.toLowerCase()) ||
                        String(option.value).includes(input)
                      }
                      dropdownStyle={{ zIndex: 10000, width: 280 }}
                      bordered={false}
                      className="country-code-integrated"
                      style={{ 
                        width: '85px',
                      }}
                    >
                      {countryCodes.map((country) => (
                        <AntSelect.Option
                          key={country.cca2}
                          value={country.code}
                          label={country.code}
                          countryName={country.name}
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span>{country.name}</span>
                            <span className="text-gray-500">({country.code})</span>
                          </div>
                        </AntSelect.Option>
                      ))}
                    </AntSelect>
                    <div className="w-px h-5 bg-gray-300"></div>
                    <div className="relative flex-1">
                      <Input
                        maxLength={10}
                        onChange={handlePhoneNumberChange}
                        placeholder="0000011111"
                        bordered={false}
                        className="h-full text-sm px-3"
                        style={{ boxShadow: 'none' }}
                      />
                      <PhoneOutlined className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                    </div>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Academic Assignment Card */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-md">
                <TeamOutlined className="text-white text-sm" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 m-0">Academic Assignment</h3>
            </div>
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span className="text-xs font-medium text-gray-600">Assigned Faculties</span>}
                  name="faculties"
                  className="mb-0"
                  getValueFromEvent={(selected) => selected ? selected.map(item => item.value) : []}
                  getValueProps={(value) => ({
                    value: facultyOptions.filter(option => value?.includes(option.value))
                  })}
                >
                  <Select
                    isMulti
                    options={facultyOptions}
                    placeholder="Select faculties"
                    styles={customSelectStyles}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span className="text-xs font-medium text-gray-600">Assigned Mentor</span>}
                  name="mentor"
                  className="mb-0"
                  getValueFromEvent={(selected) => selected?.value}
                  getValueProps={(value) => ({
                    value: mentorOptions.find(option => option.value === value)
                  })}
                >
                  <Select
                    options={mentorOptions}
                    placeholder="Select mentor"
                    styles={customSelectStyles}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Parent Information Card */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-md">
                <UserOutlined className="text-white text-sm" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 m-0">Parent Information</h3>
            </div>

            {/* Father Details */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Father's Details</span>
              </div>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    label={<span className="text-xs font-medium text-gray-600">Name</span>}
                    name="father_name"
                    className="mb-0"
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400 text-xs" />}
                      placeholder="Father's name"
                      className="h-9 rounded-md border-gray-300 hover:border-gray-400 focus:border-gray-600 text-sm"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    label={<span className="text-xs font-medium text-gray-600">Email</span>}
                    name="father_email"
                    className="mb-0"
                    rules={[{ type: "email", message: "Invalid email" }]}
                  >
                    <Input
                      prefix={<MailOutlined className="text-gray-400 text-xs" />}
                      placeholder="father@example.com"
                      className="h-9 rounded-md border-gray-300 hover:border-gray-400 focus:border-gray-600 text-sm"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    label={<span className="text-xs font-medium text-gray-600">Phone</span>}
                    name="father_phone_number"
                    className="mb-0"
                    rules={[{ pattern: /^\d{10}$/, message: "Must be 10 digits" }]}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md hover:border-gray-400 focus-within:border-gray-600 h-9 overflow-hidden">
                      <AntSelect
                        showSearch
                        value={fatherCountryCode}
                        onChange={(value) => setFatherCountryCode(value)}
                        optionLabelProp="label"
                        dropdownMatchSelectWidth={false}
                        suffixIcon={<span className="text-gray-400 text-xs">▼</span>}
                        filterOption={(input, option) =>
                          (option.countryName || '').toLowerCase().includes(input.toLowerCase()) ||
                          String(option.value).includes(input)
                        }
                        dropdownStyle={{ zIndex: 10000, width: 280 }}
                        bordered={false}
                        className="country-code-integrated"
                        style={{ 
                          width: '85px',
                        }}
                      >
                        {countryCodes.map((country) => (
                          <AntSelect.Option
                            key={country.cca2}
                            value={country.code}
                            label={country.code}
                            countryName={country.name}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <span>{country.name}</span>
                              <span className="text-gray-500">({country.code})</span>
                            </div>
                          </AntSelect.Option>
                        ))}
                      </AntSelect>
                      <div className="w-px h-5 bg-gray-300"></div>
                      <div className="relative flex-1">
                        <Input
                          maxLength={10}
                          placeholder="0000011111"
                          bordered={false}
                          className="h-full text-sm px-3"
                          style={{ boxShadow: 'none' }}
                        />
                        <PhoneOutlined className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                      </div>
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Mother Details */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Mother's Details</span>
              </div>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    label={<span className="text-xs font-medium text-gray-600">Name</span>}
                    name="mother_name"
                    className="mb-0"
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400 text-xs" />}
                      placeholder="Mother's name"
                      className="h-9 rounded-md border-gray-300 hover:border-gray-400 focus:border-gray-600 text-sm"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    label={<span className="text-xs font-medium text-gray-600">Email</span>}
                    name="mother_email"
                    className="mb-0"
                    rules={[{ type: "email", message: "Invalid email" }]}
                  >
                    <Input
                      prefix={<MailOutlined className="text-gray-400 text-xs" />}
                      placeholder="mother@example.com"
                      className="h-9 rounded-md border-gray-300 hover:border-gray-400 focus:border-gray-600 text-sm"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    label={<span className="text-xs font-medium text-gray-600">Phone</span>}
                    name="mother_phone_number"
                    className="mb-0"
                    rules={[{ pattern: /^\d{10}$/, message: "Must be 10 digits" }]}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md hover:border-gray-400 focus-within:border-gray-600 h-9 overflow-hidden">
                      <AntSelect
                        showSearch
                        value={motherCountryCode}
                        onChange={(value) => setMotherCountryCode(value)}
                        optionLabelProp="label"
                        dropdownMatchSelectWidth={false}
                        suffixIcon={<span className="text-gray-400 text-xs">▼</span>}
                        filterOption={(input, option) =>
                          (option.countryName || '').toLowerCase().includes(input.toLowerCase()) ||
                          String(option.value).includes(input)
                        }
                        dropdownStyle={{ zIndex: 10000, width: 280 }}
                        bordered={false}
                        className="country-code-integrated"
                        style={{ 
                          width: '85px',
                        }}
                      >
                        {countryCodes.map((country) => (
                          <AntSelect.Option
                            key={country.cca2}
                            value={country.code}
                            label={country.code}
                            countryName={country.name}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <span>{country.name}</span>
                              <span className="text-gray-500">({country.code})</span>
                            </div>
                          </AntSelect.Option>
                        ))}
                      </AntSelect>
                      <div className="w-px h-5 bg-gray-300"></div>
                      <div className="relative flex-1">
                        <Input
                          maxLength={10}
                          placeholder="0000011111"
                          bordered={false}
                          className="h-full text-sm px-3"
                          style={{ boxShadow: 'none' }}
                        />
                        <PhoneOutlined className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                      </div>
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          {/* Course Enrollment Card */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-300 rounded-md">
                <BookOutlined className="text-white text-sm" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 m-0">Course Enrollment</h3>
            </div>
            <Form.List
              name="courses"
              initialValue={recordData?.courses?.map((value) => ({
                course: value,
              }))}
            >
              {(fields, { add, remove }) => {
                return (
                  <>
                    <div className="space-y-3">
                      {fields.map(({ key, name, ...restField }, index) => {
                        return (
                          <div key={key} className="w-full">
                            <CourseMetaDetailsForm
                              index={index}
                              name={name}
                              fields={fields}
                              courses={courses}
                              restField={restField}
                              add={add}
                              remove={remove}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {fields.length <= 5 && (
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                        className="mt-4 h-9 rounded-md border-gray-300 text-gray-700 font-medium hover:border-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
                      >
                        Add Course
                      </Button>
                    )}
                  </>
                );
              }}
            </Form.List>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bottom-0 bg-white -mx-5 px-5 -mb-5 pb-5">
            <Button
              onClick={handleCancel}
              className="h-9 px-6 rounded-md border border-gray-300 font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <button
              htmlType="submit"
              loading={loading}
              // disabled={isSubmitDisabled}
              className="h-9 px-6 bg-gray-800 hover:bg-gray-900 border-none rounded-md font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default EditStudentUserModal;
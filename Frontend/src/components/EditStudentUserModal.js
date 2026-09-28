"use client";

import { editUser, getUsersByRole } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import { useCountryCode } from "@/hooks/useCountryCode";

import {
  EditOutlined,
  PlusOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  BookOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select as AntSelect,
  message,
} from "antd";

import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import Select from "react-select";

import CourseMetaDetailsForm from "./CourseMetaDetailsForm";

import { getCoursesInsideAuth } from "@/app/services/courseService";

import dayjs from "dayjs";


/* =========================================================
   REACT SELECT STYLES
========================================================= */

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "36px",
    height: "36px",
    borderColor: state.isFocused ? "#4b5563" : "#d1d5db",
    borderRadius: "0.375rem",
    boxShadow: "none",
    fontSize: "0.875rem",

    "&:hover": {
      borderColor: "#9ca3af",
    },
  }),

  valueContainer: (provided) => ({
    ...provided,
    height: "36px",
    padding: "0 8px",
  }),

  input: (provided) => ({
    ...provided,
    margin: "0px",
    padding: "0px",
  }),

  indicatorsContainer: (provided) => ({
    ...provided,
    height: "36px",
  }),

  placeholder: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "#9ca3af",
  }),

  menu: (provided) => ({
    ...provided,
    zIndex: 10000,
  }),

  option: (provided, state) => ({
    ...provided,
    fontSize: "0.875rem",

    backgroundColor: state.isSelected
      ? "#e5e7eb"
      : state.isFocused
        ? "#f3f4f6"
        : "white",

    color: "#374151",

    "&:active": {
      backgroundColor: "#e5e7eb",
    },
  }),

  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#e5e7eb",
    borderRadius: "0.25rem",
  }),

  multiValueLabel: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "#374151",
  }),

  multiValueRemove: (provided) => ({
    ...provided,
    color: "#6b7280",

    "&:hover": {
      backgroundColor: "#d1d5db",
      color: "#374151",
    },
  }),
};


/* =========================================================
   PHONE NUMBER LENGTH
========================================================= */

export const PHONE_NUMBER_LENGTH = {
  "+1": 10,
  "+7": 10,
  "+20": 10,
  "+27": 9,
  "+30": 10,
  "+31": 9,
  "+32": 9,
  "+33": 9,
  "+34": 9,
  "+39": 10,
  "+41": 9,
  "+43": 10,
  "+44": 10,
  "+45": 8,
  "+46": 9,
  "+47": 8,
  "+48": 9,
  "+49": 10,
  "+52": 10,
  "+54": 10,
  "+55": 11,
  "+60": 9,
  "+61": 9,
  "+62": 10,
  "+63": 10,
  "+64": 9,
  "+65": 8,
  "+66": 9,
  "+81": 10,
  "+82": 10,
  "+84": 9,
  "+86": 11,
  "+90": 10,
  "+91": 10,
  "+92": 10,
  "+93": 9,
  "+94": 9,
  "+98": 10,
  "+212": 9,
  "+213": 9,
  "+234": 10,
  "+351": 9,
  "+353": 9,
  "+355": 9,
  "+358": 10,
  "+380": 9,
  "+852": 8,
  "+880": 10,
  "+886": 9,
  "+964": 10,
  "+966": 9,
  "+971": 9,
  "+972": 9,
};


/* =========================================================
   PHONE INPUT
========================================================= */

const PhoneInput = ({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  countryCodes,
}) => {
  return (
    <div className="country-code-integrated">
      <AntSelect
        showSearch
        value={countryCode}
        onChange={onCountryCodeChange}
        optionLabelProp="label"
        dropdownMatchSelectWidth={false}
        suffixIcon={
          <span className="text-gray-400 text-xs">
            ▼
          </span>
        }
        filterOption={(input, option) =>
          (option.countryName || "")
            .toLowerCase()
            .includes(input.toLowerCase()) ||
          String(option.value).includes(input)
        }
        dropdownStyle={{
          zIndex: 10000,
          width: 315,
          borderRadius: 6,
          marginTop: 5,
        }}
        bordered={false}
        className="country-code-integrated-select"
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
              <span className="text-gray-500">
                ({country.code})
              </span>
            </div>
          </AntSelect.Option>
        ))}
      </AntSelect>

      <div className="w-px h-5 bg-gray-300"></div>

      <div className="relative flex-1">
        <Input
          value={value}
          onChange={onChange}
          maxLength={
            PHONE_NUMBER_LENGTH[countryCode] || 15
          }
          placeholder="0000011111"
          bordered={false}
          className="h-full text-sm px-3"
          style={{
            boxShadow: "none",
          }}
        />

        <PhoneOutlined
          className="
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-gray-400
            text-sm
            pointer-events-none
          "
        />
      </div>
    </div>
  );
};


/* =========================================================
   EDIT STUDENT MODAL
========================================================= */

function EditStudentUserModal({
  recordData,
  updated,
  setUpdated,
  customTrigger,
}) {
  const [form] = useForm();

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [facultyOptions, setFacultyOptions] =
    useState([]);

  const [mentorOptions, setMentorOptions] =
    useState([]);

  const [courses, setCourses] =
    useState([]);

  const { roles } = useGlobalContext();


  /* =====================================================
     STUDENT PHONE
  ===================================================== */

  const {
    countryCodes,
    selectedCountryCode: studentCountryCode,
    setSelectedCountryCode: setStudentCountryCode,
    parsePhoneNumber,
  } = useCountryCode(
    "+91",
    recordData?.phone_number
  );


  /* =====================================================
     ALTERNATIVE PHONE
  ===================================================== */

  const {
    selectedCountryCode: alternativeCountryCode,
    setSelectedCountryCode:
      setAlternativeCountryCode,
  } = useCountryCode(
    "+91",
    recordData?.alternative_number
  );


  /* =====================================================
     FATHER PHONE
  ===================================================== */

  const {
    selectedCountryCode: fatherCountryCode,
    setSelectedCountryCode: setFatherCountryCode,
  } = useCountryCode(
    "+91",
    recordData?.parent_details?.father?.phone_number
  );


  /* =====================================================
     MOTHER PHONE
  ===================================================== */

  const {
    selectedCountryCode: motherCountryCode,
    setSelectedCountryCode: setMotherCountryCode,
  } = useCountryCode(
    "+91",
    recordData?.parent_details?.mother?.phone_number
  );


  /* =====================================================
     BLOOD GROUP OPTIONS
  ===================================================== */

  const bloodGroupOptions = [
    {
      label: "A+",
      value: "A+",
    },
    {
      label: "A-",
      value: "A-",
    },
    {
      label: "B+",
      value: "B+",
    },
    {
      label: "B-",
      value: "B-",
    },
    {
      label: "AB+",
      value: "AB+",
    },
    {
      label: "AB-",
      value: "AB-",
    },
    {
      label: "O+",
      value: "O+",
    },
    {
      label: "O-",
      value: "O-",
    },
  ];


  /* =====================================================
     LOAD DATA WHEN MODAL OPENS
  ===================================================== */

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    form.setFieldsValue(
      getUserInitialValues(recordData)
    );


    /* ---------------------------------------------------
       COURSES
    --------------------------------------------------- */

    getCoursesInsideAuth()
      .then((res) => {
        setCourses(res?.data || []);
      })
      .catch((error) => {
        console.error(
          "Failed to load courses:",
          error
        );
      });


    /* ---------------------------------------------------
       FACULTIES
    --------------------------------------------------- */

    const facultyRole = roles?.find(
      ({ name }) => name === "faculty"
    );

    if (facultyRole?.id) {
      getUsersByRole({
        role: facultyRole.id,
      })
        .then((res) => {
          setFacultyOptions(
            (res?.data?.results || []).map(
              (user) => ({
                label: user.name,
                value: user.id,
              })
            )
          );
        })
        .catch((error) => {
          console.error(
            "Failed to load faculties:",
            error
          );
        });
    }


    /* ---------------------------------------------------
       MENTORS
    --------------------------------------------------- */

    const mentorRole = roles?.find(
      ({ name }) => name === "mentor"
    );

    if (mentorRole?.id) {
      getUsersByRole({
        role: mentorRole.id,
      })
        .then((res) => {
          setMentorOptions(
            (res?.data?.results || []).map(
              (user) => ({
                label: user.name,
                value: user.id,
              })
            )
          );
        })
        .catch((error) => {
          console.error(
            "Failed to load mentors:",
            error
          );
        });
    }
  }, [
    isModalOpen,
    recordData,
    roles,
    form,
  ]);


  /* =====================================================
     CANCEL
  ===================================================== */

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };


  /* =====================================================
     OPEN MODAL
  ===================================================== */

  const showModal = () => {
    setIsModalOpen(true);
  };


  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);


      /* -------------------------------------------------
         FORMAT COURSES
      ------------------------------------------------- */

      const formattedCourses = (
        formData?.courses || []
      ).map((course) => ({
        ...course,

        subscription_start_date:
          course?.subscription_start_date
            ? dayjs(
                course.subscription_start_date
              ).format("YYYY-MM-DD")
            : null,

        subscription_end_date:
          course?.subscription_end_date
            ? dayjs(
                course.subscription_end_date
              ).format("YYYY-MM-DD")
            : null,
      }));


      /* -------------------------------------------------
         PHONE NUMBERS
      ------------------------------------------------- */

      const primaryPhone =
        formData?.phone_number
          ? `${studentCountryCode}${formData.phone_number}`
          : "";


      const alternativePhone =
        formData?.alternative_number
          ? `${alternativeCountryCode}${formData.alternative_number}`
          : null;


      const fatherPhone =
        formData?.father_phone_number
          ? `${fatherCountryCode}${formData.father_phone_number}`
          : null;


      const motherPhone =
        formData?.mother_phone_number
          ? `${motherCountryCode}${formData.mother_phone_number}`
          : null;


      /* -------------------------------------------------
         DOB
      ------------------------------------------------- */

      const formattedDob =
        formData?.dob
          ? dayjs(formData.dob).format(
              "YYYY-MM-DD"
            )
          : null;


      /* -------------------------------------------------
         FINAL PAYLOAD
      ------------------------------------------------- */

      const finalPayload = {
        ...formData,

        phone_number: primaryPhone,

        alternative_number:
          alternativePhone,

        father_phone_number:
          fatherPhone,

        mother_phone_number:
          motherPhone,

        dob: formattedDob,

        courses: formattedCourses,
      };


      console.log(
        "Submitting student:",
        finalPayload
      );


      /* -------------------------------------------------
         API
      ------------------------------------------------- */

      await editUser(
        recordData.id,
        finalPayload
      );


      message.success(
        "Student profile updated successfully"
      );


      form.resetFields();

      setUpdated(!updated);

      setIsModalOpen(false);

    } catch (error) {
      console.error(
        "Failed to update student:",
        error
      );

      message.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to update student profile"
      );

    } finally {
      setLoading(false);
    }
  };


  /* =====================================================
     INITIAL VALUES
  ===================================================== */

  const getUserInitialValues = (data) => {
    const courseDetails =
      data?.course_details ||
      data?.courses ||
      [];


    return {
      /* -------------------------------------------------
         BASIC STUDENT INFORMATION
      ------------------------------------------------- */

      name: data?.name || "",

      email: data?.email || "",

      phone_number:
        parsePhoneNumber(
          data?.phone_number
        ) || "",

      alternative_number:
        parsePhoneNumber(
          data?.alternative_number
        ) || "",

      dob:
        data?.dob &&
        dayjs(data.dob).isValid()
          ? dayjs(data.dob)
          : null,

      blood_group:
        data?.blood_group || "",

      address:
        data?.address || "",


      /* -------------------------------------------------
         ACADEMIC ASSIGNMENT
      ------------------------------------------------- */

      mentor:
        data?.mentor_details?.id ||
        null,

      faculties:
        data?.faculty_details?.map(
          (faculty) => faculty.id
        ) || [],


      /* -------------------------------------------------
         FATHER
      ------------------------------------------------- */

      father_email:
        data?.parent_details?.father?.email ||
        "",

      father_phone_number:
        parsePhoneNumber(
          data?.parent_details?.father
            ?.phone_number
        ) || "",

      father_name:
        data?.parent_details?.father?.name ||
        "",


      /* -------------------------------------------------
         MOTHER
      ------------------------------------------------- */

      mother_email:
        data?.parent_details?.mother?.email ||
        "",

      mother_phone_number:
        parsePhoneNumber(
          data?.parent_details?.mother
            ?.phone_number
        ) || "",

      mother_name:
        data?.parent_details?.mother?.name ||
        "",


      /* -------------------------------------------------
         COURSES
      ------------------------------------------------- */

      courses: courseDetails.map(
        (courseDetail) => {
          const {
            course,
            subscription_start_date,
            subscription_end_date,
            subscription_type,
          } = courseDetail;


          const isValidStartDate =
            subscription_start_date &&
            dayjs(
              subscription_start_date
            ).isValid();


          const isValidEndDate =
            subscription_end_date &&
            dayjs(
              subscription_end_date
            ).isValid();


          return {
            course:
              course?.name ||
              course?.id ||
              course,

            subscription_type:
              subscription_type || "",

            subscription_start_date:
              isValidStartDate
                ? dayjs(
                    subscription_start_date
                  )
                : null,

            subscription_end_date:
              isValidEndDate
                ? dayjs(
                    subscription_end_date
                  )
                : null,
          };
        }
      ),
    };
  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      {/* =================================================
          EDIT TRIGGER
      ================================================= */}

      {customTrigger ? (
        <span
          onClick={showModal}
          className="cursor-pointer"
        >
          {customTrigger}
        </span>
      ) : (
        <EditOutlined
          onClick={showModal}
          className="
            mr-2
            cursor-pointer
            text-gray-600
            hover:text-blue-600
            transition-colors
            duration-300
          "
        />
      )}


      {/* =================================================
          MODAL
      ================================================= */}

      <Modal
        title={
          <div
            className="
              flex
              items-center
              gap-3
              text-gray-800
              pb-3
              border-b
              border-gray-200
            "
          >
            <div
              className="
                flex
                items-center
                justify-center
                w-10
                h-10
                bg-gray-300
                rounded-lg
                shadow-md
              "
            >
              <UserOutlined
                className="text-white text-lg"
              />
            </div>

            <div>
              <h2
                className="
                  text-lg
                  font-bold
                  m-0
                  text-gray-900
                "
              >
                Edit Student Profile
              </h2>

              <p
                className="
                  text-xs
                  text-gray-500
                  m-0
                "
              >
                Update student information
                and course details
              </p>
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
          body: {
            maxHeight: "80vh",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "10px",
          },
        }}
      >

        {/* =================================================
            FORM
        ================================================= */}

        <Form
          form={form}
          onFinish={handleSubmit}
          initialValues={getUserInitialValues(
            recordData
          )}
          layout="vertical"
          className="space-y-5"
        >

          {/* =================================================
              STUDENT INFORMATION
          ================================================= */}

          <div
            className="
              bg-gray-50
              rounded-lg
              p-5
              border
              border-gray-200
            "
          >

            {/* SECTION HEADER */}

            <div
              className="
                flex
                items-center
                gap-2
                mb-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-center
                  w-8
                  h-8
                  bg-gray-300
                  rounded-md
                "
              >
                <UserOutlined
                  className="
                    text-white
                    text-sm
                  "
                />
              </div>

              <h3
                className="
                  text-sm
                  font-bold
                  text-gray-800
                  m-0
                "
              >
                Student Information
              </h3>
            </div>


            <Row gutter={[16, 12]}>

              {/* =========================================
                  FULL NAME
              ========================================= */}

              <Col
                xs={24}
                sm={12}
                lg={8}
              >
                <Form.Item
                  label={
                    <span
                      className="
                        text-xs
                        font-medium
                        text-gray-600
                      "
                    >
                      Full Name
                    </span>
                  }
                  name="name"
                  className="mb-0"
                  rules={[
                    {
                      required: true,
                      message:
                        "Please enter name",
                    },
                  ]}
                >
                  <Input
                    prefix={
                      <UserOutlined
                        className="
                          text-gray-400
                          text-xs
                        "
                      />
                    }
                    placeholder="Enter full name"
                    className="input-field"
                  />
                </Form.Item>
              </Col>


              {/* =========================================
                  EMAIL
              ========================================= */}

              <Col
                xs={24}
                sm={12}
                lg={8}
              >
                <Form.Item
                  label={
                    <span
                      className="
                        text-xs
                        font-medium
                        text-gray-600
                      "
                    >
                      Email Address
                    </span>
                  }
                  name="email"
                  className="mb-0"
                  rules={[
                    {
                      required: true,
                      message:
                        "Please enter email",
                    },
                    {
                      type: "email",
                      message:
                        "Invalid email",
                    },
                  ]}
                >
                  <Input
                    prefix={
                      <MailOutlined
                        className="
                          text-gray-400
                          text-xs
                        "
                      />
                    }
                    placeholder="student@example.com"
                    className="input-field"
                  />
                </Form.Item>
              </Col>


              {/* =========================================
                  CONTACT NUMBER
              ========================================= */}

              <Col
                xs={24}
                sm={12}
                lg={8}
              >
                <Form.Item
                  label={
                    <span
                      className="
                        text-xs
                        font-medium
                        text-gray-600
                      "
                    >
                      Contact Number
                    </span>
                  }
                  name="phone_number"
                  className="mb-0"
                  rules={[
                    {
                      required: true,
                      message:
                        "Please enter contact number",
                    },
                    {
                      validator(_, value) {
                        if (!value) {
                          return Promise.resolve();
                        }

                        const length =
                          PHONE_NUMBER_LENGTH[
                            studentCountryCode
                          ] || 15;

                        if (
                          value.length !==
                          length
                        ) {
                          return Promise.reject(
                            new Error(
                              `Must be ${length} digits`
                            )
                          );
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                  normalize={(value) =>
                    value?.replace(/\D/g, "")
                  }
                >
                  <PhoneInput
                    countryCode={
                      studentCountryCode
                    }
                    onCountryCodeChange={
                      setStudentCountryCode
                    }
                    countryCodes={
                      countryCodes
                    }
                  />
                </Form.Item>
              </Col>


              {/* =========================================
                  ALTERNATIVE NUMBER
              ========================================= */}

              <Col
                xs={24}
                sm={12}
                lg={8}
              >
                <Form.Item
                  label={
                    <span
                      className="
                        text-xs
                        font-medium
                        text-gray-600
                      "
                    >
                      Alternative Number
                    </span>
                  }
                  name="alternative_number"
                  className="mb-0"
                  rules={[
                    {
                      validator(_, value) {
                        if (!value) {
                          return Promise.resolve();
                        }

                        const length =
                          PHONE_NUMBER_LENGTH[
                            alternativeCountryCode
                          ] || 15;

                        if (
                          value.length !==
                          length
                        ) {
                          return Promise.reject(
                            new Error(
                              `Must be ${length} digits`
                            )
                          );
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                  normalize={(value) =>
                    value?.replace(/\D/g, "")
                  }
                >
                  <PhoneInput
                    countryCode={
                      alternativeCountryCode
                    }
                    onCountryCodeChange={
                      setAlternativeCountryCode
                    }
                    countryCodes={
                      countryCodes
                    }
                  />
                </Form.Item>
              </Col>


              {/* =========================================
                  DATE OF BIRTH
              ========================================= */}

              <Col
                xs={24}
                sm={12}
                lg={8}
              >
                <Form.Item
                  label={
                    <span
                      className="
                        text-xs
                        font-medium
                        text-gray-600
                      "
                    >
                      Date of Birth
                    </span>
                  }
                  name="dob"
                  className="mb-0"
                >
                  <DatePicker
                    className="w-full h-9"
                    placeholder="Select date of birth"
                    format="DD-MM-YYYY"
                    suffixIcon={
                      <CalendarOutlined
                        className="text-gray-400"
                      />
                    }
                    disabledDate={(current) =>
                      current &&
                      current.isAfter(
                        dayjs(),
                        "day"
                      )
                    }
                  />
                </Form.Item>
              </Col>


              {/* =========================================
                  BLOOD GROUP
              ========================================= */}

              <Col
                xs={24}
                sm={12}
                lg={8}
              >
                <Form.Item
                  label={
                    <span
                      className="
                        text-xs
                        font-medium
                        text-gray-600
                      "
                    >
                      Blood Group
                    </span>
                  }
                  name="blood_group"
                  className="mb-0"
                >
                  <AntSelect
                    placeholder="Select blood group"
                    options={
                      bloodGroupOptions
                    }
                    allowClear
                    className="w-full"
                  />
                </Form.Item>
              </Col>


              {/* =========================================
                  ADDRESS
              ========================================= */}

              <Col xs={24}>
                <Form.Item
                  label={
                    <span
                      className="
                        text-xs
                        font-medium
                        text-gray-600
                      "
                    >
                      Address
                    </span>
                  }
                  name="address"
                  className="mb-0"
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Enter student address"
                    className="input-field"
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </Col>

            </Row>
          </div>


          {/* =================================================
              ACADEMIC ASSIGNMENT
          ================================================= */}

          <div
            className="
              bg-gray-50
              rounded-lg
              p-5
              border
              border-gray-200
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                mb-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-center
                  w-8
                  h-8
                  bg-gray-300
                  rounded-md
                "
              >
                <TeamOutlined
                  className="
                    text-white
                    text-sm
                  "
                />
              </div>

              <h3
                className="
                  text-sm
                  font-bold
                  text-gray-800
                  m-0
                "
              >
                Academic Assignment
              </h3>
            </div>


            <Row gutter={[16, 12]}>

              {/* =========================================
                  FACULTIES
              ========================================= */}

              <Col
                xs={24}
                sm={12}
              >
                <Form.Item
                  label={
                    <span
                      className="
                        text-xs
                        font-medium
                        text-gray-600
                      "
                    >
                      Assigned Faculties
                    </span>
                  }
                  name="faculties"
                  className="mb-0"
                  getValueFromEvent={(
                    selected
                  ) =>
                    selected
                      ? selected.map(
                          (item) =>
                            item.value
                        )
                      : []
                  }
                  getValueProps={(value) => ({
                    value:
                      facultyOptions.filter(
                        (option) =>
                          value?.includes(
                            option.value
                          )
                      ),
                  })}
                >
                  <Select
                    isMulti
                    options={
                      facultyOptions
                    }
                    placeholder="Select faculties"
                    styles={
                      customSelectStyles
                    }
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </Form.Item>
              </Col>


              {/* =========================================
                  MENTOR
              ========================================= */}

              <Col
                xs={24}
                sm={12}
              >
                <Form.Item
                  label={
                    <span
                      className="
                        text-xs
                        font-medium
                        text-gray-600
                      "
                    >
                      Assigned Mentor
                    </span>
                  }
                  name="mentor"
                  className="mb-0"
                  getValueFromEvent={(
                    selected
                  ) =>
                    selected?.value ||
                    null
                  }
                  getValueProps={(value) => ({
                    value:
                      mentorOptions.find(
                        (option) =>
                          option.value ===
                          value
                      ),
                  })}
                >
                  <Select
                    options={
                      mentorOptions
                    }
                    placeholder="Select mentor"
                    styles={
                      customSelectStyles
                    }
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </Form.Item>
              </Col>

            </Row>
          </div>


          {/* =================================================
              PARENT INFORMATION
          ================================================= */}

          <div
            className="
              bg-gray-50
              rounded-lg
              p-5
              border
              border-gray-200
            "
          >

            {/* HEADER */}

            <div
              className="
                flex
                items-center
                gap-2
                mb-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-center
                  w-8
                  h-8
                  bg-gray-300
                  rounded-md
                "
              >
                <UserOutlined
                  className="
                    text-white
                    text-sm
                  "
                />
              </div>

              <h3
                className="
                  text-sm
                  font-bold
                  text-gray-800
                  m-0
                "
              >
                Parent Information
              </h3>
            </div>


            {/* =============================================
                FATHER
            ============================================= */}

            <div className="mb-4">

              <div
                className="
                  flex
                  items-center
                  gap-2
                  mb-3
                  pb-2
                  border-b
                  border-gray-300
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-gray-700
                    uppercase
                    tracking-wide
                  "
                >
                  Father's Details
                </span>
              </div>


              <Row gutter={[16, 12]}>

                {/* FATHER NAME */}

                <Col
                  xs={24}
                  sm={12}
                  lg={8}
                >
                  <Form.Item
                    label={
                      <span
                        className="
                          text-xs
                          font-medium
                          text-gray-600
                        "
                      >
                        Name
                      </span>
                    }
                    name="father_name"
                    className="mb-0"
                  >
                    <Input
                      prefix={
                        <UserOutlined
                          className="
                            text-gray-400
                            text-xs
                          "
                        />
                      }
                      placeholder="Father's name"
                      className="input-field"
                    />
                  </Form.Item>
                </Col>


                {/* FATHER EMAIL */}

                <Col
                  xs={24}
                  sm={12}
                  lg={8}
                >
                  <Form.Item
                    label={
                      <span
                        className="
                          text-xs
                          font-medium
                          text-gray-600
                        "
                      >
                        Email
                      </span>
                    }
                    name="father_email"
                    className="mb-0"
                    rules={[
                      {
                        type: "email",
                        message:
                          "Invalid email",
                      },
                    ]}
                  >
                    <Input
                      prefix={
                        <MailOutlined
                          className="
                            text-gray-400
                            text-xs
                          "
                        />
                      }
                      placeholder="father@example.com"
                      className="input-field"
                    />
                  </Form.Item>
                </Col>


                {/* FATHER PHONE */}

                <Col
                  xs={24}
                  sm={12}
                  lg={8}
                >
                  <Form.Item
                    label={
                      <span
                        className="
                          text-xs
                          font-medium
                          text-gray-600
                        "
                      >
                        Phone
                      </span>
                    }
                    name="father_phone_number"
                    className="mb-0"
                    rules={[
                      {
                        validator(
                          _,
                          value
                        ) {
                          if (!value) {
                            return Promise.resolve();
                          }

                          const length =
                            PHONE_NUMBER_LENGTH[
                              fatherCountryCode
                            ] || 15;

                          if (
                            value.length !==
                            length
                          ) {
                            return Promise.reject(
                              new Error(
                                `Must be ${length} digits`
                              )
                            );
                          }

                          return Promise.resolve();
                        },
                      },
                    ]}
                    normalize={(value) =>
                      value?.replace(
                        /\D/g,
                        ""
                      )
                    }
                  >
                    <PhoneInput
                      countryCode={
                        fatherCountryCode
                      }
                      onCountryCodeChange={
                        setFatherCountryCode
                      }
                      countryCodes={
                        countryCodes
                      }
                    />
                  </Form.Item>
                </Col>

              </Row>
            </div>


            {/* =============================================
                MOTHER
            ============================================= */}

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  mb-3
                  pb-2
                  border-b
                  border-gray-300
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-gray-700
                    uppercase
                    tracking-wide
                  "
                >
                  Mother's Details
                </span>
              </div>


              <Row gutter={[16, 12]}>

                {/* MOTHER NAME */}

                <Col
                  xs={24}
                  sm={12}
                  lg={8}
                >
                  <Form.Item
                    label={
                      <span
                        className="
                          text-xs
                          font-medium
                          text-gray-600
                        "
                      >
                        Name
                      </span>
                    }
                    name="mother_name"
                    className="mb-0"
                  >
                    <Input
                      prefix={
                        <UserOutlined
                          className="
                            text-gray-400
                            text-xs
                          "
                        />
                      }
                      placeholder="Mother's name"
                      className="input-field"
                    />
                  </Form.Item>
                </Col>


                {/* MOTHER EMAIL */}

                <Col
                  xs={24}
                  sm={12}
                  lg={8}
                >
                  <Form.Item
                    label={
                      <span
                        className="
                          text-xs
                          font-medium
                          text-gray-600
                        "
                      >
                        Email
                      </span>
                    }
                    name="mother_email"
                    className="mb-0"
                    rules={[
                      {
                        type: "email",
                        message:
                          "Invalid email",
                      },
                    ]}
                  >
                    <Input
                      prefix={
                        <MailOutlined
                          className="
                            text-gray-400
                            text-xs
                          "
                        />
                      }
                      placeholder="mother@example.com"
                      className="input-field"
                    />
                  </Form.Item>
                </Col>


                {/* MOTHER PHONE */}

                <Col
                  xs={24}
                  sm={12}
                  lg={8}
                >
                  <Form.Item
                    label={
                      <span
                        className="
                          text-xs
                          font-medium
                          text-gray-600
                        "
                      >
                        Phone
                      </span>
                    }
                    name="mother_phone_number"
                    className="mb-0"
                    rules={[
                      {
                        validator(
                          _,
                          value
                        ) {
                          if (!value) {
                            return Promise.resolve();
                          }

                          const length =
                            PHONE_NUMBER_LENGTH[
                              motherCountryCode
                            ] || 15;

                          if (
                            value.length !==
                            length
                          ) {
                            return Promise.reject(
                              new Error(
                                `Must be ${length} digits`
                              )
                            );
                          }

                          return Promise.resolve();
                        },
                      },
                    ]}
                    normalize={(value) =>
                      value?.replace(
                        /\D/g,
                        ""
                      )
                    }
                  >
                    <PhoneInput
                      countryCode={
                        motherCountryCode
                      }
                      onCountryCodeChange={
                        setMotherCountryCode
                      }
                      countryCodes={
                        countryCodes
                      }
                    />
                  </Form.Item>
                </Col>

              </Row>
            </div>

          </div>


          {/* =================================================
              COURSE ENROLLMENT
          ================================================= */}

          <div
            className="
              bg-gray-50
              rounded-lg
              p-5
              border
              border-gray-200
            "
          >

            {/* HEADER */}

            <div
              className="
                flex
                items-center
                gap-2
                mb-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-center
                  w-8
                  h-8
                  bg-gray-300
                  rounded-md
                "
              >
                <BookOutlined
                  className="
                    text-white
                    text-sm
                  "
                />
              </div>

              <h3
                className="
                  text-sm
                  font-bold
                  text-gray-800
                  m-0
                "
              >
                Course Enrollment
              </h3>
            </div>


            <Form.List
              name="courses"
            >
              {(
                fields,
                { add, remove }
              ) => {
                return (
                  <>
                    <div className="space-y-3">

                      {fields.map(
                        ({
                          key,
                          name,
                          ...restField
                        }, index) => {

                          return (
                            <div
                              key={key}
                              className="w-full"
                            >
                              <CourseMetaDetailsForm
                                index={index}
                                name={name}
                                fields={fields}
                                courses={courses}
                                restField={
                                  restField
                                }
                                add={add}
                                remove={
                                  remove
                                }
                              />
                            </div>
                          );
                        }
                      )}

                    </div>


                    {/* ADD COURSE */}

                    {fields.length < 6 && (
                      <Button
                        type="dashed"
                        onClick={() =>
                          add()
                        }
                        block
                        icon={
                          <PlusOutlined />
                        }
                        className="
                          mt-4
                          h-9
                          rounded-md
                          border-gray-300
                          text-gray-700
                          font-medium
                          hover:border-gray-500
                          hover:bg-gray-100
                          hover:text-gray-900
                          transition-all
                          duration-200
                        "
                      >
                        Add Course
                      </Button>
                    )}

                  </>
                );
              }}
            </Form.List>
          </div>


          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div
            className="
              flex
              justify-end
              gap-3
              pt-4
              border-t
              border-gray-200
              bottom-0
              bg-white
            "
          >

            <Button
              onClick={handleCancel}
              className="
                cancel-button
                h-9
                px-6
              "
            >
              Cancel
            </Button>


            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="
                action-button
                h-9
                px-6
              "
            >
              Save Changes
            </Button>

          </div>

        </Form>
      </Modal>
    </>
  );
}


export default EditStudentUserModal;
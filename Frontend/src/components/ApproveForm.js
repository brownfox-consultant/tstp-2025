import { approveStudent, getUsersByRole } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import {
  CloseOutlined,
  PlusCircleOutlined,
  PlusCircleTwoTone,
  PlusOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Popover,
  Radio,
  Row,
} from "antd";
import Select, { components } from "react-select";
import { ChevronIcon } from "./icons/dashboard-icons";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import CourseMetaDetailsForm from "./CourseMetaDetailsForm";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { useParams, useRouter } from "next/navigation";
import { useMediaQuery } from "react-responsive";

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
    data?.parent_details?.father?.name
  );
  const [showMotherForm, setShowMotherForm] = useState(
    data?.parent_details?.mother?.name
  );
  const [approveLoader, setApproveLoader] = useState(false);
  const [form] = useForm();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const { roles } = useGlobalContext();
  const [courses, setCourses] = useState([]);
  const router = useRouter();
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });

  const { id, testId } = useParams();

  useEffect(() => {
    getCoursesInsideAuth()
      .then((res) => {
        setCourses(res.data);
      })
      .catch((err) => console.log(err));

    // return () => {
    //   window.sessionStorage.removeItem("requireParentDetails");
    // };
  }, []);

  useEffect(() => {
    if (Array.isArray(roles) && roles.length != 0) {
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

      requireParentDetails &&
        getUsersByRole({
          role: roles.find(({ name }) => name == "parent").id,
        }).then((res) => {
          setParentOptions(
            res.data.results.map((user) => {
              return {
                label: user.name,
                value: user.id,
              };
            })
          );
        });
    }
  }, [roles]);

  const onFinish = (values) => {
    setApproveLoader(true);
    let payload = {
      ...values,
      is_temp_user,
      student: data.id,
      courses: values.courses.map((course) => {
  return {
    ...course,
    subscription_start_date: dayjs(course.subscription_start_date).format("YYYY-MM-DD"),
    subscription_end_date: dayjs(course.subscription_end_date).format("YYYY-MM-DD"),
  };
}),

      // subscription_start_date:
      //   values.subscription_start_date.format("YYYY-MM-DD"),
      // subscription_end_date: values.subscription_end_date.format("YYYY-MM-DD"),
    };

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

  // const userInitialValues = {
  //   mentor: data?.mentor_details?.id,
  //   faculty: data?.faculty_details?.id,
  //   name: data?.name,

  // };

  const getUserInitialValues = (data) => {
    return {
      name: data?.name,
      mentor: data?.mentor_details?.id,
      faculty: data?.faculty_details?.id,
      father_email: data?.parent_details?.father?.email,
      father_phone_number: data?.parent_details?.father?.phone_number,
      father_name: data?.parent_details?.father?.name,
      mother_email: data?.parent_details?.mother?.email,
      mother_phone_number: data?.parent_details?.mother?.phone_number,
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

  // Custom Dropdown Indicator for react-select
  const DropdownIndicator = (props) => {
    return (
      <components.DropdownIndicator {...props}>
        <ChevronIcon className="w-4 h-4" isOpen={props.selectProps.menuIsOpen} color="#805830" />
      </components.DropdownIndicator>
    );
  };

  // Custom components for react-select
  const customComponents = {
    DropdownIndicator,
  };

  return (
    <>
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
                <Select
                  placeholder="Select Faculty"
                  options={facultyOptions}
                  components={customComponents}
                  isClearable
                  isSearchable
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  onChange={(selected) => {
                    form.setFieldValue('faculty', selected?.value || null);
                  }}
                  value={facultyOptions.find(opt => opt.value === form.getFieldValue('faculty')) || null}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label={<div className="text-base font-semibold text-gray-700">Mentor</div>}
                name="mentor"
              >
                <Select
                  placeholder="Select Mentor"
                  options={mentorOptions}
                  components={customComponents}
                  isClearable
                  isSearchable
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  onChange={(selected) => {
                    form.setFieldValue('mentor', selected?.value || null);
                  }}
                  value={mentorOptions.find(opt => opt.value === form.getFieldValue('mentor')) || null}
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

            <Row gutter={[16, 16]}>
              {/* Father Details */}
              <Col xs={24} xl={12}>
                {showFatherForm ? (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200 h-full">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-base font-bold text-gray-800">Father Details</div>
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
                        className="text-red-500 hover:text-red-700"
                      />
                    </div>
                    
                    <Row gutter={[12, 12]}>
                      <Col xs={24}>
                        <Form.Item
                          name="father_name"
                          label={<div className="text-sm font-semibold text-gray-700">Name</div>}
                          rules={[{ required: true, message: "Please input father name!" }]}
                          style={{ marginBottom: 8 }}
                        >
                          <Input placeholder="Enter father's name" className="h-10" />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24}>
                        <Form.Item
                          label={<div className="text-sm font-semibold text-gray-700">Email</div>}
                          name="father_email"
                          rules={[
                            { required: true, message: "Please input your father's email!" },
                            { type: "email", message: "The input is not a valid email!" },
                          ]}
                          style={{ marginBottom: 8 }}
                        >
                          <Input placeholder="Enter father's email" className="h-10" />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24}>
                        <Form.Item
                          label={<div className="text-sm font-semibold text-gray-700">Contact Number</div>}
                          name="father_phone_number"
                          rules={[
                            { required: true, message: "Please enter father's contact number!" },
                            { pattern: /^\d{10}$/, message: "Contact number must be exactly 10 digits long" },
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            maxLength={10}
                            onChange={handleFatherPhoneNumberChange}
                            placeholder="Enter 10-digit phone number"
                            className="h-10"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center">
                    <Form.Item
                      label={<div className="text-sm font-semibold text-gray-700">Father</div>}
                      name="father_id"
                      style={{ marginBottom: 8 }}
                    >
                      <Select
                        placeholder="Select Father"
                        options={parentOptions}
                        components={customComponents}
                        isClearable
                        isSearchable
                        isDisabled={showFatherForm}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        onChange={(selected) => {
                          form.setFieldValue('father_id', selected?.value || null);
                        }}
                        value={parentOptions.find(opt => opt.value === form.getFieldValue('father_id')) || null}
                      />
                    </Form.Item>
                    <Button
                      type="dashed"
                      icon={<PlusCircleTwoTone />}
                      onClick={() => {
                        form.setFieldValue("father_id", null);
                        setShowFatherForm(!showFatherForm);
                      }}
                      className="h-10 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:text-blue-600 font-medium w-full"
                    >
                      Add Father Details
                    </Button>
                  </div>
                )}
              </Col>

              {/* Mother Details */}
              <Col xs={24} xl={12}>
                {showMotherForm ? (
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200 h-full">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-base font-bold text-gray-800">Mother Details</div>
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
                        className="text-red-500 hover:text-red-700"
                      />
                    </div>
                    
                    <Row gutter={[12, 12]}>
                      <Col xs={24}>
                        <Form.Item
                          name="mother_name"
                          label={<div className="text-sm font-semibold text-gray-700">Name</div>}
                          rules={[{ required: true, message: "Please input your name!" }]}
                          style={{ marginBottom: 8 }}
                        >
                          <Input placeholder="Enter mother's name" className="h-10" />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24}>
                        <Form.Item
                          label={<div className="text-sm font-semibold text-gray-700">Email</div>}
                          name="mother_email"
                          rules={[
                            { required: true, message: "Please input your mother's email!" },
                            { type: "email", message: "The input is not a valid email!" },
                          ]}
                          style={{ marginBottom: 8 }}
                        >
                          <Input placeholder="Enter mother's email" className="h-10" />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24}>
                        <Form.Item
                          label={<div className="text-sm font-semibold text-gray-700">Contact Number</div>}
                          name="mother_phone_number"
                          rules={[
                            { required: true, message: "Please enter mother's contact number!" },
                            { pattern: /^\d{10}$/, message: "Contact number must be exactly 10 digits long" },
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            maxLength={10}
                            onChange={handleMotherPhoneNumberChange}
                            placeholder="Enter 10-digit phone number"
                            className="h-10"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center">
                    <Form.Item
                      label={<div className="text-sm font-semibold text-gray-700">Mother</div>}
                      name="mother_id"
                      style={{ marginBottom: 8 }}
                    >
                      <Select
                        placeholder="Select Mother"
                        options={parentOptions}
                        components={customComponents}
                        isClearable
                        isSearchable
                        isDisabled={showMotherForm}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        onChange={(selected) => {
                          form.setFieldValue('mother_id', selected?.value || null);
                        }}
                        value={parentOptions.find(opt => opt.value === form.getFieldValue('mother_id')) || null}
                      />
                    </Form.Item>
                    <Button
                      type="dashed"
                      icon={<PlusCircleTwoTone />}
                      onClick={() => {
                        form.setFieldValue("mother_id", null);
                        form.validateFields();
                        setShowMotherForm(!showMotherForm);
                      }}
                      className="h-10 border-2 border-dashed border-pink-300 hover:border-pink-500 hover:text-pink-600 font-medium w-full"
                    >
                      Add Mother Details
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

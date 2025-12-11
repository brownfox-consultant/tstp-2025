import { approveStudent, getUsersByRole } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import {
  CloseOutlined,
  PlusCircleOutlined,
  PlusCircleTwoTone,
  PlusOutlined,
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
  Select,
} from "antd";
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

  return (
    <>
      <Form
        className="p-10"
        form={form}
        onFinish={onFinish}
        onFieldsChange={onFieldsChange}
        initialValues={userInitalValues}
      >
        <Row gutter={[48, 8]}>
          <Col span={24} sm={24} md={12} lg={8}>
            <Form.Item
              label="Name"
              wrapperCol={{ span: 12 }}
              labelCol={{ span: 5, lg: 4 }}
              labelAlign="left"
            >
              <Input placeholder={data.name} disabled />
            </Form.Item>
          </Col>

          <Col span={24} sm={24} md={12} lg={8}>
            <Form.Item
              label="Faculty"
              name="faculty"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              wrapperCol={{ span: 12 }}
              labelCol={{ span: 5, lg: 5 }}
              labelAlign="left"
              showSearch
            >
              <Select
                placeholder="Select Faculty"
                options={facultyOptions}
              ></Select>
            </Form.Item>
          </Col>
          <Col span={24} sm={24} md={12} lg={8}>
            <Form.Item
              wrapperCol={{ span: 12 }}
              labelCol={{ span: 5, lg: 5 }}
              labelAlign="left"
              label="Mentor"
              name="mentor"
            >
              <Select
                placeholder="Select Mentor"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={mentorOptions}
              ></Select>
            </Form.Item>
          </Col>
        </Row>
        {requireParentDetails && (
          <>
            {showFatherForm ? (
              <Col
                className="w-full border-slate-300 border-2 rounded-md py-3 px-3"
                style={{ marginTop: 10, marginBottom: 10 }}
              >
                <div
                  className=""
                  style={{ marginLeft: 10, marginRight: 10, marginTop: 5 }}
                >
                  <div className="flex justify-between">
                    <div className="text-base font-semibold">
                      Father Details
                    </div>
                    <CloseOutlined
                      onClick={() => {
                        form.setFieldsValue({
                          father_name: null,
                          father_email: null,
                          father_phone_number: null,
                        });
                        form.validateFields();
                        setShowFatherForm(false);
                      }}
                    />
                  </div>
                  <Divider className="my-4" />
                  <Row gutter={8}>
                    <Col sm={24} md={12} lg={12}>
                      <Form.Item
                        name="father_name"
                        label="Name"
                        labelAlign="left"
                        labelCol={{ span: 8, md: 6, lg: 3 }}
                        wrapperCol={{ span: 10, md: 24, lg: 9 }}
                        rules={[
                          {
                            required: true,
                            message: "Please input father name!",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={8}>
                    <Col sm={24} md={12} lg={12}>
                      <Form.Item
                        labelAlign="left"
                        labelCol={{ span: 8, md: 6, lg: 3 }}
                        wrapperCol={{ span: 10, md: 24, lg: 9 }}
                        label="Email"
                        name="father_email"
                        rules={[
                          {
                            required: true,
                            message: "Please input your father's email!",
                          },
                          {
                            type: "email",
                            message: "The input is not a valid email!",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col sm={24} md={12} lg={12}>
                      <Form.Item
                        labelAlign="left"
                        wrapperCol={{ span: 10, md: 24, lg: 9 }}
                        label="Contact Number"
                        name="father_phone_number"
                        rules={[
                          {
                            required: true,
                            message: "Please enter father's contact number!",
                          },
                          {
                            pattern: /^\d{10}$/,
                            message:
                              "Contact number must be exactly 10 digits long",
                          },
                        ]}
                      >
                        <Input
                          maxLength={10}
                          onChange={handleFatherPhoneNumberChange}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </Col>
            ) : (
              <div className="" style={{ marginTop: 10 }}>
                <Row gutter={8}>
                  <Col span={22} md={12} lg={5}>
                    <Form.Item
                      label="Father"
                      wrapperCol={{ span: 18, lg: 18 }}
                      labelCol={{ span: 5, lg: 6 }}
                      labelAlign="left"
                      name="father_id"
                      rules={[]}
                    >
                      <Select
                        showSearch
                        placeholder="Select Father"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        disabled={showFatherForm}
                        options={parentOptions}
                      ></Select>
                    </Form.Item>
                  </Col>
                  <Col span={2} className="">
                    {isMobile ? (
                      <Popover title="Add Father Details">
                        <PlusCircleTwoTone
                          className="mt-12"
                          onClick={() => {
                            form.setFieldValue("father_id", null);
                            setShowFatherForm(!showFatherForm);
                          }}
                        />
                      </Popover>
                    ) : (
                      <Button
                        shape="round"
                        type="default"
                        icon={<PlusCircleTwoTone />}
                        onClick={() => {
                          form.setFieldValue("father_id", null);
                          setShowFatherForm(!showFatherForm);
                        }}
                      >
                        Add Father Details
                      </Button>
                    )}
                  </Col>
                </Row>
              </div>
            )}
          </>
        )}

        {requireParentDetails && (
          <>
            {showMotherForm ? (
              <Col
                className="w-full border-slate-300 border-2 rounded-md py-3 px-3"
                style={{ marginTop: 10, marginBottom: 10 }}
              >
                <div
                  className=""
                  style={{ marginLeft: 10, marginRight: 10, marginTop: 5 }}
                >
                  <div className="flex justify-between">
                    <div className="text-base font-semibold">
                      Mother Details
                    </div>
                    <CloseOutlined
                      classID=""
                      onClick={() => {
                        form.setFieldsValue({
                          mother_name: null,
                          mother_email: null,
                          mother_phone_number: null,
                        });
                        form.validateFields();
                        setShowMotherForm(false);
                      }}
                    />
                  </div>
                  <Divider className="my-4" />
                  <Row gutter={8}>
                    <Col sm={24} md={12} lg={12}>
                      <Form.Item
                        name="mother_name"
                        label="Name"
                        labelAlign="left"
                        labelCol={{ span: 8, md: 6, lg: 3 }}
                        wrapperCol={{ span: 10, md: 24, lg: 9 }}
                        rules={[
                          {
                            required: true,
                            message: "Please input your name!",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={8}>
                    <Col sm={24} md={12} lg={12}>
                      <Form.Item
                        labelAlign="left"
                        labelCol={{ span: 8, md: 6, lg: 3 }}
                        wrapperCol={{ span: 10, md: 24, lg: 9 }}
                        label="Email"
                        name="mother_email"
                        rules={[
                          {
                            required: true,
                            message: "Please input your mother's email!",
                          },
                          {
                            type: "email",
                            message: "The input is not a valid email!",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col sm={24} md={12} lg={12}>
                      <Form.Item
                        labelAlign="left"
                        wrapperCol={{ span: 10, md: 24, lg: 9 }}
                        label="Contact Number"
                        name="mother_phone_number"
                        rules={[
                          {
                            required: true,
                            message: "Please enter mother's contact number!",
                          },
                          {
                            pattern: /^\d{10}$/,
                            message:
                              "Contact number must be exactly 10 digits long",
                          },
                        ]}
                      >
                        <Input
                          maxLength={10}
                          onChange={handleMotherPhoneNumberChange}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </Col>
            ) : (
              <div className="" style={{ marginTop: 10 }}>
                <Row gutter={8}>
                  <Col span={22} md={12} lg={5}>
                    <Form.Item
                      label="Mother"
                      wrapperCol={{ span: 18, lg: 18 }}
                      labelCol={{ span: 5, lg: 6 }}
                      labelAlign="left"
                      name="mother_id"
                      // rules={[{ message: "Please select a parent!" }]}
                    >
                      <Select
                        placeholder="Select Mother"
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        disabled={showMotherForm}
                        options={parentOptions}
                      ></Select>
                    </Form.Item>
                  </Col>
                  <Col span={2} className="">
                    {isMobile ? (
                      <Popover title="Add Mother Details">
                        <PlusCircleTwoTone
                          className="mt-12"
                          onClick={() => {
                            form.setFieldValue("mother_id", null);
                            form.validateFields();
                            setShowMotherForm(!showMotherForm);
                          }}
                        />
                      </Popover>
                    ) : (
                      <Button
                        shape="round"
                        type="default"
                        icon={<PlusCircleTwoTone />}
                        onClick={() => {
                          form.setFieldValue("mother_id", null);
                          form.validateFields();
                          setShowMotherForm(!showMotherForm);
                        }}
                      >
                        Add Mother Details
                      </Button>
                    )}
                  </Col>
                </Row>
              </div>
            )}
          </>
        )}
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
              <Row gutter={[16, 8]} justify="center">
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
                  <Col span={16} md={7} lg={4}>
                    <Form.Item className="">
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        Add course
                      </Button>
                    </Form.Item>{" "}
                  </Col>
                )}
              </Row>
            );
          }}
        </Form.List>

        <div className="flex justify-center" style={{ marginTop: 15 }}>
          <Button
            type="primary"
            htmlType="submit"
            disabled={isSubmitDisabled}
            loading={approveLoader}
          >
            Approve
          </Button>
        </div>
      </Form>
    </>
  );
}

export default ApproveForm;

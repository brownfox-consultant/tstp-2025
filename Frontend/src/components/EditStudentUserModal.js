import { editUser, getUsersByRole } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Modal, Row, Select } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState } from "react";
import CourseMetaDetailsForm from "./CourseMetaDetailsForm";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import dayjs from "dayjs";

function EditStudentUserModal({ recordData, updated, setUpdated }) {
  const [form] = useForm();
  const [isModalOpen, setIsModalOpen] = useState();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [mentorOptions, setMentorOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const { roles } = useGlobalContext();

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

  // Format the dates in formData.courses
  const formattedCourses = formData.courses.map((course) => ({
    ...course,
    subscription_start_date: dayjs(course.subscription_start_date).format("YYYY-MM-DD"),
    subscription_end_date: dayjs(course.subscription_end_date).format("YYYY-MM-DD"),
  }));

  const finalPayload = {
    ...formData,
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
      phone_number: data?.phone_number,
      mentor: data?.mentor_details?.id,
      faculties: data?.faculty_details?.map((faculty) => faculty.id),
      father_email: data?.parent_details?.father?.email,
      father_phone_number: data?.parent_details?.father?.phone_number,
      father_name: data?.parent_details?.father?.name,
      mother_email: data?.parent_details?.mother?.email,
      mother_phone_number: data?.parent_details?.mother?.phone_number,
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
      <EditOutlined onClick={showModal} className="mr-2" />
      <Modal
        title={<div className="text-lg font-semibold mb-5">Edit User:</div>}
        open={isModalOpen}
        footer={false}
        onCancel={handleCancel}
        width={1000}
      >
        <Form
          className="pr-5"
          form={form}
          onFinish={handleSubmit}
          initialValues={getUserInitialValues(recordData)}
          onFieldsChange={onFieldsChange}
        >
          <Row>
            <Col span={24} lg={8}>
              <Form.Item
                label="Name"
                name="name"
                labelAlign="left"
                labelCol={{ span: 5 }}
                wrapperCol={{ span: 14 }}
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
            <Col span={24} lg={8}>
              <Form.Item
                colon={false}
                label={<div className="mr-7">Email:</div>}
                name="email"
                labelAlign="left"
                labelCol={{ span: 5 }}
                wrapperCol={{ span: 14 }}
                rules={[
                  {
                    required: true,
                    message: "Please input your email!",
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
            <Col span={24} lg={8}>
              <Form.Item
                label="Contact Number"
                name="phone_number"
                labelAlign="left"
                labelCol={{ span: 5, lg: 10 }}
                wrapperCol={{ span: 14 }}
                rules={[
                  {
                    required: true,
                    message: "Please enter your contact number!",
                  },
                  {
                    pattern: /^\d{10}$/,
                    message: "Contact number must be exactly 10 digits long",
                  },
                ]}
              >
                <Input maxLength={10} onChange={handlePhoneNumberChange} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} lg={8}>
   <Form.Item
  labelAlign="left"
  labelCol={{ span: 5 }}
  wrapperCol={{ span: 14 }}
  label="Faculties"
  name="faculties"
>

  <Select
    mode="multiple"              // ✅ allow multiple selection
    options={facultyOptions}
    showSearch
    filterOption={(input, option) =>
      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
    }
/>
</Form.Item>

            </Col>
            <Col span={24} lg={8}>
              <Form.Item
                // wrapperCol={{ span: 12, offset: 1 }}
                labelAlign="left"
                labelCol={{ span: 5 }}
                wrapperCol={{ span: 14 }}
                label="Mentor"
                name="mentor"
              >
                <Select
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
                  {/* ------------------ Father Details ------------------ */}
<Row>
  <Col span={24} lg={8}>
    <Form.Item
      label="Father Name"
      name="father_name"
      labelAlign="left"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 14 }}
    >
      <Input placeholder="Father Name" />
    </Form.Item>
  </Col>

  <Col span={24} lg={8}>
    <Form.Item
      label="Father Email"
      name="father_email"
      labelAlign="left"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 14 }}
      rules={[{ type: "email", message: "Invalid email" }]}
    >
      <Input placeholder="Father Email" />
    </Form.Item>
  </Col>

  <Col span={24} lg={8}>
    <Form.Item
      label="Father Phone"
      name="father_phone_number"
      labelAlign="left"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 14 }}
      rules={[{ pattern: /^\d{10}$/, message: "Must be 10 digits" }]}
    >
      <Input maxLength={10} placeholder="Father Phone" />
    </Form.Item>
  </Col>
</Row>

{/* ------------------ Mother Details ------------------ */}
<Row>
  <Col span={24} lg={8}>
    <Form.Item
      label="Mother Name"
      name="mother_name"
      labelAlign="left"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 14 }}
    >
      <Input placeholder="Mother Name" />
    </Form.Item>
  </Col>

  <Col span={24} lg={8}>
    <Form.Item
      label="Mother Email"
      name="mother_email"
      labelAlign="left"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 14 }}
      rules={[{ type: "email", message: "Invalid email" }]}
    >
      <Input placeholder="Mother Email" />
    </Form.Item>
  </Col>

  <Col span={24} lg={8}>
    <Form.Item
      label="Mother Phone"
      name="mother_phone_number"
      labelAlign="left"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 14 }}
      rules={[{ pattern: /^\d{10}$/, message: "Must be 10 digits" }]}
    >
      <Input maxLength={10} placeholder="Mother Phone" />
    </Form.Item>
  </Col>
</Row>


          <Form.List
            name="courses"
            initialValue={recordData?.courses?.map((value) => ({
              course: value,
            }))}
          >
            {(fields, { add, remove }) => {
              return (
                <Row
                  className=" border-black rounded-sm"
                  gutter={[16, 8]}
                  justify="center"
                >
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
                      </Form.Item>
                    </Col>
                  )}
                </Row>
              );
            }}
          </Form.List>
          <Row justify="center">
            <Form.Item className="flex justify-center">
              <Button loading={loading} htmlType="submit" type="primary">
                Submit
              </Button>
            </Form.Item>
            <Button className="ml-2" onClick={() => handleCancel()}>
              Cancel
            </Button>
          </Row>
        </Form>
      </Modal>
    </>
  );
}

export default EditStudentUserModal;

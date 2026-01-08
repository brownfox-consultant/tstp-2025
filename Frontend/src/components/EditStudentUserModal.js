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
  const [countryCodes, setCountryCodes] = useState([]);
const [mainCode, setMainCode] = useState("+91");
const [fatherCode, setFatherCode] = useState("+91");
const [motherCode, setMotherCode] = useState("+91");

const splitNumber = (num) => {
  if (!num) return { code: "+91", number: "" };

  const match = num.match(/^(\+\d{1,3})(\d{6,12})$/);
  if (match) {
    return { code: match[1], number: match[2] };
  }
  return { code: "+91", number: num.replace(/\D/g, "") };
};


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
    })
    .catch(console.error);
}, []);


 useEffect(() => {
  if (isModalOpen) {
    const main = splitNumber(recordData?.phone_number);
    const father = splitNumber(recordData?.parent_details?.father?.phone_number);
    const mother = splitNumber(recordData?.parent_details?.mother?.phone_number);

    // ✅ SAFE: setState inside useEffect
    setMainCode(main.code);
    setFatherCode(father.code);
    setMotherCode(mother.code);

    // ✅ set form values
    form.setFieldsValue(getUserInitialValues(recordData));

    getCoursesInsideAuth().then((res) => setCourses(res.data));

    getUsersByRole({
      role: roles.find(({ name }) => name == "faculty").id,
    }).then((res) => {
      setFacultyOptions(
        res.data.results.map((user) => ({
          label: user.name,
          value: user.id,
        }))
      );
    });

    getUsersByRole({
      role: roles.find(({ name }) => name == "mentor").id,
    }).then((res) => {
      setMentorOptions(
        res.data.results.map((user) => ({
          label: user.name,
          value: user.id,
        }))
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
    phone_number: `${mainCode}${formData.phone_number}`,
    father_phone_number: formData.father_phone_number
      ? `${fatherCode}${formData.father_phone_number}`
      : null,
    mother_phone_number: formData.mother_phone_number
      ? `${motherCode}${formData.mother_phone_number}`
      : null,
    courses: formattedCourses,
  };

  editUser(recordData.id, finalPayload)
    .then(() => {
      form.resetFields();
      setUpdated(!updated);
      handleCancel();
    })
    .catch(console.log)
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
  const main = splitNumber(data?.phone_number);
  const father = splitNumber(data?.parent_details?.father?.phone_number);
  const mother = splitNumber(data?.parent_details?.mother?.phone_number);

  return {
    name: data?.name,
    email: data?.email,
    phone_number: main.number,
    mentor: data?.mentor_details?.id,
    faculties: data?.faculty_details?.map((faculty) => faculty.id),

    father_email: data?.parent_details?.father?.email,
    father_phone_number: father.number,
    father_name: data?.parent_details?.father?.name,

    mother_email: data?.parent_details?.mother?.email,
    mother_phone_number: mother.number,
    mother_name: data?.parent_details?.mother?.name,

    courses: data?.course_details?.map((course_detail) => {
      const {
        course,
        subscription_start_date,
        subscription_end_date,
        subscription_type,
      } = course_detail;

      return {
        course: course?.name,
        subscription_type,
        subscription_start_date: dayjs(subscription_start_date),
        subscription_end_date: dayjs(subscription_end_date),
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
          // initialValues={getUserInitialValues(recordData)}
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
                <Input
  addonBefore={
    <select
      value={mainCode}
      onChange={(e) => setMainCode(e.target.value)}
      className="border-0 bg-transparent outline-none"
    >
      {countryCodes.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  }
  maxLength={10}
  onChange={handlePhoneNumberChange}
/>

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
      <Input
  addonBefore={
    <select
      value={fatherCode}
      onChange={(e) => setFatherCode(e.target.value)}
      className="border-0 bg-transparent outline-none"
    >
      {countryCodes.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  }
  maxLength={10}
  placeholder="Father Phone"
/>

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
     <Input
  addonBefore={
    <select
      value={motherCode}
      onChange={(e) => setMotherCode(e.target.value)}
      className="border-0 bg-transparent outline-none"
    >
      {countryCodes.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  }
  maxLength={10}
  placeholder="Mother Phone"
/>

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

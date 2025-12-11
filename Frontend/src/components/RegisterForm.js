"use client";

import {
  getCoursesOutsideAuth,
  registerStudent,
} from "@/app/services/registerStudent";
import { Button, Col, Form, Input, Modal, Row, Select } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useRef } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import OtpModal from "./OtpModal";

function RegisterForm() {
  const carouselRef = useRef();
  const [options, setOptions] = useState([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [formCompleted, setFormCompleted] = useState(false);
  const [form] = useForm();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [submitLoader, setSubmitLoader] = useState(false);

  const onValuesChange = (_, allValues) => {
    // Check if all required fields in the form have valid values
    const isFormValid = Object.entries(allValues).every(([key, value]) => {
      // For phone_number, check if it's exactly 10 digits
      if (key === "phone_number") {
        return /^\d{10}$/.test(value);
      }
      // For other fields, check if they are not undefined or empty
      return value !== undefined && value !== "";
    });

    setFormCompleted(isFormValid);
  };

  // useEffect(() => {
  //   getCoursesOutsideAuth()
  //     .then((res) => {
  //       setOptions(res.data);
  //     })
  //     .catch((err) => console.log(err));
  // }, []);

  useEffect(() => {
  getCoursesOutsideAuth()
    .then((res) => {
      const filtered = res.data.filter(
        (course) => course.name === "DSAT - Scholarship Test"
      );
      setOptions(filtered);
    })
    .catch((err) => console.log(err));
}, []);


  const onChange = (currentSlide) => {
    setCurrentSlide(currentSlide);
    if (currentSlide == 2) {
      setShowSubmit(true);
    } else {
      setShowSubmit(false);
    }
  };

  function handleSubmit(formData) {
    setSubmitLoader(true);
    registerStudent(formData)
      .then((res) => {
        // Modal.success({
        //   title: res.data.message,
        //   // onOk: router.push("/login"),
        //   onOk:
        // });
        setShowOtpModal(true);
      })
      .catch((err) => console.log(err))
      .finally(() => setSubmitLoader(false));
  }

  const handlePhoneNumberChange = (e) => {
    // Replace non-numeric characters with an empty string
    const filteredValue = e.target.value.replace(/\D/g, "");
    form.setFieldsValue({ phone_number: filteredValue });
  };

  return (
    <>
      <Form
        className="register-form"
        form={form}
        onFinish={handleSubmit}
        onValuesChange={onValuesChange}
        layout="vertical"
      >
        {/* <Carousel ref={carouselRef} afterChange={onChange} dotPosition="bottom"> */}
        <div>
          <Form.Item
            label="Email"
            name="email"
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

          {/* <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
              {
                min: 8,
                message: "Password must be at least 8 characters long",
              },
            ]}
          >
            <Input.Password />
          </Form.Item> */}
          <Row>
            <Col span={12} className="p-2">
              <Form.Item
                label="Name"
                name="name"
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
            <Col span={12} className="p-2">
              <Form.Item
                label="Contact Number"
                name="phone_number"
                rules={[
                  {
                    required: true,
                    message: "Please enter your contact number!",
                  },
                  () => ({
                    validator(_, value) {
                      if (!value) {
                        return Promise.reject(
                          new Error("Please enter your contact number!")
                        );
                      }
                      if (!/^\d{10}$/.test(value)) {
                        return Promise.reject(
                          new Error(
                            "Contact number must be exactly 10 digits long"
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input maxLength={10} onChange={handlePhoneNumberChange} />
              </Form.Item>
            </Col>
          </Row>
          <Row className="">
            <Col span={18} className="p-2">
              <Form.Item label="Course" name="courses" required>
                <Select className="w-24" mode="multiple">
                  {options &&
                    options.map(({ id, name }) => {
                      return (
                        <Option key={id} value={name}>
                          {name}
                        </Option>
                      );
                    })}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {/* <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            rules={[
              {
                required: true,
                message: "Please re-enter your password!",
              },
            ]}
          >
            <Input.Password />
          </Form.Item> */}

          {/* <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: "Please confirm your password!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The new password that you entered do not match!")
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item> */}
        </div>
        {/* <div>
          <Row>
            <Col span={12} className="p-2">
              <Form.Item
                label="First Name"
                name="first_name"
                rules={[
                  {
                    required: true,
                    message: "Please input your first name!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12} className="p-2">
              <Form.Item
                label="Last Name"
                name="last_name"
                rules={[
                  {
                    required: true,
                    message: "Please input your last name!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row className="">
            <Col span={12} className="p-2">
              <Form.Item
                label="Contact Number"
                name="phone_number"
                rules={[
                  {
                    required: true,
                    message: "Please enter your contact number!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12} className="p-2">
              <Form.Item label="Date of Birth" name="date_of_birth" required>
                <DatePicker
                  disabledDate={(current) => {
                    // Can not select days before today and today
                    return current && current > dayjs().endOf("day");
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={8} className="p-2">
              <Form.Item label="Course" name="course" required>
                <Select className="w-10">
                  {options &&
                    options.map(({ id, name }) => {
                      return (
                        <Option key={id} value={name}>
                          {name}
                        </Option>
                      );
                    })}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div> */}
        {/* <div>
          <Row className="">
            <Col span={12} className="p-2">
              <Form.Item
                className="inline-block"
                label="Parent First Name"
                name="parent_first_name"
                rules={[
                  {
                    required: true,
                    message: "Please input your first name!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12} className="p-2">
              <Form.Item
                className="inline-block"
                label="Parent Last Name"
                name="parent_last_name"
                rules={[
                  {
                    required: true,
                    message: "Please input your last name!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Parent's Email"
            name="parent_email"
            rules={[
              {
                required: true,
                message: "Please input your parent's email!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Row>
            <Col span={12} className="mb-5">
              <Form.Item
                label="Parent Contact Number"
                name="parent_phone_number"
                rules={[
                  {
                    required: true,
                    message: "Please enter parent's contact number!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </div> */}
        {/* </Carousel> */}
        {/* <Row className="justify-evenly mt-5">
        <Button
          disabled={currentSlide == 0}
          shape="circle"
          icon={<LeftOutlined />}
          onClick={handlePrev}
        />
        <Button
          disabled={!formCompleted}
          className="justify-center"
          type="primary"
          htmlType="submit"
        >
          Submit
        </Button>
        <Button
          disabled={currentSlide == 2}
          shape="circle"
          icon={<RightOutlined />}
          onClick={handleNext}
        />
      </Row> */}
        <Row className="justify-evenly mt-5">
          <Button
            loading={submitLoader}
            disabled={!formCompleted}
            className="justify-center"
            type="primary"
            htmlType="submit"
          >
            Submit
          </Button>
        </Row>
      </Form>
      {showOtpModal && (
        <OtpModal
          open={showOtpModal}
          setOpen={setShowOtpModal}
          extraPayload={{ email: form.getFieldValue("email") }}
          afterSuccess={() => {
            setShowOtpModal(false);
            Modal.success({
              title: "Registration successful. Admin will contact you shortly.",
              onOk: () => window.location.href = "/login",
            });
          }}
          email={form.getFieldValue("email")}
        />
      )}
    </>
  );
}

export default RegisterForm;

import {
  createUser,
  getRoles,
} from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { LeftOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import dayjs from 'dayjs';

const { Option } = Select;

function CreateUserForm() {
  const [form] = useForm();
  const router = useRouter();
  const { id } = useParams();
  const [options, setOptions] = useState([]);
  const [roleState, setRoleState] = useState();
  const [roleName, setRoleName] = useState();
  const [courseOptions, setCourseOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

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

  const handleRoleChange = (selectedId) => {
    setRoleState(selectedId);
    const selected = options.find(({ id }) => selectedId == id);
    setRoleName(selected?.name);
  };

  const handleSubmit = (formData) => {
    if (formData.dob) {
      formData.dob = dayjs(formData.dob).format("YYYY-MM-DD"); // ✅ Correct format
    }
    console.log("SUBMIT DATA:", formData);
    setLoading(true);

    createUser(formData)
      .then((res) => {
        form.resetFields();
        if (roleState != 5) {
          Modal.success({
            content: "New User Created",
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

  // Only require required fields to be filled
  const requiredFields = [
    "name",
    "email",
    "phone_number",
    "dob",
    "address",
    "role",
  ];

  const requiredFilled = requiredFields.every((name) => {
    const field = allFields.find((f) => f.name[0] === name);
    return field?.value !== undefined && field?.value !== "";
  });

  setIsSubmitDisabled(hasErrors || !requiredFilled);
};


  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      onFieldsChange={onFieldsChange}
      layout="vertical"
    >
      <div className="text-xl font-semibold mb-2 flex align-middle">
        <LeftOutlined
          onClick={() => router.back()}
          className="mr-2 text-base hover:font-extrabold cursor-pointer"
        />
        Create User
      </div>

      <Card title="Personal details" className="mb-6 border-dashed border-blue-400">
        <Row gutter={[24, 16]}>
          <Col span={8}>
            <Form.Item label="User name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Full name" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true }, { type: "email" }]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Contact number"
              name="phone_number"
              rules={[{ required: true }, { pattern: /^\d{10}$/, message: "Must be 10 digits" }]}
            >
              <Input
                addonBefore="+91"
                maxLength={10}
                onChange={(e) => handlePhoneNumberChange(e, "phone_number")}
                placeholder="Enter number"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Alternative number"
              name="alternative_number"
              rules={[{ pattern: /^\d{10}$/, message: "Must be 10 digits" }]}
            >
              <Input
                addonBefore="+91"
                maxLength={10}
                onChange={(e) => handlePhoneNumberChange(e, "alternative_number")}
                placeholder="Enter alternative number"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Date of birth" name="dob" rules={[{ required: true }]}>
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Blood group" name="blood_group" >
              <Select placeholder="Select blood group">
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                  <Option key={group} value={group}>
                    {group}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Address" name="address" rules={[{ required: true }]}>
              <Input placeholder="Add address" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Role" name="role" rules={[{ required: true }]}>
              <Select placeholder="Select Role" value={roleState} onChange={handleRoleChange}>
                {options &&
                  options
                    .filter(({ name }) => name !== "parent")
                    .map(({ id, name, label }) => (
                      <Option key={id} value={id}>
                        {label}
                      </Option>
                    ))}
              </Select>
            </Form.Item>
          </Col>

          {roleName === "student" && (
            <Col span={8}>
              <Form.Item
                label="Course"
                name="courses"
                rules={[{ required: true, message: "Please select a Course!" }]}
              >
                <Select mode="multiple" placeholder="Select Course">
                  {courseOptions.map(({ id, name }) => (
                    <Option key={id} value={name}>
                      {name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row>
      </Card>

      {roleName === "student1899" && (
        <>
          <Card title="Father Details" className="mb-6">
            <Row gutter={[24, 16]}>
              <Col span={8}>
                <Form.Item label="Name" name="father_name">
                  <Input placeholder="Name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Email" name="father_email" rules={[{ type: "email" }]}>
                  <Input placeholder="Enter Email" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Contact Number"
                  name="father_phone_number"
                  rules={[{ pattern: /^\d{10}$/, message: "Must be 10 digits" }]}
                >
                  <Input
                    placeholder="Enter Contact Number"
                    maxLength={10}
                    onChange={(e) => handlePhoneNumberChange(e, "father_phone_number")}
                    addonBefore="+91"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Mother Details" className="mb-6">
            <Row gutter={[24, 16]}>
              <Col span={8}>
                <Form.Item label="Name" name="mother_name">
                  <Input placeholder="Name" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Email" name="mother_email" rules={[{ type: "email" }]}>
                  <Input placeholder="Enter Email" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Contact Number"
                  name="mother_phone_number"
                  rules={[{ pattern: /^\d{10}$/, message: "Must be 10 digits" }]}
                >
                  <Input
                    placeholder="Enter Contact Number"
                    maxLength={10}
                    onChange={(e) => handlePhoneNumberChange(e, "mother_phone_number")}
                    addonBefore="+91"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </>
      )}

      <Row justify="center" className="mt-5">
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={isSubmitDisabled}
        >
          Submit
        </Button>
        <Button className="ml-5" onClick={() => router.back()}>
          Cancel
        </Button>
      </Row>
    </Form>
  );
}

export default CreateUserForm;

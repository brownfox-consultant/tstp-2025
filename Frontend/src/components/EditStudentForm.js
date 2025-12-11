import {
  getUserById,
  updateUser,
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
  Spin,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

const { Option } = Select;

function EditStudentForm() {
  const [form] = useForm();
  const router = useRouter();
  const { id } = useParams(); // userId
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [courses, setCourses] = useState([]);
  const { userId } = useParams();
  useEffect(() => {
  getRoles().then((res) => setRoles(res.data));
  getCoursesInsideAuth().then((res) => setCourses(res.data));

  getUserById(userId)
    .then((res) => {
      const user = res.data;
      form.setFieldsValue({
        ...user,
        dob: user.dob ? dayjs(user.dob) : null,
        courses: user.course_details?.map((c) => c.course.id) || [], // Ensure array
      });
      setRoleName(user.role_name);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, [id]);

  const handlePhoneNumberChange = (e, name) => {
    const filtered = e.target.value.replace(/\D/g, "");
    form.setFieldsValue({ [name]: filtered });
  };

  const handleRoleChange = (roleId) => {
    const selected = roles.find(({ id }) => id === roleId);
    setRoleName(selected?.name);
  };

const handleSubmit = async (values) => {
  setIsSubmitting(true);

  try {
    const dataToUpdate = {
      ...values,
      dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
      courses: values.courses || [], // Ensure courses is always an array
    };

    console.log('Submitting data:', dataToUpdate); // Debug log

    await updateUser(userId, dataToUpdate);
    
    Modal.success({
      content: "User updated successfully",
      onOk: () => router.back(),
    });
  } catch (error) {
    console.error('Update error:', error);
    Modal.error({ 
      content: error.response?.data?.error || "Failed to update user" 
    });
  } finally {
    setIsSubmitting(false);
  }
};

  if (loading) return <Spin />;

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      layout="vertical"
    >
      <div className="text-xl font-semibold mb-2 flex items-center">
        <LeftOutlined
          onClick={() => router.back()}
          className="mr-2 text-base hover:font-extrabold cursor-pointer"
        />
        Edit Student
      </div>

      <Card title="Personal details" className="mb-6 border-dashed border-blue-400">
        <Row gutter={[24, 16]}>
          <Col span={8}>
            <Form.Item label="User name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Full name" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Email" name="email" rules={[{ required: true }, { type: "email" }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Contact number"
              name="phone_number"
              rules={[{ required: true }, { pattern: /^\d{10}$/ }]}
            >
              <Input
                addonBefore="+91"
                maxLength={10}
                onChange={(e) => handlePhoneNumberChange(e, "phone_number")}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Date of birth" name="dob" rules={[{ required: true }]}>
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Blood group" name="blood_group">
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
              <Input />
            </Form.Item>
          </Col>

          <Col span={8}>
           <Form.Item label="Courses" name="courses" rules={[{ required: true }]}>
  <Select mode="multiple" placeholder="Select Course(s)">
    {courses.map(({ id, name }) => (
      <Option key={id} value={id}> {/* 🔁 was name */}
        {name}
      </Option>
    ))}
  </Select>
</Form.Item>

          </Col>
        </Row>
      </Card>

      <Row justify="center" className="mt-5">
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Save Changes
        </Button>
        <Button className="ml-5" onClick={() => router.back()}>
          Cancel
        </Button>
      </Row>
    </Form>
  );
}

export default EditStudentForm;

import {
  getUserById,
  updateUser,
  getRoles,
} from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import {
  Button,
  Col,
  DatePicker,
  Divider,
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
import { LeftArrowIcon } from "./icons/score-analysis-icons";

const { Option } = Select;

function EditStudentForm() {
  const [form] = useForm();
  const router = useRouter();
  const { id, userId } = useParams(); 
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    getRoles().then((res) => setRoles(res.data));
    getCoursesInsideAuth().then((res) => setCourses(res.data));

    getUserById(userId || id)
      .then((res) => {
        const user = res.data;
        form.setFieldsValue({
          ...user,
          dob: user.dob ? dayjs(user.dob) : null,
          courses: user.course_details?.map((c) => c.course.id) || [], 
        });
        setRoleName(user.role_name);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, userId]);

  const handlePhoneNumberChange = (e, name) => {
    const filtered = e.target.value.replace(/\D/g, "");
    form.setFieldsValue({ [name]: filtered });
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      const dataToUpdate = {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        courses: values.courses || [],
      };

      console.log('Submitting data:', dataToUpdate);

      await updateUser(userId || id, dataToUpdate);
      
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

  if (loading) return <Spin className="flex justify-center items-center h-screen" />;

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      layout="vertical"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
         <div className="text-2xl font-bold">Edit Student</div>
         <button
            type="button"
            className="bg-white px-3 py-1.5 rounded-lg shadow-sm text-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
            onClick={() => router.back()}
          >
            <LeftArrowIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
      </div>

      {/* Student Information Card */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-[#F59405]">Student Information</h3>
            <p className="text-sm text-gray-500 mt-1">Basic personal details</p>
          </div>
          <Divider className="my-2 border-gray-200" />

          <Row gutter={[16, 12]}>
             {/* Name */}
             <Col xs={24} md={12} lg={8}>
                <Form.Item label={<div className="text-sm font-semibold text-gray-700">User Name</div>} name="name" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                    <Input placeholder="Full name" className="h-10" />
                </Form.Item>
             </Col>
             
             {/* Email */}
             <Col xs={24} md={12} lg={8}>
                <Form.Item label={<div className="text-sm font-semibold text-gray-700">Email</div>} name="email" rules={[{ required: true }, { type: "email" }]} style={{ marginBottom: 8 }}>
                    <Input className="h-10" />
                </Form.Item>
             </Col>

             {/* Phone */}
             <Col xs={24} md={12} lg={8}>
                <Form.Item label={<div className="text-sm font-semibold text-gray-700">Contact Number</div>} name="phone_number" rules={[{ required: true }, { pattern: /^\d{10}$/ }]} style={{ marginBottom: 8 }}>
                    <Input addonBefore="+91" maxLength={10} onChange={(e) => handlePhoneNumberChange(e, "phone_number")} className="h-10" />
                </Form.Item>
             </Col>

             {/* DOB */}
             <Col xs={24} md={12} lg={8}>
                <Form.Item label={<div className="text-sm font-semibold text-gray-700">Date of Birth</div>} name="dob" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                    <DatePicker className="w-full h-10" format="YYYY-MM-DD" />
                </Form.Item>
             </Col>

             {/* Blood Group */}
             <Col xs={24} md={12} lg={8}>
                <Form.Item label={<div className="text-sm font-semibold text-gray-700">Blood Group</div>} name="blood_group" style={{ marginBottom: 8 }}>
                    <Select placeholder="Select Blood Group" size="large">
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                        <Option key={group} value={group}>
                            {group}
                        </Option>
                        ))}
                    </Select>
                </Form.Item>
             </Col>

             {/* Address */}
             <Col xs={24} md={12} lg={8}>
                <Form.Item label={<div className="text-sm font-semibold text-gray-700">Address</div>} name="address" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                    <Input className="h-10" />
                </Form.Item>
             </Col>
          </Row>
      </div>

       {/* Course Details Card */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 mt-6">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-[#007FBC]">Course Details</h3>
            <p className="text-sm text-gray-500 mt-1">Assigned courses</p>
          </div>
          <Divider className="my-2 border-gray-200" />
          
          <Row gutter={[16, 12]}>
              <Col xs={24}>
                  <Form.Item label={<div className="text-sm font-semibold text-gray-700">Courses</div>} name="courses" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                       <Select mode="multiple" placeholder="Select Course(s)" size="large" style={{ width: '100%' }}>
                            {courses.map(({ id, name }) => (
                            <Option key={id} value={id}>
                                {name}
                            </Option>
                            ))}
                        </Select>
                  </Form.Item>
              </Col>
          </Row>
      </div>

      <Row justify="end" className="mt-5 gap-4">
            <Button className="h-10 px-6 rounded-lg text-gray-600 border-gray-300" onClick={() => router.back()}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} className="h-10 px-6 rounded-lg bg-[#F59405] hover:bg-[#d68104] border-none">Save Changes</Button>
      </Row>
    </Form>
  );
}

export default EditStudentForm;

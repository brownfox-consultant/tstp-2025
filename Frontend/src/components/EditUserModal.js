import { EditOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { Form, Modal, Select, Input, Button, DatePicker, Row, Col } from "antd";
import { useForm } from "antd/es/form/Form";
import { editUser, getRoles, getUsersByRole } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";

function EditUserModal({ recordData, updated, setUpdated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form] = useForm();

  const [facultyOptions, setFacultyOptions] = useState([]);
  const [mentorOptions, setMentorOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { roles } = useGlobalContext();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (isModalOpen && recordData.role_name == "student") {
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

  function handleSubmit(formData) {
    setLoading(true);

    editUser(recordData.id, formData)
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

  return (
    <>
      <EditOutlined onClick={showModal} className="mr-2" />
      <Modal
        width={480}
        title={<div className=" text-2xl font-semibold">Edit User</div>}
        open={isModalOpen}
        // onOk={handleOk}
        footer={false}
        onCancel={handleCancel}
        closable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            ...recordData,
            course: recordData?.course_details?.course_name,
          }}
          onFieldsChange={onFieldsChange}
        >
          {/* <Row className="space-x-4"> */}
          <Row>
            <Col span={24}>
              <Form.Item
                label="Name"
                name="name"
                labelAlign="left"
                labelCol={{ span: 10 }}
                wrapperCol={{ span: 24 }}
                rules={[
                  {
                    required: true,
                    message: "Please input your name!",
                  },
                ]}
              >
                <Input className="w-full" />
              </Form.Item>

              <Form.Item
                colon={false}
                label={<div className="mr-7">Email:</div>}
                name="email"
                labelAlign="left"
                labelCol={{ span: 10 }}
                wrapperCol={{ span: 24 }}
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

              <Form.Item
                label="Contact Number"
                name="phone_number"
                labelAlign="left"
                labelCol={{ span: 10 }}
                wrapperCol={{ span: 24 }}
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

          <Row className="" gutter={[8, 16]}>
            <Col span={12}>
              <Button className="w-full" onClick={() => handleCancel()}>
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                className="w-full"
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={isSubmitDisabled}
              >
                Update
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}

export default EditUserModal;

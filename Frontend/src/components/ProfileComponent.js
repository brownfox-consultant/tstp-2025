import { EditOutlined, SaveOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Col, Descriptions, Form, Input, Row } from "antd";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { editUser, getUserDetails } from "@/app/services/authService";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import ChangePasswordModal from "./ChangePasswordModal";
const { Meta } = Card;

function ProfileComponent() {
  const { id } = useParams();
  const [userData, setUserData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [form] = useForm();
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

  const formFields = ["name", "email", "phone_number"];

  useEffect(() => {
    setCardLoading(true);
    getUserDetails(id)
      .then((res) => {
        setUserData(res.data);
      })
      .finally(() => setCardLoading(false));
  }, [updated]);

  const formInitialValues = {
    name: userData.name,
    email: userData.email,
    phone_number: userData.phone_number,
    date_of_birth: dayjs(userData.date_of_birth),
  };

  function handleSave() {
    if (form.isFieldsTouched(formFields)) {
      form.validateFields(formFields).then(() => {
        setSaveLoading(true);
        let payload = {
          ...form.getFieldsValue(formFields),
          // date_of_birth: form
          //   .getFieldValue("date_of_birth")
          //   .format("YYYY-MM-DD"),
        };

        editUser(id, payload)
          .then((res) => {
            setUpdated(!updated);
          })
          .finally(() => setSaveLoading(false));
      });
    }
    setEditMode(false);
  }

  const handlePhoneNumberChange = (e) => {
    const filteredValue = e.target.value.replace(/\D/g, "");
    form.setFieldsValue({ phone_number: filteredValue });
  };

  const onFieldsChange = (_, allFields) => {
    const isFormValid = allFields.every((field) => {
      if (field.name[0] === "phone_number" || field.name[0] === "email") {
        return field.errors.length === 0 && field.value;
      }
      return field.value;
    });
    setIsSaveDisabled(!isFormValid);
  };

  return (
    <div className="w-full">
      <div className="mb-3 font-bold flex justify-between">
        <div className="text-xl font-bold mb-2">Profile</div>
        <div className="space-x-2">
          <ChangePasswordModal />

          {editMode ? (
            <>
              <Button
                icon={<SaveOutlined />}
                loading={saveLoading}
                shape="round"
                type="primary"
                onClick={handleSave}
                disabled={isSaveDisabled}
              >
                Save
              </Button>
              <Button
                shape="round"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              icon={<EditOutlined />}
              shape="round"
              type="primary"
              onClick={() => setEditMode(true)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      <Card hoverable className="p-5" loading={cardLoading} style={{ maxWidth: '600px' }}>
        <Meta
          avatar={<Avatar src="https://xsgames.co/randomusers/avatar.php?g=pixel" />}
          title={<div>User Details</div>}
          description={
            editMode ? (
              <Form
                form={form}
                initialValues={formInitialValues}
                onFinish={handleSave}
                onFieldsChange={onFieldsChange}
                style={{marginTop: '20px'}}
              >
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Name">
                    <Form.Item
                      name="name"
                      rules={[{ required: true, message: "Please input your name!" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input />
                    </Form.Item>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Email">
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: "Please input your email!" },
                        { type: "email", message: "The input is not a valid email!" },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input />
                    </Form.Item>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Contact Number">
                    <Form.Item
                      name="phone_number"
                      rules={[
                        { required: true },
                        { pattern: /^\d{10}$/, message: "Contact number must be 10 digits" },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input maxLength={10} onChange={handlePhoneNumberChange} />
                    </Form.Item>
                  </Descriptions.Item>
                </Descriptions>
              </Form>
            ) : (
              <Descriptions column={1} bordered style={{marginTop: '20px'}}>
                <Descriptions.Item label="Name">{userData.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{userData.email}</Descriptions.Item>
                <Descriptions.Item label="Contact Number">{userData.phone_number}</Descriptions.Item>
              </Descriptions>
            )
          }
        />
      </Card>

      {/* <Button type="primary" onClick={() => }>Change Password</Button> */}
    </div>
  );
}

export default ProfileComponent;

import { changePasswordService } from "@/app/services/authService";
import { handleAPIError } from "@/utils/utils";
import { LockOutlined } from "@ant-design/icons";
import { Form, Input, Modal, Button, notification } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";

function ChangePasswordModal({
  buttonVisible = true,
  changePasswordFlag = false,
}) {
  const [form] = Form.useForm();
  const router = useRouter();
  const { params } = useParams();
  const [open, setOpen] = useState(changePasswordFlag);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState("");

  const onSubmit = (e) => {
    setUpdateLoading(true);
    const { old_password, new_password } = e;

    changePasswordService({ old_password, new_password })
      .then((res) => {
        form.resetFields();
        setOpen(false);
        const { csrf_token } = res.data;
        window.localStorage.setItem("change_password", false);
        window.localStorage.setItem("csrfToken", csrf_token);
        Modal.success({
          title: "Password changed successfully.",
        });
      })
      .finally(() => setUpdateLoading(false));
  };

  return (
    <>
      {buttonVisible && (
        <Button icon={<LockOutlined />} onClick={() => setOpen(true)}>
          Change Password
        </Button>
      )}
      <Modal
        open={open}
        title={<div className="text-2xl font-bold mb-2">Change Password</div>}
        footer={false}
        closable={!changePasswordFlag}
        onCancel={!changePasswordFlag ? () => setOpen(false) : () => {}}
      >
        <Form
          className="mt-5"
          form={form}
          onFinish={onSubmit}
          layout="horizontal"
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
        >
          <Form.Item
            label="Old Password"
            name="old_password"
            initialValue=""
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
              // {
              //   min: 8,
              //   message: "Password must be at least 8 characters long.",
              // },
              // {
              //   pattern: /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/,
              //   message: "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
              // },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="new_password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
              {
                min: 8,
                message: "Password must be at least 8 characters long.",
              },
              // {
              //   pattern: /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/,
              //   message: "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
              // },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={["new_password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: "Please confirm your password!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(
                      "The two passwords that you entered do not match!"
                    )
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            wrapperCol={{
              span: 24,
            }}
            className="flex justify-center"
          >
            <Button type="primary" htmlType="submit" loading={updateLoading}>
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ChangePasswordModal;

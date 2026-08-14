import { changePasswordService } from "@/app/services/authService";
import { LockOutlined } from "@ant-design/icons";
import { Form, Input, Modal, Button, notification } from "antd";
import React, { useEffect, useState } from "react";

function ChangePasswordModal({
  buttonVisible = true,
  changePasswordFlag = false,
}) {
  const [form] = Form.useForm();

  const [open, setOpen] = useState(changePasswordFlag);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Keep modal state synced with the flag
  useEffect(() => {
    setOpen(changePasswordFlag);
  }, [changePasswordFlag]);

  const onSubmit = (values) => {
    setUpdateLoading(true);

    const { old_password, new_password } = values;

    changePasswordService({
      old_password,
      new_password,
    })
      .then((res) => {
        form.resetFields();

        setOpen(false);

        const { csrf_token } = res.data;

        window.localStorage.setItem(
          "change_password",
          "false"
        );

        window.localStorage.setItem(
          "csrfToken",
          csrf_token
        );

        Modal.success({
          title: "Password changed successfully.",
        });
      })
      .catch((error) => {
        console.error("Change password error:", error);

        notification.error({
          message: "Password change failed",
          description:
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Unable to change password.",
        });
      })
      .finally(() => {
        setUpdateLoading(false);
      });
  };

  return (
    <>
      {buttonVisible && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all duration-200"
        >
          <LockOutlined />
          Change Password
        </button>
      )}

      <Modal
        open={open}
        title={
          <div className="text-2xl font-bold mb-2">
            Change Password
          </div>
        }
        footer={false}

        // Always show X close button
        closable={true}

        // Allow clicking outside to close
        maskClosable={true}

        // Allow ESC to close
        keyboard={true}

        // Close modal
        onCancel={() => {
          setOpen(false);
        }}
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
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
          >
            <Input.Password />
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
                message:
                  "Password must be at least 8 characters long.",
              },
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
                message:
                  "Please confirm your password!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    getFieldValue("new_password") === value
                  ) {
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
            <Button
              type="primary"
              htmlType="submit"
              loading={updateLoading}
            >
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ChangePasswordModal;
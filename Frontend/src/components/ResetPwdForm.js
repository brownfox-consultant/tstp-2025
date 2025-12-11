"use client";

import { forgotPassword, resetPassword } from "@/app/services/registerStudent";
import { useGlobalContext } from "@/context/store";
import { Button, Card, Checkbox, Input, Form, Modal, notification } from "antd";
import { useForm } from "antd/es/form/Form";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

function ResetPwdForm() {
  const [form] = useForm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [buttonLoader, setButtonLoader] = useState(false);
  const { setRole, setUserId, setUserName } = useGlobalContext();
  const token = searchParams.get("token");

  useEffect(() => {
    window.localStorage.clear();
  }, []);

  const onSubmit = async (e) => {
    setButtonLoader(true);
    const { password } = e;

    resetPassword({ password, token })
      .then(() => {
        // const {
        //   csrf_token,
        //   email,
        //   name,
        //   role,
        //   role_name,
        //   id,
        //   change_password,
        // } = res.data;
        // setRole(role);
        // setUserName(name);
        // setUserId(id);
        // // setPageLoading(true);
        // window.sessionStorage.setItem("name", name);
        // window.sessionStorage.setItem("email", email);
        // window.sessionStorage.setItem("id", id);
        // window.sessionStorage.setItem(
        //   "role_name",
        //   role_name == "content_developer" ? "developer" : role_name
        // );
        // window.sessionStorage.setItem("change_password", change_password);
        // window.sessionStorage.setItem("csrfToken", csrf_token);

        form.resetFields();
        Modal.success({
          title: "Password changed successfully.",
          onOk: () => {
            // router.push(`/login`);
            window.location.href = "/login";
            window.localStorage.clear();
          },
        });
      })
      .finally(() => setButtonLoader(true));
  };

  return (
    <Form
      className="login-form"
      form={form}
      onFinish={onSubmit}
      layout="vertical"
    >
      <Form.Item
        label="New Password"
        name="password"
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
          //   message:
          //     "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
          // },
        ]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
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
      </Form.Item>
      <Form.Item
        wrapperCol={{
          offset: 10,
          span: 16,
        }}
      >
        <Button
          className="center"
          type="primary"
          htmlType="submit"
          loading={buttonLoader}
        >
          Reset
        </Button>
      </Form.Item>
    </Form>
  );
}

export default ResetPwdForm;

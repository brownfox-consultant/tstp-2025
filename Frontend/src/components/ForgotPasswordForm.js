import { forgotPassword } from "@/app/services/registerStudent";
import { InfoCircleOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Form, Modal, notification, Input } from "antd";
import { useForm } from "antd/es/form/Form";
import { useRouter } from "next/navigation";
import { useState } from "react";

function ForgotPasswordForm() {
  const [form] = useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = () => {
    form.validateFields(["forgotEmail"]).then(() => {
      const email = form.getFieldValue("forgotEmail");
      setLoading(true);
      forgotPassword({ email: email })
        .then(({ data }) => {
          Modal.success({
            title: data.detail,
            onOk: () => {
              // router.push("/login");
              window.location.href = "/login";
              window.sessionStorage.clear();
            },
          });
        })
        .catch(function (error) {
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx

            notification.error({
              message: error.response.data.detail,
            });
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
          } else {
            // Something happened in setting up the request that triggered an Error
          }
        })
        .finally(() => setLoading(false));
    });
  };

  return (
    <Form
      className="login-form mt-10"
      form={form}
      onFinish={onSubmit}
      layout="vertical"
    >
      <Form.Item
        colon={false}
        label={<div className="p-0">Email</div>}
        name="forgotEmail"
        rules={[
          {
            required: true,
            message: "Please input your email!",
          },
          {
            type: "email",
            message: "Please enter a valid email address.",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <div className="">
        <InfoCircleOutlined /> We will send a password reset link to this email.
      </div>

      <Form.Item>
        <div className="mt-10 flex justify-center">
          <Button
            loading={loading}
            className="center"
            type="primary"
            htmlType="submit"
            icon={<SendOutlined rotate={-45} />}
          >
            Send Link
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
}

export default ForgotPasswordForm;

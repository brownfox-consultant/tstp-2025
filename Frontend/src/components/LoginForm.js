"use client";

import Loading from "@/app/(auth)/loading";
import {
  loginService,
  getCsrfToken,
  validateSession,
} from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import { Button, Input, Form } from "antd";
import { useForm } from "antd/es/form/Form";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getCookie } from "@/utils/utils";
import Cookies from 'js-cookie';

function LoginForm({ handleNext }) {
  const [form] = useForm();
  const { userName, userId, setRole, setUserId, setUserName, setTestRunning } =
    useGlobalContext();
  const router = useRouter();
  const [buttonLoading, setButtonLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  // axios.defaults.withCredentials = true;
  // axios.defaults.headers.common["X-CSRF-TOKEN"] = null;

  function setUserDataToLocalStorage(data) {
    const { csrf_token, email, name, role, role_name, id, change_password ,subscription_type } =
      data;
      
    setRole(role);
    setUserName(name);
    setUserId(id);
    setPageLoading(true);
    window.localStorage.setItem("name", name);
    window.localStorage.setItem("email", email);
    window.localStorage.setItem("id", id);
    window.localStorage.setItem(
      "role_name",
      role_name == "content_developer" ? "developer" : role_name
    );
    window.localStorage.setItem("change_password", change_password);
    window.localStorage.setItem("csrfToken", csrf_token);
     window.localStorage.setItem("subscription_type", subscription_type);
  }

  useEffect(() => {
    // setTestRunning(false);

    // let csrf_cookie = getCookie("csrftoken");
    // console.log({ csrf_cookie });

    validateSession()
  .then((res) => {
    const { role_name, id, subscription_type } = res.data;

    setUserDataToLocalStorage(res.data);
    form.resetFields();

    if (subscription_type === "FREE") {
      router.push(
        `/${role_name == "content_developer" ? "developer" : role_name}/${id}/dashboard`
      );
    } else {
      router.push(
        `/${role_name == "content_developer" ? "developer" : role_name}/${id}/dashboard`
      );
    }
  })

      .catch((err) => {
        clearAuthenticationCookies();
      });
  }, []);

  function clearAuthenticationCookies() {
    window.sessionStorage.clear();
    const cookieNames = ["sessionid", "csrftoken"];

    cookieNames.forEach((cookieName) => {
      document.cookie = `${cookieName}=; Path=/;  Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    });
  }

  const onSubmit = async (e) => {
    const { email, password } = e;

    setButtonLoading(true);

    loginService({ email, password })
      .then((res) => {
        const { role_name, id, subscription_type } = res.data;

        console.log("rn, id", role_name, id);
        setUserDataToLocalStorage(res.data);
        console.log("res.data",res.data)
        const cookies = Cookies.get();
        console.log("document.cookie",cookies);
        form.resetFields();
        // router.push(
        //   `/${
        //     role_name == "content_developer" ? "developer" : role_name
        //   }/${id}/dashboard`
        // );
         if (subscription_type === "FREE") {
      // ⭐ FREE user → go to free-user page
     
      router.push(
        `/${role_name == "content_developer" ? "developer" : role_name}/${id}/dashboard`
      );
    } else {
      // ⭐ PAID user → go to dashboard normally
      router.push(
        `/${role_name == "content_developer" ? "developer" : role_name}/${id}/dashboard`
      );
    }
      })
      .catch((err) => console.log(err))
      .finally(() => setButtonLoading(false));
  };

  return (
    <>
      {pageLoading ? (
        <Loading />
      ) : (
        <Form
          className="login-form"
          form={form}
          onFinish={onSubmit}
          layout="vertical"
        >
          <div>
            <Form.Item
              colon={false}
              label={<div className="p-0">Email</div>}
              name="email"
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

            <Form.Item
              label="Password"
              name="password"
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
                //   message:
                //     "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
                // },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <span className="cursor-pointer text-blue-500" onClick={handleNext}>
              Forgot Password?
            </span>
          </div>

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
              loading={buttonLoading}
            >
              Log In
            </Button>
          </Form.Item>
        </Form>
      )}
    </>
  );
}

export default LoginForm;

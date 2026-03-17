"use client";

import { Button, Input, Form, message, Select, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";
import {
  loginService,
  validateSession,
  impersonateUser,
} from "@/app/services/authService";

function BackdoorLoginForm() {
  const [form] = useForm();

  const [buttonLoading, setButtonLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  const [allUsers, setAllUsers] = useState([]);
  const [roleNames, setRoleNames] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const ROLE_ROUTE_MAP = {
  content_developer: "developer",
  student: "student",
  parent: "parent",
  faculty: "faculty",
  admin: "admin",
};

  /* =========================
     FETCH ALL USERS
  ========================= */
  const fetchAllUsers = async () => {
    const res = await axios.get(`${BASE_URL}/api/user/all-users/`, {
      withCredentials: true,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    });

    const users = res.data.results || [];
    setAllUsers(users);

    const uniqueRoles = [
      ...new Set(users.map((u) => u.role_name).filter(Boolean)),
    ];
    setRoleNames(uniqueRoles);
  };

  /* =========================
     CHECK SESSION ON LOAD
  ========================= */
  useEffect(() => {
    const checkSession = async () => {
      try {
        await validateSession(); // 200 = valid
        setSessionValid(true);
        await fetchAllUsers();
      } catch {
        setSessionValid(false);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  /* =========================
     LOGIN HANDLER
  ========================= */
  const onSubmit = async (values) => {
  const { email, password } = values;
  setButtonLoading(true);

  try {
    const res = await loginService({ email, password });

    // 🔐 LOGIN RESPONSE DATA
    const {
      id,
      name,
      email: userEmail,
      role_name,
      csrf_token,
      subscription_type,
      change_password,
    } = res.data;

    // ✅ STORE LOGIN SESSION IN LOCAL STORAGE
    localStorage.setItem("id", id);
    localStorage.setItem("name", name);
    localStorage.setItem("email", userEmail);
    localStorage.setItem("role_name", role_name);
    localStorage.setItem("csrfToken", csrf_token);
    localStorage.setItem("subscription_type", subscription_type);
    localStorage.setItem("change_password", change_password);

    // OPTIONAL FLAG
    localStorage.setItem("impersonating", "false");

    setSessionValid(true);
    await fetchAllUsers();
    form.resetFields();

    message.success(`Welcome ${name}`);
  } catch (err) {
    message.error("Invalid credentials");
  } finally {
    setButtonLoading(false);
  }
};


  /* =========================
     IMPERSONATE USER
  ========================= */
 const handleGenerate = async () => {
  try {
    const user = filteredUsers.find((u) => u.id === selectedUser);
    if (!user) return;

    const res = await impersonateUser(user.id);

    const {
      id,
      name,
      email,
      role_name,
      csrf_token,
      subscription_type,
    } = res.data;

    // 🔐 STORE IMPERSONATED USER
    localStorage.setItem("id", id);
    localStorage.setItem("name", name);
    localStorage.setItem("email", email);
    localStorage.setItem("role_name", role_name);
    localStorage.setItem("csrfToken", csrf_token);
    localStorage.setItem("subscription_type", subscription_type);
    localStorage.setItem("impersonating", "true");

    message.success(`Logged in as ${name}`);

    const mappedRole = ROLE_ROUTE_MAP[role_name] || role_name;

    const dashboardUrl = `/${mappedRole}/${id}/dashboard`;

    // ✅ SAME TAB REDIRECT
    window.location.replace(dashboardUrl);

  } catch (err) {
    console.error(err);
    message.error("Impersonation failed");
  }
};


  /* =========================
     LOADING STATE
  ========================= */
  if (checkingSession) {
    return (
      <div className="flex justify-center py-10">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      {/* =========================
          LOGIN FORM
      ========================= */}
      {!sessionValid && (
        <Form form={form} onFinish={onSubmit} layout="vertical">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Enter a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Button
            className="w-full h-11"
            type="primary"
            htmlType="submit"
            loading={buttonLoading}
          >
            Login
          </Button>
        </Form>
      )}

      {/* =========================
          ROLE DROPDOWN
      ========================= */}
      {sessionValid && roleNames.length > 0 && (
        <div className="mt-6">
          <label className="block text-sm font-semibold mb-2">
            Select Role
          </label>

          <Select
            placeholder="Choose role"
            value={selectedRole || undefined}
            size="large"
            className="w-full"
            allowClear
            onChange={(value) => {
              setSelectedRole(value);
              setFilteredUsers(
                allUsers.filter((u) => u.role_name === value)
              );
              setSelectedUser(null);
            }}
            onClear={() => {
              setSelectedRole("");
              setFilteredUsers([]);
            }}
          >
            {roleNames.map((role) => (
              <Select.Option key={role} value={role}>
                <span className="capitalize">{role}</span>
              </Select.Option>
            ))}
          </Select>
        </div>
      )}

      {/* =========================
          USER DROPDOWN
      ========================= */}
      {filteredUsers.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-semibold mb-2">
            Select User ({filteredUsers.length})
          </label>

          <Select
            placeholder="Choose user"
            value={selectedUser}
            size="large"
            className="w-full"
            showSearch
            allowClear
            onChange={setSelectedUser}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            options={filteredUsers.map((user) => ({
              value: user.id,
              label: `${user.name} - ${user.email}`,
            }))}
          />
        </div>
      )}

      {/* =========================
          GENERATE BUTTON
      ========================= */}
      {selectedUser && (
        <div className="mt-6">
          <Button
            type="primary"
            size="large"
            className="w-full h-12"
            onClick={handleGenerate}
          >
            Login as User
          </Button>
        </div>
      )}
    </>
  );
}

export default BackdoorLoginForm;

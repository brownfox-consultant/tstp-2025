"use client";

import { Button, Input, Form, message, Select } from "antd";
import { useForm } from "antd/es/form/Form";
import { useState } from "react";
import { loginService } from "@/app/services/authService";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";

function BackdoorLoginForm() {
  const [form] = useForm();
  const [buttonLoading, setButtonLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [roleNames, setRoleNames] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const onSubmit = async (values) => {
    const { email, password } = values;
    setButtonLoading(true);

    // Step 1: Login using loginService
    loginService({ email, password })
      .then(async (loginRes) => {
        
        // Step 2: After successful login, fetch users list
        try {
          const usersResponse = await axios.get(`${BASE_URL}/api/user/`, {
            withCredentials: true,
            headers: {
              "ngrok-skip-browser-warning": "69420",
            },
          });
          
          
          // Store all users
          const users = usersResponse.data.results || [];
          setAllUsers(users);
          
          // Extract unique role names from users
          const uniqueRoles = [...new Set(users.map(user => user.role_name))].filter(Boolean);
          setRoleNames(uniqueRoles);
          
          
        } catch (usersErr) {
        }
        
        // Reset form
        form.resetFields();
        
      })
      .catch((err) => {
      })
      .finally(() => {
        setButtonLoading(false);
      });
  };

  return (
    <>
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
            style={{ padding: "0" }}
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
            ]}
          >
            <Input.Password />
          </Form.Item>
        </div>

        <Form.Item className="!mt-3 !mb-0">
          <Button
            className="w-full h-11 text-base font-semibold"
            type="primary"
            htmlType="submit"
            loading={buttonLoading}
          >
            Login
          </Button>
        </Form.Item>
      </Form>

      {/* Role Selection Dropdown */}
      {roleNames.length > 0 && (
        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Role
          </label>
          <Select
            placeholder="Choose a role to view users"
            value={selectedRole || undefined}
            onChange={(value) => {
              setSelectedRole(value);
              // Filter users by selected role
              const filtered = allUsers.filter(user => user.role_name === value);
              setFilteredUsers(filtered);
              console.log(`📋 Filtered ${value} users:`, filtered.length);
            }}
            className="w-full"
            size="large"
            allowClear
            onClear={() => {
              setSelectedRole("");
              setFilteredUsers([]);
            }}
          >
            {roleNames.map((roleName) => (
              <Select.Option key={roleName} value={roleName}>
                <span className="capitalize font-medium">{roleName}</span>
              </Select.Option>
            ))}
          </Select>
        </div>
      )}

      {/* Display Filtered Users in Dropdown */}
      {filteredUsers.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select User ({filteredUsers.length} {selectedRole} users)
          </label>
          <Select
            placeholder="Choose a user"
            value={selectedUser}
            onChange={(value) => {
              setSelectedUser(value);
              const user = filteredUsers.find(u => u.id === value);
              console.log("✅ Selected User:", user);
            }}
            className="w-full"
            size="large"
            showSearch
            allowClear
            onClear={() => setSelectedUser(null)}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={filteredUsers.map((user) => ({
              value: user.id,
              label: `${user.name} - ${user.email}`,
              user: user,
            }))}
            optionRender={(option) => (
              <div className="py-1 flex flex-row justify-between">
                <div className="font-semibold text-gray-800">{option.data.user.name}</div>
                <div className="text-sm text-blue-600">{option.data.user.email}</div>
                {/* <div className="text-xs text-gray-500">ID: {option.data.user.id}</div> */}
              </div>
            )}
          />
        </div>
      )}

      {/* Generate Button - Shows after user selection */}
      {selectedUser && (
        <div className="mt-6">
          <Button
            type="primary"
            size="large"
            className="w-full h-12 text-base font-semibold"
            onClick={() => {
              const user = filteredUsers.find(u => u.id === selectedUser);
              console.log("🚀 Generate clicked for user:", user);
              message.success(`Generate action for ${user?.name}`);
              // Add your generate logic here
            }}
          >
            Generate
          </Button>
        </div>
      )}
    </>
  );
}

export default BackdoorLoginForm;

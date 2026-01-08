import { EditOutlined, SaveOutlined, CameraOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Form, Input, message, Spin } from "antd";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { editUser, getUserDetails } from "@/app/services/authService";
import { useForm } from "antd/es/form/Form";
import ChangePasswordModal from "./ChangePasswordModal";
import { useCountryCode } from "@/hooks/useCountryCode";
import CountryCodeSelect from "./CountryCodeSelect";

function ProfileComponent() {
  const { id } = useParams();
  const [userData, setUserData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [form] = useForm();
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

  // Use country code hook
  const {
    countryCodes,
    selectedCountryCode,
    setSelectedCountryCode,
    parsePhoneNumber,
    formatPhoneNumber,
  } = useCountryCode("+91", userData?.phone_number);

  const formFields = ["name", "email", "phone_number"];

  useEffect(() => {
    setCardLoading(true);
    getUserDetails(id)
      .then((res) => {
        setUserData(res.data);
      })
      .finally(() => setCardLoading(false));
  }, [updated, id]);

  const formInitialValues = {
    name: userData.name,
    email: userData.email,
    phone_number: parsePhoneNumber(userData.phone_number),
  };

  function handleSave() {
    if (form.isFieldsTouched(formFields)) {
      form.validateFields(formFields).then(() => {
        setSaveLoading(true);
        let formData = form.getFieldsValue(formFields);
        // Prepend country code to phone number using hook
        if (formData.phone_number) {
          formData.phone_number = formatPhoneNumber(formData.phone_number);
        }
        let payload = { ...formData };

        editUser(id, payload)
          .then((res) => {
            setUpdated(!updated);
            message.success("Profile updated successfully!");
          })
          .catch(() => {
            message.error("Failed to update profile");
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

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (cardLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
   <div className="w-full md:w-full">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 text-right lg:text-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-500 mt-1">Manage your personal information</p>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <style jsx global>{`
            .ant-input-group-addon {
              background-color: transparent !important;
              border: none !important;
            }
          `}</style>
          {/* Cover Banner with Pattern */}
          <div className="h-40 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute right-20 top-20 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute left-10 bottom-0 w-32 h-32 bg-white/5 rounded-full"></div>
            
            {/* Action Buttons - Top Right */}
            <div className="absolute top-4 right-4 flex gap-2">
              <ChangePasswordModal />
              {editMode ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaveDisabled || saveLoading}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
                      backdrop-blur-md transition-all duration-200
                      ${isSaveDisabled || saveLoading
                        ? 'bg-white/30 text-white/60 cursor-not-allowed' 
                        : 'bg-white text-green-600 hover:bg-green-50 shadow-lg'}
                    `}
                  >
                    <SaveOutlined />
                    {saveLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      form.resetFields();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-white text-black backdrop-blur-md hover:bg-white/30 hover:text-white hover:border-white transition-all duration-200"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm bg-white text-orange-600 border border-orange-200 hover:bg-orange-200 hover:text-black shadow-sm transition-all duration-200"
                >
                  <EditOutlined />
                  Edit Profile
                </button>
              )}
            </div>

            {/* User Info - Bottom Left */}
            <div className="absolute bottom-4 left-6 sm:left-10">
              <h2 className="text-2xl font-bold text-white">{userData.name || "User"}</h2>
              <p className="text-white/80 flex items-center gap-2 mt-1">
                <MailOutlined className="text-white/80" />
                {userData.email || "No email provided"}
              </p>
            </div>
          </div>

          {/* Profile Content */}
          <div className="relative px-6 sm:px-10 pb-10">
            {/* Avatar */}
            <div className="absolute -top-16 right-6 sm:right-10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-4 border-white transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  {getInitials(userData.name)}
                </div>
                {editMode && (
                  <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-orange-500 hover:scale-110 transition-all duration-200">
                    <CameraOutlined className="text-lg" />
                  </button>
                )}
              </div>
            </div>

            {/* Divider with Label */}
            <div className="flex items-center gap-4 mb-8 pt-28">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Personal Details</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </div>

            {/* Form / View Mode */}
            {editMode ? (
              <Form
                form={form}
                initialValues={formInitialValues}
                onFinish={handleSave}
                onFieldsChange={onFieldsChange}
                layout="vertical"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Name Field */}
                  <div className="bg-white rounded-xl p-5 border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-400 flex items-center justify-center">
                        <UserOutlined className="text-white text-lg" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Full Name</span>
                    </div>
                    <Form.Item
                      name="name"
                      rules={[{ required: true, message: "Please enter your name" }]}
                      className="mb-0"
                    >
                      <Input 
                        placeholder="Enter your name"
                        className="h-11 rounded-full border border-orange-200 bg-orange-50/50 text-base font-medium px-4 hover:border-orange-300 focus:border-orange-400"
                      />
                    </Form.Item>
                  </div>

                  {/* Email Field */}
                  <div className="bg-white rounded-xl p-5 border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                        <MailOutlined className="text-white text-lg" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Email Address</span>
                    </div>
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: "Please enter your email" },
                        { type: "email", message: "Please enter a valid email" },
                      ]}
                      className="mb-0"
                    >
                      <Input 
                        placeholder="Enter your email"
                        className="h-11 rounded-full border border-blue-200 bg-blue-50/50 text-base font-medium px-4 hover:border-blue-300 focus:border-blue-400"
                      />
                    </Form.Item>
                  </div>

                  {/* Phone Field */}
                  <div className="bg-white rounded-xl p-5 border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                        <PhoneOutlined className="text-white text-lg" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Phone Number</span>
                    </div>
                    <Form.Item
                      name="phone_number"
                      rules={[
                        { required: true, message: "Please enter your phone number" },
                        { pattern: /^\d{10}$/, message: "Phone number must be 10 digits" },
                      ]}
                      className="mb-0"
                    >
                      <Input 
                        prefix={null}
                        addonBefore={
                          <CountryCodeSelect
                            countryCodes={countryCodes}
                            value={selectedCountryCode}
                            onChange={(value) => setSelectedCountryCode(value)}
                          />
                        }
                        placeholder="Enter your phone number"
                        maxLength={10}
                        onChange={handlePhoneNumberChange}
                        className="h-11 rounded-lg border-green-200 bg-green-50/50 text-base font-medium hover:border-green-300 focus:border-green-400"
                      />
                    </Form.Item>
                  </div>
                </div>
              </Form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Name Card */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-400 flex items-center justify-center">
                      <UserOutlined className="text-white text-lg" />
                    </div>
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Full Name</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 truncate">{userData.name || "Not provided"}</p>
                </div>

                {/* Email Card */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                      <MailOutlined className="text-white text-lg" />
                    </div>
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 truncate">{userData.email || "Not provided"}</p>
                </div>

                {/* Phone Card */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <PhoneOutlined className="text-white text-lg" />
                    </div>
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Phone</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{userData.phone_number || "Not provided"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileComponent;

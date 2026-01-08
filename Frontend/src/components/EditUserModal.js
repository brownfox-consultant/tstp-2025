import { EditOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { Form, Modal, Select, Input, Button, DatePicker, Row, Col } from "antd";
import { useForm } from "antd/es/form/Form";
import { editUser, getRoles, getUsersByRole } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import { useCountryCode } from "@/hooks/useCountryCode";

function EditUserModal({ recordData, updated, setUpdated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form] = useForm();

  const [facultyOptions, setFacultyOptions] = useState([]);
  const [mentorOptions, setMentorOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { roles } = useGlobalContext();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  const {
    countryCodes,
    selectedCountryCode,
    setSelectedCountryCode,
    parsePhoneNumber,
    formatPhoneNumber,
  } = useCountryCode("+91", recordData?.phone_number);

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

    // Format phone number with country code
    const payload = {
      ...formData,
      phone_number: `${selectedCountryCode}${formData.phone_number}`
    };

    editUser(recordData.id, payload)
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
      <style jsx global>{`
        /* Country Code Select Styling */
        .country-code-select .ant-select-selector {
          border: none !important;
          border-right: 1px solid #E5E7EB !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 12px 0 12px !important;
          margin-right: 12px !important;
        }
        .country-code-select .ant-select-selection-search {
          left: 8px !important;
        }
        .country-code-select .ant-select-selection-item {
          padding: 0 !important;
          font-weight: 500;
          color: #374151;
        }
        .country-code-select .ant-select-arrow {
          color: #6B7280;
          right: 0 !important;
        }
        .country-code-select:hover .ant-select-selector {
          border-right: 1px solid #D1D5DB !important;
        }
        .country-code-select.ant-select-focused .ant-select-selector {
          border-right: 1px solid #0071BC !important;
        }
        /* Phone Input Unified Styling */
        .phone-input-wrapper .ant-input-wrapper {
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .phone-input-wrapper .ant-input-wrapper:hover {
          border-color: #4096ff;
        }
        .phone-input-wrapper .ant-input-wrapper:focus-within {
          border-color: #0071BC;
          box-shadow: 0 0 0 2px rgba(0, 113, 188, 0.1);
        }
        .phone-input-wrapper .ant-input {
          border: none !important;
          box-shadow: none !important;
          padding-left: 12px !important;
        }
        .phone-input-wrapper .ant-input-group-addon {
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
      `}</style>
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
            phone_number: parsePhoneNumber(recordData?.phone_number),
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
                <Input
                  maxLength={10}
                  onChange={handlePhoneNumberChange}
                  className="rounded-lg phone-input-wrapper"
                  addonBefore={
                    <Select
                      showSearch
                      value={selectedCountryCode}
                      onChange={(value) => setSelectedCountryCode(value)}
                      style={{ width: 90 }}
                      bordered={false}
                      optionLabelProp="label"
                      dropdownMatchSelectWidth={false}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option.countryName || '').toLowerCase().includes(input.toLowerCase()) ||
                        String(option.value).includes(input)
                      }
                      dropdownStyle={{ zIndex: 10000, width: 300 }}
                      className="country-code-select"
                    >
                      {countryCodes.map((country) => (
                        <Select.Option
                          key={country.cca2}
                          value={country.code}
                          label={country.code}
                          countryName={country.name}
                        >
                          <div className="flex items-center gap-2">
                            <span>{country.name}</span>
                            <span className="text-gray-400">({country.code})</span>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  }
                />
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
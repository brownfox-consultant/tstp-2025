import { EditOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { Form, Modal, Select, Input, Button, DatePicker, Row, Col } from "antd";
import { useForm } from "antd/es/form/Form";
import { editUser, getRoles, getUsersByRole } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";

function EditUserModal({ recordData, updated, setUpdated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form] = useForm();

  const [facultyOptions, setFacultyOptions] = useState([]);
  const [mentorOptions, setMentorOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { roles } = useGlobalContext();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [countryCodes, setCountryCodes] = useState([]);
const [mainCode, setMainCode] = useState("+91");
const splitNumber = (num) => {
  if (!num) return { code: "+91", number: "" };

  const match = num.match(/^(\+\d{1,3})(\d{6,12})$/);
  if (match) {
    return { code: match[1], number: match[2] };
  }

  return { code: "+91", number: num.replace(/\D/g, "") };
};



  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
  form.resetFields();   // clear on close
  setIsModalOpen(false);
};



  useEffect(() => {
  fetch("https://restcountries.com/v3.1/all?fields=idd")
    .then((res) => res.json())
    .then((data) => {
      const codes = data
        .map((c) => {
          const root = c.idd?.root;
          const suffixes = c.idd?.suffixes;
          if (!root || !suffixes) return [];
          return suffixes.map((s) => `${root}${s}`);
        })
        .flat()
        .filter(Boolean);

      const uniqueCodes = [...new Set(codes)].sort((a, b) =>
        a.localeCompare(b)
      );

      setCountryCodes(uniqueCodes);
    })
    .catch(console.error);
}, []);


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

  useEffect(() => {
  if (isModalOpen && recordData) {
    // 🔥 IMPORTANT: clear old values first
    form.resetFields();

    const main = splitNumber(recordData.phone_number);

    setMainCode(main.code);

    form.setFieldsValue({
      ...recordData,
      phone_number: main.number,
    });
  }
}, [isModalOpen, recordData]);




  function handleSubmit(formData) {
  setLoading(true);

  const finalPayload = {
    ...formData,
    phone_number: `${mainCode}${formData.phone_number}`,
  };

  editUser(recordData.id, finalPayload)
    .then(() => {
      form.resetFields();
      setUpdated(!updated);
      handleCancel();
    })
    .catch(console.log)
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
          // initialValues={{
          //   ...recordData,
          //   course: recordData?.course_details?.course_name,
          // }}
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
    { required: true, message: "Please enter your contact number!" },
    { pattern: /^\d{10}$/, message: "Must be exactly 10 digits" },
  ]}
>
  <Input
    addonBefore={
      <select
        value={mainCode}
        onChange={(e) => setMainCode(e.target.value)}
        className="border-0 bg-transparent outline-none"
      >
        {countryCodes.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    }
    maxLength={10}
    onChange={(e) =>
      form.setFieldsValue({
        phone_number: e.target.value.replace(/\D/g, ""),
      })
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

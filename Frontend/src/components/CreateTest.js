import { createTest } from "@/app/services/authService";
import { getCoursesOutsideAuth } from "@/app/services/registerStudent";
import { LeftOutlined } from "@ant-design/icons";
import { Button, Form, Input, Radio, Select, Modal } from "antd";
import { useForm } from "antd/es/form/Form";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

function CreateTest({ setTestDetails }) {
  const params = useParams();
  const router = useRouter();
  const [options, setOptions] = useState([]);
  const [form] = useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  const onFieldsChange = (_, allFields) => {
    const isFormValid = allFields.every((field) => {
      if (!field.value || field.errors.length > 0) {
        return false;
      }
      return true;
    });
    setIsSubmitDisabled(!isFormValid);
  };

  useEffect(() => {
    getCoursesOutsideAuth()
      .then((res) => {
        setOptions(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  //   const closeModal = () => {
  //     setOpen(false);
  //     form.resetFields();
  //   };

  const onSubmit = (values) => {
    setCreateLoading(true);
    createTest(values)
      .then((res) => {
        //   Modal.success({
        //     content: "Test Created Successfully",
        //     onOk: closeModal,
        //   });
        setTestDetails(res.data);

        window.sessionStorage.setItem(
          `test-${res.data.id}`,
          JSON.stringify(res.data)
        );
        router.push(`/admin/${params.id}/tests/edit/${res.data.id}`);
        // afterSubmit();
      })
      .finally(() => setCreateLoading(false));
  };
  return (
    <Form
      form={form}
      onFinish={onSubmit}
      className="flex flex-col justify-center"
      onFieldsChange={onFieldsChange}
    >
      <div className="text-xl font-semibold mb-5 flex align-middle">
        <LeftOutlined
          onClick={() => router.back()}
          className="mr-2 text-base hover:font-extrabold"
        />{" "}
        Create Test
      </div>
      <Form.Item
        colon
        label={<div className="mr-6">Course</div>}
        name="course"
        required
      >
        <Select className="max-w-xs" placeholder="Select Course">
          {options &&
            options.map(({ id, name }) => {
              return (
                <Option key={id} value={id}>
                  {name}
                </Option>
              );
            })}
        </Select>
      </Form.Item>

      <Form.Item label="Test Name" name="name" required>
        <Input className="max-w-xs" placeholder="Enter Name"></Input>
      </Form.Item>

      <Form.Item label="Test Format" name="format_type" required>
        <Radio.Group>
          <Radio value="LINEAR">Linear</Radio>
          <Radio value="DYNAMIC">Dynamic</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item className="center w-full flex justify-center">
        <Button
          type="primary"
          htmlType="submit"
          loading={createLoading}
          disabled={isSubmitDisabled}
        >
          Create
        </Button>
      </Form.Item>
    </Form>
  );
}

export default CreateTest;

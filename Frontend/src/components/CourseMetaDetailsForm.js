import { CloseOutlined } from "@ant-design/icons";
import { Card, Col, DatePicker, Divider, Form, Radio, Row, Select } from "antd";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useState } from "react";

function CourseMetaDetailsForm({
  add,
  key,
  index,
  name,
  fields,
  courses,
  restField,
  remove,
}) {
  const [form] = useForm();

  const [selectedCourse, setSelectedCourse] = useState(courses[0]);

  const handleDateChange = (name, date, dateString) => {
    // Manually set the value of the date field in the format YYYY-MM-DD

    form.setFieldsValue({ apple: dateString });
  };

  return (
    <Col className="w-full border-slate-300 border-2 rounded-md py-3" key={key}>
      <div className="flex justify-between">
        <div className="text-base font-semibold">Course Details:</div>
        {index != 0 ? <CloseOutlined
          className="dynamic-delete-button mb-2"
          onClick={() => remove(name)}
        /> : null}
      </div>
      <Divider />
      <Row gutter={[4, 8]}>
        <Col span={24} md={12}>
          <Form.Item
            {...restField}
            label="Course"
            name={[name, "course"]}
            required
            wrapperCol={{ span: 12 }}
          >
            <Select
              onChange={(v) => setSelectedCourse(v)}
              value={selectedCourse}
              placeholder="Select Course"
              options={courses?.map((course) => {
                return { value: course.name, label: course.name };
              })}
            ></Select>
          </Form.Item>
        </Col>
        <Col span={24} md={12} className="">
          <Form.Item
            label={<div className="flex align-middle">Subscription Type</div>}
            name={[name, "subscription_type"]}
            rules={[
              { required: true, message: "Please select a subscription type!" },
            ]}
          >
            <Radio.Group>
              <Radio value="FREE">Free</Radio>
              <Radio value="PAID">Paid</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={24} md={12}>
          <Form.Item
            label="Subscription Start Date"
            name={[name, "subscription_start_date"]}
            rules={[{ required: true, message: "Please select a start date!" }]}
            // getValueFromEvent={(e) => e?.format("YYYY-MM-DD")}
            getValueProps={(e) => ({
              value: e ? dayjs(e) : "",
            })}
          >
            <DatePicker
              format={"YYYY-MM-DD"}
              disabledDate={(current) => {
                // Can not select days before today and today
                return current && current < dayjs().endOf("day");
              }}
              // onChange={(date, dateString) =>
              //   handleDateChange(name, date, dateString)
              // }
            />
          </Form.Item>
        </Col>
        <Col span={24} md={12}>
          <Form.Item
            label="Subscription End Date"
            name={[name, "subscription_end_date"]}
            rules={[{ required: true, message: "Please select an end date!" }]}
            // getValueFromEvent={(e) => e?.format("YYYY-MM-DD")}
            getValueProps={(e) => ({
              value: e ? dayjs(e) : "",
            })}
          >
            <DatePicker
              disabledDate={(current) => {
                // Can not select days before today and today
                return current && current < dayjs().endOf("day");
              }}
              onChange={handleDateChange}
            />
          </Form.Item>
        </Col>
      </Row>
    </Col>
  );
}

export default CourseMetaDetailsForm;

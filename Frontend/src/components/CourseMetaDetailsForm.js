import { CloseOutlined } from "@ant-design/icons";
import { Card, Col, DatePicker, Divider, Form, Radio, Row, Select, Button } from "antd";
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
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border-2 border-gray-200 shadow-sm" key={key}>
      <div className="flex justify-between items-center mb-2">
        <div className="text-base font-bold text-gray-800">Course Details:</div>
        {index != 0 && (
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => remove(name)}
            className="text-red-500 hover:text-red-700"
          />
        )}
      </div>
      <Divider className="my-2 border-gray-200" />
      
      <Row gutter={[12, 8]}>
        <Col xs={24} md={12}>
          <Form.Item
            {...restField}
            label={<div className="text-sm font-semibold text-gray-700">Course</div>}
            name={[name, "course"]}
            rules={[{ required: true, message: "Please select a course!" }]}
            style={{ marginBottom: 0 }}
          >
            <Select
              onChange={(v) => setSelectedCourse(v)}
              value={selectedCourse}
              placeholder="Select Course"
              size="large"
              className="h-10"
              options={courses?.map((course) => {
                return { value: course.name, label: course.name };
              })}
            />
          </Form.Item>
        </Col>
        
        <Col xs={24} md={12}>
          <Form.Item
            label={<div className="text-sm font-semibold text-gray-700">Subscription Type</div>}
            name={[name, "subscription_type"]}
            rules={[
              { required: true, message: "Please select a subscription type!" },
            ]}
            style={{ marginBottom: 0 }}
          >
            <Radio.Group className="flex gap-4">
              <Radio value="FREE" className="text-base">Free</Radio>
              <Radio value="PAID" className="text-base">Paid</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        
        <Col xs={24} md={12}>
          <Form.Item
            label={<div className="text-sm font-semibold text-gray-700">Subscription Start Date</div>}
            name={[name, "subscription_start_date"]}
            rules={[{ required: true, message: "Please select a start date!" }]}
            getValueProps={(e) => ({
              value: e ? dayjs(e) : "",
            })}
            style={{ marginBottom: 0 }}
          >
            <DatePicker
              format={"YYYY-MM-DD"}
              size="large"
              className="w-full h-10"
              placeholder="Select start date"
              disabledDate={(current) => {
                // Can not select days before today and today
                return current && current < dayjs().endOf("day");
              }}
            />
          </Form.Item>
        </Col>
        
        <Col xs={24} md={12}>
          <Form.Item
            label={<div className="text-sm font-semibold text-gray-700">Subscription End Date</div>}
            name={[name, "subscription_end_date"]}
            rules={[{ required: true, message: "Please select an end date!" }]}
            getValueProps={(e) => ({
              value: e ? dayjs(e) : "",
            })}
            style={{ marginBottom: 0 }}
          >
            <DatePicker
              size="large"
              className="w-full h-10"
              placeholder="Select end date"
              disabledDate={(current) => {
                // Can not select days before today and today
                return current && current < dayjs().endOf("day");
              }}
              onChange={handleDateChange}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}

export default CourseMetaDetailsForm;

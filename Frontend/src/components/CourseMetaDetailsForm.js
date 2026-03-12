import { CloseOutlined } from "@ant-design/icons";
import { Card, Col, DatePicker, Divider, Form, Radio, Row, Button } from "antd";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useState } from "react";
import ReactSelect, { components } from "react-select";

// Redefining DropdownIndicator and styles to match ApproveForm/CreateUserForm consistency.

const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <svg
        className={`w-4 h-4 transition-transform duration-200 ${props.selectProps.menuIsOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="#805830"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </components.DropdownIndicator>
  );
};

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '40px', // Match the h-10 class
    borderColor: state.isFocused ? '#F59405' : '#D1D5DB', // Using the orange theme color
    boxShadow: state.isFocused ? '0 0 0 1px #F59405' : 'none',
    '&:hover': {
      borderColor: '#F59405',
    },
    borderRadius: '0.5rem',
    backgroundColor: 'white',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#F59405'
      : state.isFocused
        ? '#FFF7E6' // Light orange
        : 'white',
    color: state.isSelected ? 'white' : '#1F2937',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#F59405',
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

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
  
  // Note: Form.List handles the form instance from the parent, no need to create a new one here unless for local usage.
  // The 'name' prop usually contains the field key path.

  const courseOptions = courses?.map((course) => ({ value: course.name, label: course.name }));

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
             {/* Using a render props pattern or wrapper to handle value binding if needed. 
                 Since the value coming from form is likely just the string name, we need to map it to the object for ReactSelect.
             */}
             <CourseSelectWrapper options={courseOptions} />
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
  // Cannot select dates before today
  return current && current < dayjs().startOf("day");
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
  const startDate = form.getFieldValue(["courses", name, "subscription_start_date"]);

  if (!startDate) {
    return current && current < dayjs().startOf("day");
  }

  return current && current <= dayjs(startDate).startOf("day");
}}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}

// Wrapper to handle AntD Form integration
const CourseSelectWrapper = ({ value, onChange, options }) => {
  const selectedOption = options?.find(opt => opt.value === value) || null;
  return (
    <ReactSelect
      value={selectedOption}
      onChange={(val) => onChange(val?.value)}
      options={options}
      placeholder="Select Course"
      components={{ DropdownIndicator }}
      styles={customSelectStyles}
      isClearable
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
    />
  );
};

export default CourseMetaDetailsForm;

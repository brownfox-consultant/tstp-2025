import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Popover, Select } from "antd";
import { useState } from "react";

const CustomSelect = ({ options = [], fieldName, ...props }) => {
  const [showInput, setShowInput] = useState(false);

  return (
    <>
      {showInput ? (
        <div className="flex justify-normal space-x-2">
          <Input {...props} placeholder={`${fieldName} Name`} />
          {/* <Popover content="Show Dropdown">
            <Button
              shape="circle"
              icon={<MinusOutlined />}
              onClick={() => setShowInput(false)}
              type="primary"
            ></Button>
          </Popover> */}
        </div>
      ) : (
        <div className="flex justify-normal space-x-2">
          <Select
  {...props}
  showSearch
  filterOption={(input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
  }
  placeholder={`Select ${fieldName}`}
  options={(Array.isArray(options) ? options : []).map((item) => {
    if (typeof item === "object" && item !== null) {
      return {
        value: item.value ?? item.id,  // ✅ use id if available
        label: item.label ?? item.name,
      };
    }
    return { value: item, label: item };
  })}
/>
          {/*  <Popover content={`Add ${fieldName}`}>
            <Button
              shape="circle"
              icon={<PlusOutlined />}
              onClick={() => setShowInput(true)}
              type="primary"
            ></Button>
          </Popover> */}
        </div>
      )}
    </>
  );
};

export default CustomSelect;

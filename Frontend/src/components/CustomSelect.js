import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Popover } from "antd";
import { useState } from "react";
import FormSelect from "./FormSelect";

const CustomSelect = ({ options = [], fieldName, className = "", ...props }) => {
  const [showInput, setShowInput] = useState(false);

  return (
    <>
      {showInput ? (
        <div className="flex justify-normal space-x-2">
          <Input 
            {...props} 
            placeholder={`${fieldName} Name`}
            size="large"
            className="!rounded-lg !h-12"
          />
        </div>
      ) : (
        <div className="flex justify-normal space-x-2 w-full">
          <FormSelect
            {...props}
            placeholder={`Select ${fieldName}`}
            options={options.map((item) => {
              if (typeof item === "object" && item !== null) {
                return {
                  value: item.name,
                  label: item.name,
                };
              }
              return { value: item, label: item };
            })}
            className={`w-full ${className}`}
          />
        </div>
      )}
    </>
  );
};

export default CustomSelect;

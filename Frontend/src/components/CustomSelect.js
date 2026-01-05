import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Popover } from "antd";
import { useState } from "react";
import FormSelect from "./FormSelect";

const CustomSelect = ({ options = [], fieldName, className = "", hideAddButton = false, ...props }) => {
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
          <Button
            shape="circle"
            icon={<MinusOutlined />}
            onClick={() => setShowInput(false)}
            className="flex-shrink-0 mt-1"
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
          {!hideAddButton && (
            <Button
              shape="circle"
              icon={<PlusOutlined />}
              onClick={() => setShowInput(true)}
              className="flex-shrink-0 mt-1"
            />
          )}
        </div>
      )}
    </>
  );
};

export default CustomSelect;

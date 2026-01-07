import React from "react";
import Select, { components } from "react-select";
import { ChevronIcon } from "./icons/dashboard-icons";

const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronIcon
        className="w-4 h-4"
        isOpen={props.selectProps.menuIsOpen}
        color="#805830"
      />
    </components.DropdownIndicator>
  );
};

const FormSelect = ({
  value,
  onChange,
  options = [],
  placeholder,
  className = "",
  getOptionLabel,
  getOptionValue,
  ...props
}) => {
  // Default getters
  const getLabel =
    getOptionLabel || ((option) => option?.label || option?.name || option);
  const getValue =
    getOptionValue ||
    ((option) =>
      option?.value !== undefined ? option?.value : option?.id || option);

  // Find selected option
  const selectedOption =
    options?.find((option) => {
      // Check for exact match (primitive) or match via getter
      const optVal = getValue(option);
      return optVal === value;
    }) || null;

    // Handle case where value might be the object itself if finding failed but value is object
    // (though form mostly uses primitives)
    const displayValue = selectedOption || (value && typeof value === 'object' ? value : null);
    
    // If value is a primitive but not found in options (e.g. initial load before options), 
    // we might want to just show placeholder or nothing. React-select handles null value as unselected.


  const handleChange = (selected) => {
    if (selected) {
      // Emit the value (primitive) to the form
      onChange(getValue(selected));
    } else {
      onChange(null);
    }
  };

  return (
    <Select
      className={`${className}`}
      options={options}
      value={displayValue}
      onChange={handleChange}
      getOptionLabel={getLabel}
      getOptionValue={getValue}
      placeholder={placeholder}
      components={{ DropdownIndicator }}
      classNamePrefix="react-select"
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null} 
      styles={{
        control: (base, state) => ({
            ...base,
            minHeight: '48px',
            borderRadius: '8px',
            borderColor: state.isFocused ? '#F59405' : '#E5E7EB',
            boxShadow: state.isFocused ? '0 0 0 1px #F59405' : 'none',
            '&:hover': {
                borderColor: '#F59405'
            }
        }),
        menuPortal: base => ({ ...base, zIndex: 9999 })
      }}
      {...props}
    />
  );
};

export default FormSelect;

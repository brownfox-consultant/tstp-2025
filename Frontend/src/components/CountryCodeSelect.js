import React from 'react';
import { Select } from 'antd';

/**
 * CountryCodeSelect Component
 * A dropdown for selecting country codes with search functionality
 */
const CountryCodeSelect = ({ countryCodes, value, onChange }) => {
  return (
    <>
      <style jsx global>{`
        .country-code-select .ant-select-selector {
          border: none !important;
          border-right: 1px solid #E5E7EB !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 12px 0 0 !important;
          margin-right: 12px !important;
        }
        .country-code-select .ant-select-selection-search {
          left: 0 !important;
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
        .country-code-select .ant-select-focused .ant-select-selector {
          border-right: 1px solid #0071BC !important;
        }
      `}</style>
      <Select
        showSearch
        value={value}
        onChange={onChange}
        className="country-code-select"
        style={{ width: 90 }}
        bordered={false}
        optionFilterProp="children"
        filterOption={(input, option) =>
          option.children.toLowerCase().includes(input.toLowerCase())
        }
        dropdownStyle={{ zIndex: 10000 }}
      >
        {countryCodes.map((country) => (
          <Select.Option key={country.cca2} value={country.code}>
            {country.code}
          </Select.Option>
        ))}
      </Select>
    </>
  );
};

export default CountryCodeSelect;

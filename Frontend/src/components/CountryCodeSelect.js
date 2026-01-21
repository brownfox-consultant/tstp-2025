import React from 'react';
import { Select } from 'antd';

/**
 * CountryCodeSelect Component
 * A dropdown for selecting country codes with search functionality
 * Shows country name + code for better UX
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
          padding: 0 18px 0 0 !important;
          margin-right: 24px !important;
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
        /* Dropdown styling */
        .country-code-dropdown .ant-select-item-option-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .country-code-dropdown .country-flag {
          font-size: 18px;
        }
        .country-code-dropdown .country-name {
          flex: 1;
          font-weight: 500;
          color: #374151;
        }
        .country-code-dropdown .country-code {
          color: #6B7280;
          font-size: 13px;
        }
      `}</style>
      <Select
        showSearch
        value={value}
        onChange={onChange}
        className="country-code-select"
        popupClassName="country-code-dropdown"
        style={{ width: 120 }}
        bordered={false}
        placeholder="+91"
        optionFilterProp="label"
        filterOption={(input, option) => {
          const searchText = input.toLowerCase();
          const countryName = option.label?.toLowerCase() || '';
          const countryCode = option.value?.toLowerCase() || '';
          return countryName.includes(searchText) || countryCode.includes(searchText);
        }}
        dropdownStyle={{ zIndex: 10000, minWidth: 280 }}
      >
        {countryCodes.map((country) => (
          <Select.Option 
            key={country.cca2} 
            value={country.code}
            label={country.name}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span className="country-name">{country.name}</span>
              <span className="country-code">{country.code}</span>
            </div>
          </Select.Option>
        ))}
      </Select>
    </>
  );
};

export default CountryCodeSelect;

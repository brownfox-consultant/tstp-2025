"use client";

import React, { useState } from 'react';
import './Tabs.css';

const Tabs = ({ 
  tabs = [], 
  activeTab, 
  onChange,
  className = '' 
}) => {
  const [active, setActive] = useState(activeTab || (tabs.length > 0 ? tabs[0].value : ''));

  const handleTabClick = (value) => {
    setActive(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className={`tabs ${className}`}>
      {tabs.map((tab, index) => (
        <button
          key={tab.value || index}
          className={`tab ${active === tab.value ? 'tab-active' : ''}`}
          onClick={() => handleTabClick(tab.value)}
          disabled={tab.disabled}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span className="tab-label">{tab.label}</span>
          {tab.badge && <span className="tab-badge">{tab.badge}</span>}
        </button>
      ))}
      <div 
        className="tab-indicator" 
        style={{
          width: `${99 / tabs.length}%`,
          transform: `translateX(${tabs.findIndex(t => t.value === active) * 100}%)`
        }}
      />
    </div>
  );
};

export default Tabs;

"use client";

import React, { useState } from 'react';
import './Tabs.css';

const Tabs = ({ 
  tabs = [], 
  activeTab, 
  onChange,
  className = '' 
}) => {
  /* State for active tab, defaulting to prop or first tab */
  const [active, setActive] = React.useState(activeTab || (tabs.length > 0 ? tabs[0].value : ''));
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = React.useRef([]);

  /* Sync state if prop changes */
  React.useEffect(() => {
    if (activeTab !== undefined) {
      setActive(activeTab);
    }
  }, [activeTab]);

  /* Update indicator position */
  React.useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.value === active);
    const currentTab = tabsRef.current[activeIndex];
    
    if (currentTab) {
      setIndicatorStyle({
        width: `${currentTab.offsetWidth}px`,
        transform: `translateX(${currentTab.offsetLeft}px)`
      });
    }
  }, [active, tabs]);

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
          ref={el => tabsRef.current[index] = el}
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
        style={indicatorStyle}
      />
    </div>
  );
};

export default Tabs;

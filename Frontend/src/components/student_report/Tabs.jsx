"use client";

import React, { useState, useEffect, useRef } from 'react';
import './Tabs.css';

const Tabs = ({ 
  tabs = [], 
  activeTab, 
  onChange,
  className = '' 
}) => {
  /* State for active tab, defaulting to prop or first tab */
  const [active, setActive] = useState(activeTab || (tabs.length > 0 ? tabs[0].value : ''));
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const tabsRef = useRef([]);
  const dropdownRef = useRef(null);

  /* Check screen size */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Sync state if prop changes */
  useEffect(() => {
    if (activeTab !== undefined) {
      setActive(activeTab);
    }
  }, [activeTab]);

  /* Update indicator position */
  useEffect(() => {
    if (isMobile) return;
    
    const activeIndex = tabs.findIndex(t => t.value === active);
    const currentTab = tabsRef.current[activeIndex];
    
    if (currentTab) {
      setIndicatorStyle({
        width: `${currentTab.offsetWidth}px`,
        transform: `translateX(${currentTab.offsetLeft}px)`
      });
    }
  }, [active, tabs, isMobile]);

  const handleTabClick = (value) => {
    setActive(value);
    setIsDropdownOpen(false);
    if (onChange) {
      onChange(value);
    }
  };

  /* Get active tab label */
  const activeTabLabel = tabs.find(t => t.value === active)?.label || 'Select Report';

  /* Mobile Dropdown View */
  if (isMobile) {
    return (
      <div className={`tabs-mobile-container ${className}`} ref={dropdownRef}>
        {/* Label */}
        <label className="tabs-mobile-label">Report Type</label>
        
        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`tabs-mobile-button ${isDropdownOpen ? 'open' : ''}`}
        >
          <span className="tabs-mobile-selected">{activeTabLabel}</span>
          <svg 
            className={`tabs-mobile-arrow ${isDropdownOpen ? 'rotate' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="tabs-mobile-dropdown">
            {tabs.map((tab, index) => (
              <div
                key={tab.value || index}
                onClick={() => !tab.disabled && handleTabClick(tab.value)}
                className={`tabs-mobile-option ${active === tab.value ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
              >
                {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                <span>{tab.label}</span>
                {active === tab.value && (
                  <svg className="tabs-mobile-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* Desktop Tabs View */
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

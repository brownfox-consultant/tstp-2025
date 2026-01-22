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
      <div className='bg-white rounded-xl p-5 border-l-4 border-orange-400 shadow-md relative' ref={dropdownRef}>
        {/* Label */}
        <label className="block text-sm font-semibold text-gray-700 mb-2">Report Type</label>
        
        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg hover:border-orange-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
        >
          <span className="text-base font-medium text-gray-800">{activeTabLabel}</span>
          <svg 
            className={`w-5 h-5 text-orange-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-orange-300 rounded-xl shadow-xl z-50 max-h-80 overflow-hidden">
            {tabs.map((tab, index) => (
              <div
                key={tab.value || index}
                onClick={() => !tab.disabled && handleTabClick(tab.value)}
                className={`relative flex items-center justify-between px-5 py-3.5 cursor-pointer transition-all duration-200 ${
                  active === tab.value 
                    ? 'bg-gradient-to-r from-orange-400 to-amber-400' 
                    : 'bg-white hover:bg-orange-50'
                } ${
                  tab.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.icon && <span className={active === tab.value ? 'text-white' : 'text-orange-500'}>{tab.icon}</span>}
                  <span className={`text-sm font-medium ${active === tab.value ? 'text-white' : 'text-gray-700'}`}>
                    {tab.label}
                  </span>
                </div>
                {active === tab.value && (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

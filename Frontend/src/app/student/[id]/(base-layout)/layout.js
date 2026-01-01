"use client";

import { Layout, theme as ThemeAntd, Tooltip } from "antd";
import React, { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { logoutService } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import logo from "./../../../../../public/logo_with_tagline.png";
import justlogo from "./../../../../../public/tstp-just-logo.png";
import Loading from "../../../admin/[id]/loading";
import { useMediaQuery } from "react-responsive";
import Image from "next/image";
import LogoutIcon from "@/components/icons/logout-icon";
import UserProfileIcon from "@/components/icons/user-profile-icon";
import FullLengthTestIcon from "@/components/icons/full-length-test-icon";
import OrangeSideBarIcon from "./../../../../../public/icons/orangesidebar.svg";

import {
  DashboardOutlined,
  BarChartOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  CommentOutlined,
  MenuUnfoldOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Content } = Layout;

function DashboardLayout({ children }) {
  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);
  const tab = pathParts.slice(2).join("/");
  const [isFreeUser, setIsFreeUser] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const type = window.localStorage.getItem("subscription_type");
      setIsFreeUser(type === "FREE");
    }
  }, []);

  const StudentMenuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      disabled: false,
    },
    {
      key: "report",
      icon: <BarChartOutlined />,
      label: "Report",
      disabled: false,
    },
    {
      key: "test/practice",
      icon: <EditOutlined />,
      label: "Self-Customised Practice Tests",
      disabled: isFreeUser,
    },
    {
      key: "test/full",
      icon: <FullLengthTestIcon />,
      label: "Full-Length Tests",
      disabled: false,
    },
    {
      key: "doubts",
      icon: <QuestionCircleOutlined />,
      label: "Doubts",
      disabled: isFreeUser,
    },
    {
      key: "issues",
      icon: <WarningOutlined />,
      label: "Issues",
      disabled: isFreeUser,
    },
    {
      key: "feedbacks",
      icon: <CommentOutlined />,
      label: "Feedbacks",
      disabled: isFreeUser,
    },
  ];

  const isMobile = useMediaQuery({
    query: "(max-width: 992px)",
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();
  const [csrfToken, setCsrfToken] = useState(undefined);
  
  // Ref to track if logout is in progress to prevent duplicate logout calls
  const isLoggingOut = React.useRef(false);

  const { id } = useParams();

  const {
    token: { colorBgContainer, borderRadius },
  } = ThemeAntd.useToken();

  const { collapsed, setCollapsed } = useGlobalContext();

  const handleLogout = useCallback(async () => {
    // Prevent duplicate logout calls
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    
    setLogoutLoading(true);
    try {
      await logoutService(csrfToken);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.localStorage.clear();
      router.replace("/login");
    }
  }, [csrfToken, router]);

  const handleProfileClick = useCallback(() => {
    const newPath = pathname.split("/");
    router.push(`${newPath.slice(0, 3).join("/")}`);
  }, [pathname, router]);

  const handleToggle = useCallback(() => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setCollapsed(!collapsed);
    }
  }, [isMobile, mobileMenuOpen, collapsed, setCollapsed]);

  const handleMenuClick = useCallback((key, disabled) => {
    if (disabled) return;
    router.push(`/student/${id}/${key}`);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [router, id, isMobile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Skip if already logging out
      if (isLoggingOut.current) return;
      
      const storedName = window.localStorage.getItem("name");
      if (storedName == null) {
        handleLogout();
        return;
      }
      if (window.localStorage.getItem("csrfToken")) {
        setCsrfToken(window.localStorage.getItem("csrfToken"));
        setEmail(window.localStorage.getItem("email"));
        setName(window.localStorage.getItem("name"));
      } else {
        router.replace("/login");
      }
    }
  }, [handleLogout, router]);

  // Sidebar widths
  const sidebarWidth = collapsed ? 67 : 280;

  return (
    <Layout className="min-h-screen">
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-50
          flex flex-col transition-all duration-300 ease-in-out
          ${isMobile ? (mobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : ''}
        `}
        style={{ width: isMobile ? 280 : sidebarWidth }}
      >
        {!isMobile && (
          <button
            onClick={handleToggle}
            className={`
              absolute top-5 z-50
              w-8 h-8 rounded-full bg-white border border-gray-200
              flex items-center justify-center cursor-pointer
              shadow-md hover:shadow-lg hover:bg-gray-50
              transition-all duration-300 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-primary-color focus:ring-opacity-50
            `}
            style={{ 
              right: -16,
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Image
              src={OrangeSideBarIcon}
              alt="Toggle Sidebar"
              width={16}
              height={16}
              className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        )}

        {/* Close Button for Mobile */}
        {isMobile && mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="
              absolute top-4 right-4 z-50
              w-8 h-8 rounded-full bg-gray-100
              flex items-center justify-center cursor-pointer
              hover:bg-gray-200 transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-color focus:ring-opacity-50
            "
            aria-label="Close menu"
          >
            <CloseOutlined className="text-gray-600 text-sm" />
          </button>
        )}

        {/* Logo Section */}
        <div className={`
          flex items-center h-20 min-h-[60px] px-4
          transition-all duration-300 ease-in-out
        `}>
          {collapsed && !isMobile ? (
            <Image
              alt="TSTP Logo"
              src={justlogo}
              className="transition-opacity duration-200"
              priority
              style={{ width: 40, height: 'auto' }}
            />
          ) : (
            <Image
              alt="TSTP Logo"
              src={logo}
              className="transition-opacity duration-200"
              priority
              style={{ width: 200, height: 'auto' }}
            />
          )}
        </div>

        {/* Menu Section */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
          {StudentMenuItems.map((item) => {
            const isActive = tab === item.key;
            const menuItemContent = (
              <div
                key={item.key}
                onClick={() => handleMenuClick(item.key, item.disabled)}
                className={`
                  flex items-center h-12 mb-1 rounded-lg cursor-pointer
                  transition-all duration-200 ease-in-out
                  ${isActive 
                    ? 'bg-primary-light-color text-primary-color' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  
                `}
                role="menuitem"
                tabIndex={item.disabled ? -1 : 0}
                aria-current={isActive ? 'page' : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleMenuClick(item.key, item.disabled);
                  }
                }}
              >
                <span className={`
                  flex items-center justify-center flex-shrink-0
                  w-12 h-12 text-lg
                `}>
                  {item.icon}
                </span>
       
                <span className={`
                  flex-1 text-sm font-medium whitespace-nowrap overflow-hidden
                  transition-all duration-300 ease-in-out
                  ${collapsed && !isMobile 
                    ? 'w-0 opacity-0 ml-0' 
                    : 'opacity-100 ml-1'
                  }
                `}>
                  {item.label}
                </span>
              </div>
            );

            if (collapsed && !isMobile) {
              return (
                <Tooltip
                  key={item.key}
                  title={item.label}
                  placement="right"
                  mouseEnterDelay={0.1}
                >
                  {menuItemContent}
                </Tooltip>
              );
            }

            return menuItemContent;
          })}
        </nav>

        <div className="mt-auto border-t border-gray-200 p-3">
          {/* When collapsed: Show Profile and Logout icons stacked */}
          {collapsed && !isMobile ? (
            <div className="flex flex-col items-center gap-2">
              {/* Profile Icon */}
              <Tooltip title="View Profile" placement="right" mouseEnterDelay={0.1}>
                <div
                  onClick={handleProfileClick}
                  className="
                    flex items-center justify-center rounded-lg cursor-pointer p-2
                    hover:bg-gray-100 transition-colors duration-200
                  "
                  role="button"
                  tabIndex={0}
                  aria-label="View Profile"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleProfileClick();
                    }
                  }}
                >
                  <UserProfileIcon />
                </div>
              </Tooltip>

              {/* Logout Icon */}
              <Tooltip title="Logout" placement="right" mouseEnterDelay={0.1}>
                <div
                  onClick={handleLogout}
                  className="
                    flex items-center justify-center rounded-lg cursor-pointer p-2
                    hover:bg-red-50 transition-colors duration-200
                  "
                  role="button"
                  tabIndex={0}
                  aria-label="Logout"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLogout();
                    }
                  }}
                >
                  <LogoutIcon />
                </div>
              </Tooltip>
            </div>
          ) : (
            /* When expanded: Show full profile with logout */
            <div
              onClick={handleProfileClick}
              className="
                flex items-center rounded-lg cursor-pointer p-2
                hover:bg-gray-100 transition-colors duration-200 gap-3
              "
              role="button"
              tabIndex={0}
              aria-label="View profile"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleProfileClick();
                }
              }}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <UserProfileIcon />
              </div>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {email}
                </div>
              </div>
              
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="
                  flex items-center justify-center flex-shrink-0
                  w-8 h-8 rounded-md cursor-pointer
                  hover:bg-gray-200 transition-all duration-200
                "
                role="button"
                tabIndex={0}
                aria-label="Logout"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogout();
                  }
                }}
              >
                <LogoutIcon />
              </div>
            </div>
          )}
        </div>
      </aside>

      {isMobile && !mobileMenuOpen && (
        <button
          onClick={handleToggle}
          className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center"
          aria-label="Open menu"
        >
          <MenuUnfoldOutlined className="text-primary-color" />
        </button>
      )}

      <Layout
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          minHeight: '100vh',
        }}
      >
        <Content
          style={{
            padding: 24,
            minHeight: "calc(100vh - 48px)",
            background: "#FAFAFA", // Gray-50 like background
            borderRadius: borderRadius,
            overflowY: "auto",
          }}
        >
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}

export default DashboardLayout;

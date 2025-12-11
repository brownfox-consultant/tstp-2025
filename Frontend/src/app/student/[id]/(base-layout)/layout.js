"use client";

import { Layout, Menu, Button, theme as ThemeAntd, Divider } from "antd";
import React, { Suspense } from "react";
import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { logoutService } from "@/app/services/authService";
import { useGlobalContext } from "@/context/store";
import logo from "./../../../../../public/logo_with_tagline.png";
import justlogo from "./../../../../../public/tstp-just-logo.png";
import Loading from "../../../admin/[id]/loading";
import { useMediaQuery } from "react-responsive";
import DashboardIcon from "./../../../../../public/icons/dashboard.svg";
import DashboardOrangeIcon from "./../../../../../public/icons/dashboard-orange.svg";
import TestsOrangeIcon from "./../../../../../public/icons/tests-orange.svg";
import TestsIcon from "./../../../../../public/icons/tests.svg";
import DoubtsIcon from "./../../../../../public/icons/doubts.svg";
import DoubtsOrangeIcon from "./../../../../../public/icons/doubts-orange.svg";
import IssuesIcon from "./../../../../../public/icons/issues.svg";
import IssuesOrangeIcon from "./../../../../../public/icons/issues-orange.svg";
import FeedBackIcon from "./../../../../../public/icons/feedbacks.svg";
import SideBarIcon from "./../../../../../public/icons/sidebar.svg";
import OrangeSideBarIcon from "./../../../../../public/icons/orangesidebar.svg";
import FeedBackOrangeIcon from "./../../../../../public/icons/feedbacks-orange.svg";
import Image from "next/image";
import LogoutIcon from "@/components/icons/logout-icon";
import UserProfileIcon from "@/components/icons/user-profile-icon";

import Icon, {
  AppstoreOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  DashboardOutlined,
  FileUnknownOutlined,
  FolderOpenOutlined,
  FontSizeOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionOutlined,
  SwapOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

function DashboardLayout({ children }) {
  // const [collapsed, setCollapsed] = useState(false);

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
    disabled: false, // always allowed
  },

  {
    key: "report",
    icon: <DashboardOutlined />,
    label: "Report",
    disabled: false, // always allowed
  },
  {
    key: "test/practice",
    icon: <FontSizeOutlined />,
    label: "Self-Customised Practice Tests",
    disabled: isFreeUser, // FREE user = disabled
  },
  {
    key: "test/full",
    icon: <FontSizeOutlined />,
    label: "Full-Length Tests",
    disabled: false, // always allowed for FREE
  },
  {
    key: "doubts",
    icon: <SwapOutlined />,
    label: "Doubts",
    disabled: isFreeUser,
  },
  {
    key: "issues",
    icon: <HistoryOutlined />,
    label: "Issues",
    disabled: isFreeUser,
  },
  {
    key: "feedbacks",
    icon: <SyncOutlined />,
    label: "Feedbacks",
    disabled: isFreeUser,
  },
];

  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  const isDesktopOrLaptop = useMediaQuery({
    query: "(min-width: 1224px)",
  });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();
  /*  const tab = usePathname().split("/")[3]; */
  

  const [displayLetter, setDisplayLetter] = useState("");
  const [csrfToken, setCsrfToken] = useState(undefined);

  const { id } = useParams();
  const LogoIcon = () => (
    <Image alt="logo" style={{ width: "220px" }} src={logo}></Image>
  );

  const JustLogoIcon = () => (
    <Image
      alt="logo"
      style={{ width: "100px", height: "20px" }}
      src={justlogo}
    ></Image>
  );

  const {
    token: { colorBgContainer, borderRadius },
  } = ThemeAntd.useToken();

  const { collapsed, setCollapsed } = useGlobalContext();

  function handleLogout() {
    setLogoutLoading(true);
    logoutService(csrfToken)
      .then(() => {
        // router.push("/login");
        window.location.href = "/login";
        window.localStorage.clear();
      })
      .catch((err) => console.log(err))
      .finally(() => setLogoutLoading(false));
  }

  function handleProfileClick() {
    let newPath = pathname.split("/");

    router.push(`${newPath.slice(0, 3).join("/")}`);
  }
  useEffect(() => {
    if (typeof window !== "undefined") {
      let name = window.localStorage.getItem("name");

      if (name == null) handleLogout();
      if (window.localStorage.getItem("csrfToken")) {
        setCsrfToken(window.localStorage.getItem("csrfToken"));
        setDisplayLetter(window.localStorage.getItem("name")[0]);
        setEmail(window.localStorage.getItem("email"));
        setName(window.localStorage.getItem("name"));
      } else {
        window.location.href = "/login";
      }
    }
  }, []);

  return (
    <Layout hasSider={true} style={{ minHeight: "100vh" }}>
      <Sider
        style={{
          background: colorBgContainer,
          height: "100vh",
          borderRight: "1px #EAECF0 solid",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
        width={collapsed ? 90 : 290}
        trigger={null}
        collapsible
        collapsed={isMobile ? true : collapsed}
        collapsedWidth={isMobile ? "0px" : "50px"}
      >
        {/* Logo Section */}
        <div className="demo-logo-vertical m-5 flex">
          {collapsed ? <JustLogoIcon /> : <LogoIcon />}
        </div>

        {/* Menu Section */}
       <Menu
  theme="light"
  mode="inline"
  selectedKeys={[tab]}
  onClick={({ key, item }) => {
    if (item.props.disabled) return; // block disabled clicks
    router.push(`/student/${id}/${key}`);
  }}
  items={StudentMenuItems}
/>


        <div className="w-100 fixed bottom-5">
          <Divider
            style={{
              width: collapsed ? "70px" : "90%",
              margin: "0 auto", // Center the divider properly within the sidebar
            }}
            type="horizontal"
          />
        <div
  className="flex items-center gap-2 py-2 px-1 cursor-pointer mt-2"
  style={{
    marginLeft: collapsed ? "0" : "2px",
    marginRight: "10px",
  }}
  onClick={handleProfileClick}   // ✅ added
>
  <UserProfileIcon />
  <div
    className="text-sm flex-0.5 overflow-hidden"
    style={{ minWidth: 0 }}
  >
    <div
      className="truncate"
      style={{ display: collapsed ? "none" : "block" }}
    >
      {name}
    </div>
    <div
      className="text-gray-400 truncate"
      style={{
        display: collapsed ? "none" : "block",
        maxWidth: collapsed ? "0px" : "160px",
      }}
    >
      {email}
    </div>
  </div>
  {!collapsed && (
    <div
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation(); // ✅ prevent profile click
        handleLogout();
      }}
      style={{
        marginLeft: "30px",
        flexShrink: 0,
      }}
    >
      <LogoutIcon />
    </div>
  )}
</div>

        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 50 : 250 }}>
        {/* Button to collapse/expand the sidebar */}
        <Button
          className="flex-none"
          type="text"
          icon={
            <Image
              src={collapsed ? OrangeSideBarIcon : OrangeSideBarIcon}
              alt="Dashboard Icon"
              width={25}
              height={25}
            />
          }
          onClick={() => setCollapsed(!collapsed)}
          style={{
            fontSize: "16px",
            width: 64,
            height: 64,
            position: "fixed",
            top: "20px",
            marginLeft: collapsed ? "3px" : "42px",
            marginTop: collapsed ? "-18px" : "-8px",
            transform: "translateX(-50%)",
            zIndex: 2, // Ensure the button is above the Sider
          }}
        />

        {/* Content Section */}
        <Content
          style={{
            padding: 24,
            minHeight: "calc(100vh - 64px)",
            background: colorBgContainer,
            borderRadius: borderRadius,
            overflowY: "auto",
            marginLeft: collapsed ? 0 : 42,
          }}
        >
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}

export default DashboardLayout;

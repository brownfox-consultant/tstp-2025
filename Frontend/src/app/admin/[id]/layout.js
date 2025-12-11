"use client";

import {
  Layout,
  Menu,
  Button,
  theme as ThemeAntd,
  Avatar,
  Dropdown,
  Divider,
} from "antd";
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
import React, { Suspense } from "react";
import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { logoutService } from "../../services/authService";
import { useGlobalContext } from "@/context/store";
import logo from "../../../../public/logo_with_tagline.png";
import justlogo from "../../../../public/tstp-just-logo.png";
import Loading from "./loading";
import { useMediaQuery } from "react-responsive";
import UserProfileIcon from "@/components/icons/user-profile-icon";
import LogoutIcon from "@/components/icons/logout-icon";
import Image from "next/image";
import OrangeSideBarIcon from "../../../../public/icons/orangesidebar.svg";

const { Header, Sider, Content } = Layout;

const AdminMenuItems = [
  {
    key: "dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "report",
    icon: <DashboardOutlined />,
    label: "Reports",
  },
  { key: "users", icon: <UserOutlined />, label: "Users" },
  {
    key: "courses",
    icon: <AppstoreOutlined />,
    label: "Courses",
  },
  {
    key: "tutorials",
    icon: <FolderOpenOutlined />,
    label: "Tutorials",
  },
  {
    key: "questions",
    icon: <QuestionOutlined />,
    label: "Questions",
  },
  {
    key: "suggestions",
    icon: <FileUnknownOutlined />,
    label: "Suggestions",
  },
  {
    key: "tests",
    icon: <FontSizeOutlined />,
    label: "Full Length Tests",
  },
  {
    key: "doubts",
    icon: <SwapOutlined />,
    label: "Doubts",
  },
  {
    key: "issues",
    icon: <HistoryOutlined />,
    label: "Issues",
  },
  {
    key: "concerns",
    icon: <CommentOutlined />,
    label: "Concerns",
  },
  {
    key: "meetings",
    icon: <ClockCircleOutlined />,
    label: "Meetings",
  },
  {
    key: "feedbacks",
    icon: <SyncOutlined />,
    label: "Feedbacks",
  },
];

function DashboardLayout({ children }) {
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  const isDesktopOrLaptop = useMediaQuery({
    query: "(min-width: 1224px)",
  });
  const [collapsed, setCollapsed] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();
  const tab = usePathname().split("/")[3];
  const pathname = usePathname();
  const { userName, role, userId } = useGlobalContext();
  const { id } = useParams();

  const [displayLetter, setDisplayLetter] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [csrfToken, setCsrfToken] = useState(undefined);

  const LogoIcon = () => (
    <Image alt="logo" style={{ width: "220px" }} src={logo}></Image>
  );
  const JustLogoIcon = () => (
    <Image alt="logo" style={{ width: "50px" }} src={justlogo}></Image>
  );

  const {
    token: { colorBgContainer, borderRadius },
  } = ThemeAntd.useToken();

  const currentTab = AdminMenuItems.find(({ key }) => key == tab);

  useEffect(() => {
    // if (typeof window !== "undefined") {
    if (window.localStorage.getItem("csrfToken")) {
      setCsrfToken(window.localStorage.getItem("csrfToken"));
      setDisplayLetter(window.localStorage.getItem("name")[0]);
      setEmail(window.localStorage.getItem("email"));
      setName(window.localStorage.getItem("name"));
    } else {
      window.location.href = "/login";
    }
    // }
  }, []);

  function handleProfileClick() {
    let newPath = pathname.split("/");
    router.push(`${newPath.slice(0, 3).join("/")}`);
  }

  function handleLogout() {
    setLogoutLoading(true);
    logoutService(csrfToken)
      .then(() => {
        window.location.href = "/login";

        window.localStorage.clear();
      })
      .finally(() => setLogoutLoading(false));
  }

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
        }}
        width={collapsed ? 50 : 250}
        trigger={null}
        collapsible={true}
        collapsed={collapsed}
        collapsedWidth={50}
      >
        <div className="demo-logo-vertical m-5 flex justify-end">
          {collapsed ? <JustLogoIcon /> : <LogoIcon />}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[tab]}
          onClick={({ key }) => {
            router.push(`/admin/${id}/${key}`);
            //setCollapsed(true);
          }}
          items={AdminMenuItems}
        />
        <div className=" w-100 fixed bottom-1">
          <Divider className=" w-1/2" type="horizontal" />
          <div
            onClick={handleProfileClick}
            className="flex items-center gap-2 py-2 px-1 cursor-pointer"
          >
            <UserProfileIcon />{" "}
            {!collapsed && (
              <div className="text-sm">
                <div>{name}</div>
                <div className=" text-gray-400"   style={{
    overflowWrap: "break-word",
    inlineSize: "150px",
  }}>{email}</div>
              </div>
            )}
            {!collapsed && (
              <div className=" cursor-pointer" onClick={handleLogout}>
                <LogoutIcon />
              </div>
            )}
          </div>
        </div>
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 50 : 250 }}>
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
            width: 40,
            height: 40,
            position: "absolute",
            top: "40px",
            marginLeft: collapsed ? "3px" : "2px",
            marginTop: collapsed ? "-20px" : "-8px",
            transform: "translateX(-50%)",
            zIndex: 2, // Ensure the button is above the Sider
          }}
        />
        <Content
          style={{
            padding: 24,
            minHeight: "calc(100vh - 64px)", // Adjust based on Header height
            background: colorBgContainer,
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

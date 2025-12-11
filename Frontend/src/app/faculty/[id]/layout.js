"use client";

import {
  ConfigProvider,
  Layout,
  Menu,
  Button,
  theme as ThemeAntd,
  Space,
  Avatar,
  Dropdown,
} from "antd";
import Icon, {
  AppstoreOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FilePptOutlined,
  FileUnknownOutlined,
  FolderOpenOutlined,
  FontSizeOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionOutlined,
  SwapOutlined,
  SyncOutlined,
  TableOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import React, { Suspense } from "react";
import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { logoutService } from "../../services/authService";
import { useGlobalContext } from "@/context/store";
import logo from "../../../../public/logo_with_tagline.png";
import justlogo from "../../../../public/tstp-just-logo.png";
import Image from "next/image";
import Loading from "./loading";
import { useMediaQuery } from "react-responsive";

const { Header, Sider, Content } = Layout;

const FacultyMenuItems = [
  {
    key: "dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "students",
    icon: <UserOutlined />,
    label: "Students",
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
    key: "practice",
    icon: <FilePptOutlined />,
    label: "Self-Customised Practice Test",
  },
  {
    key: "doubts",
    icon: <SwapOutlined />,
    label: "Doubts",
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
  const [collapsed, setCollapsed] = useState(!isDesktopOrLaptop);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();
  const tab = usePathname().split("/")[3];
  const pathname = usePathname();
  const { userName, role, userId } = useGlobalContext();
  const [displayLetter, setDisplayLetter] = useState("");
  const [csrfToken, setCsrfToken] = useState(undefined);

  const { id } = useParams();

  const LogoIcon = () => (
    <Image alt="logo" style={{ width: "220px" }} src={logo}></Image>
  );

  const JustLogoIcon = () => (
      <Image alt="logo" style={{ width: "50px" }} src={justlogo}></Image>
  );
  


  const onClick = ({ key }) => {
    if (key == 0) {
      let newPath = pathname.split("/");

      router.push(`${newPath.slice(0, 3).join("/")}`);
    }

    if (key == 1) {
      setLogoutLoading(true);
      logoutService(csrfToken)
        .then(() => {
          // router.push("/login");
          window.location.href = "/login";
          window.localStorage.clear();
        })
        .finally(() => setLogoutLoading(false));
    }
    let newPath = pathname.split("/");
  };

  const items = [
    {
      label: "Profile",
      key: 0,
    },
    {
      label: "Logout",
      key: 1,
    },
  ];

  const {
    token: { colorBgContainer, borderRadius },
  } = ThemeAntd.useToken();

  useEffect(() => {
    // if (typeof window !== "undefined") {
    if (window.localStorage.getItem("csrfToken")) {
      setCsrfToken(window.localStorage.getItem("csrfToken"));
      setDisplayLetter(window.localStorage.getItem("name")[0]);
    } else {
      window.location.href = "/login";
    }
    // }
  }, []);

  const currentTab = FacultyMenuItems.find(({ key }) => key == tab);

  return (
    <Layout hasSider={true}>
      <Sider
         style={{
          background: colorBgContainer,
         
        }}
        width={isMobile ? "85vw" : 230}
        // width={230}
        trigger={null}
        collapsedWidth={isMobile ? "0px" : "50px"}
        collapsible
        collapsed={collapsed}
      >
         <div className="demo-logo-vertical m-5 flex justify-end">
          {collapsed ? <JustLogoIcon /> : <LogoIcon />}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[tab]}
          onClick={({ key }) => {
            router.push(`/faculty/${id}/${key}`);
          }}
          items={FacultyMenuItems}
        />
      </Sider>
      <Layout>
        <Header
          className="flex"
          style={{
            padding: 0,
            background: colorBgContainer,
          }}
        >
          <Button
            className="flex-none"
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
          <div className="flex-grow font-semibold">{currentTab?.label}</div>
          {/* <Button
            shape="round"
            className="flex-none mt-5 mr-5 border"
            onClick={handleClick}
            loading={logoutLoading}
          >
            {"A"}
          </Button> */}
          <div className="mr-5">
            <Dropdown
              trigger={["click", "hover"]}
              menu={{ items: items, onClick }}
            >
              <Avatar
                className="cursor-pointer"
                style={{
                  backgroundColor: "#f56a00",
                  verticalAlign: "middle",
                }}
                size="medium"
              >
                {displayLetter}
              </Avatar>
            </Dropdown>
          </div>
        </Header>
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

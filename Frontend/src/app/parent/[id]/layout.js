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
  Modal,
  DatePicker,
} from "antd";
import Icon, {
  AppstoreOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileUnknownOutlined,
  FolderOpenOutlined,
  FontSizeOutlined,
  HistoryOutlined,
  IssuesCloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionOutlined,
  SwapOutlined,
  TableOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import React, { Suspense } from "react";
import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { logoutService, scheduleMeeting } from "../../services/authService";
import { useGlobalContext } from "@/context/store";
// import logo from "../../../../public/logo.png";
import logo from "../../../../public/logo_with_tagline.png";
import Image from "next/image";
import Loading from "./loading";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import { useMediaQuery } from "react-responsive";
import justlogo from "../../../../public/tstp-just-logo.png";


const { Header, Sider, Content } = Layout;



const getParentMenuItems = (tab) => [
  {
    key: "dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "test",
    icon: <FontSizeOutlined />,
    label: "Test & Practice Questions",
  },
  {
    key: "doubts",
    icon: <SwapOutlined />,
    label: "Doubts",
  },
  {
    key: "issues",
    icon: <IssuesCloseOutlined />,
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
    icon: (
      <Image
        src={tab === "feedbacks" ? "/icons/feedbacks-orange.svg" : "/icons/feedbacks.svg"}
        alt="Feedbacks Icon"
        width={20}
        height={20}
      />
    ),
    label: "Feedbacks",
  },
];


function DashboardLayout({ children }) {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isDesktopOrLaptop = useMediaQuery({ query: "(min-width: 1224px)" });
  const [collapsed, setCollapsed] = useState(!isDesktopOrLaptop);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();
  const tab = usePathname().split("/")[3];
  const ParentMenuItems = getParentMenuItems(tab);// ✅ move this up
  const pathname = usePathname();
  const { userName, role, userId, testRunning } = useGlobalContext();
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
      // router.push('')

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
        .catch((err) => console.log(err))
        .finally(() => setLogoutLoading(false));
    }

    let newPath = pathname.split("/");

    if (key == 2) {
      setOpenModal(true);
    }
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

  const currentTab = ParentMenuItems.find(({ key }) => key == tab);

  return (
    <Layout hasSider={true}>
      <Sider
        style={{
          background: colorBgContainer,
          
        }}
        width={isMobile ? "85vw" : 230}
        collapsedWidth={isMobile ? "0px" : "50px"}
        trigger={null}
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
            router.push(`/parent/${id}/${key}`);
          }}
          items={ParentMenuItems}
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

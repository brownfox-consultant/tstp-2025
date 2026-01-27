"use client";
import { getRoles, getUserDetails, validateSession } from "@/app/services/authService";
// import "@/lib/pdfWorkerConfig";
import {
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
} from "react";

const GlobalContext = createContext({
  userId: "",
  role: "",
  setUserId: () => "",
  setRole: () => "",
  subscriptionType: "",
  setSubscriptionType: () => "",
});

export const GlobalContextProvider = ({ children }) => {
  const [userId, setUserId] = useState();
  const [role, setRole] = useState();
  const [userName, setUserName] = useState();
  const [collapsed, setCollapsed] = useState(true);
  const [collapsedWidth, setCollapsedWidth] = useState(0);
  const [testRunning, setTestRunning] = useState(false);
  const [roles, setRoles] = useState([]);
  const [courseDetails, setCourseDetails] = useState({});
  const [subscriptionType, setSubscriptionType] = useState("");

  useEffect(() => {
    getRoles().then((res) => {
      setRoles(res.data);
    });
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await validateSession();
        if (res?.data) {
          setSubscriptionType(res.data.subscription_type);
          setUserId(res.data.id);
          setRole(res.data.role);
          setUserName(res.data.name);
        }
      } catch (error) {
        console.error("Session validation failed:", error);
      }
    };
    fetchSession();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        userId,
        setUserId,
        role,
        setRole,
        roles,
        setRoles,
        userName,
        setUserName,
        collapsed,
        setCollapsed,
        collapsedWidth,
        setCollapsedWidth,
        testRunning,
        setTestRunning,
        courseDetails,
        setCourseDetails,
        subscriptionType,
        setSubscriptionType,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);

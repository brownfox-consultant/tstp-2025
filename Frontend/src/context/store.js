"use client";
import { getRoles, getUserDetails } from "@/app/services/authService";
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
});

export const GlobalContextProvider = ({ children }) => {
  const [userId, setUserId] = useState();
  const [role, setRole] = useState();
  const [userName, setUserName] = useState();
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedWidth, setCollapsedWidth] = useState(0);
  const [testRunning, setTestRunning] = useState(false);
  const [roles, setRoles] = useState([]);
  const [courseDetails, setCourseDetails] = useState({});

  useEffect(() => {
    getRoles().then((res) => {
      setRoles(res.data);
    });
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
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);

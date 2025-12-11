"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";

// Create a context for loading state
const LoadingContext = createContext();

export function useLoading() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url, { shallow }) => {
      setLoading(!shallow);
    };

    router.events.on("routeChangeStart", handleRouteChange);
    router.events.on("routeChangeComplete", () => setLoading(false));
    router.events.on("routeChangeError", () => setLoading(false));

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
      router.events.off("routeChangeComplete", () => setLoading(false));
      router.events.off("routeChangeError", () => setLoading(false));
    };
  }, [router.events]);

  return (
    <LoadingContext.Provider value={loading}>
      {loading && <Loading />}
      {children}
    </LoadingContext.Provider>
  );
}

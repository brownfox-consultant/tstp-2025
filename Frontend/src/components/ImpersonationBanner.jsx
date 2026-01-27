"use client";

import { Button } from "antd";
import { exitImpersonation, validateSession } from "@/app/services/authService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ImpersonationBanner() {
  const router = useRouter();
  const [impersonated, setImpersonated] = useState(false);

  useEffect(() => {
    validateSession()
      .then((res) => {
        setImpersonated(res.data.impersonated === true);
      })
      .catch(() => {
        setImpersonated(false);
      });
  }, []);

  if (!impersonated) return null;

  const handleExit = () => {
  exitImpersonation().then((res) => {
    const { role, role_name, id, csrf_token, name } = res.data;

    localStorage.clear();

    setRole(role);
    setUserId(id);
    setUserName(name);

    localStorage.setItem("id", id);
    localStorage.setItem("name", name);
    localStorage.setItem("role_name", role_name);
    localStorage.setItem("csrfToken", csrf_token);

    router.push(`/${role_name}/${id}/dashboard`);
  });
};


  return (
    <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
      <span>⚠ You are impersonating another user</span>
      <Button danger size="small" onClick={handleExit}>
        Exit
      </Button>
    </div>
  );
}

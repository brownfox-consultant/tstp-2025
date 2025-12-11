import React, { useEffect, useState } from "react";
import ApproveForm from "@/components/ApproveForm";
import { LeftOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";

function ApproveComponent() {
  const router = useRouter();
  function handleBack() {
    window.sessionStorage.removeItem("approveStudentDetails");
    window.sessionStorage.removeItem("isTempUser");
    window.sessionStorage.removeItem("requireParentDetails");
    router.back();
  }
  const [userDetails, setUserDetails] = useState(null);
  const [isTempUser, setIsTempUser] = useState(false);
  const [requireParentDetails, setRequireParentDetails] = useState(false);
  const [areParentDetailsCompulsory, setAreParentDetailsCompulsory] =
    useState(true);
  const [isCreatedFromAdmin, setIsCreatedFromAdmin] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setUserDetails(
      JSON.parse(window.sessionStorage.getItem("approveStudentDetails"))
    );
    setIsTempUser(JSON.parse(window.sessionStorage.getItem("isTempUser")));
    setRequireParentDetails(
      JSON.parse(window.sessionStorage.getItem("requireParentDetails"))
    );
    setIsCreatedFromAdmin(
      JSON.parse(window.sessionStorage.getItem("isCreatedFromAdmin"))
    );
    setAreParentDetailsCompulsory(
      JSON.parse(window.sessionStorage.getItem("areParentDetailsCompulsory"))
    );
  }, []);
  return (
    <>
      <div className="text-2xl font-bold mb-5 flex align-middle">
        {!areParentDetailsCompulsory && (
          <LeftOutlined
            className="mr-2 text-base hover:font-extrabold cursor-pointer"
            onClick={() => handleBack()}
          />
        )}{" "}
        Approve Student User
      </div>

      {userDetails && (
        <ApproveForm
          data={userDetails}
          is_temp_user={isTempUser ? isTempUser : false}
          requireParentDetails={requireParentDetails}
          isCreatedFromAdmin={isCreatedFromAdmin}
        />
      )}
    </>
  );
}

export default ApproveComponent;

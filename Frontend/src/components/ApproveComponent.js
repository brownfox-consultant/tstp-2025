import React, { useEffect, useState } from "react";
import ApproveForm from "@/components/ApproveForm";
import { LeftOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { LeftArrowIcon } from "./icons/score-analysis-icons";

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
      <div className="text-2xl font-bold mb-5 flex items-center justify-between">
        <span>Approve Student User</span>
        {!areParentDetailsCompulsory && (
          <button
            className="bg-white px-3 py-1.5 rounded-lg shadow-sm text-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
            onClick={() => handleBack()}
          >
            <LeftArrowIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
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

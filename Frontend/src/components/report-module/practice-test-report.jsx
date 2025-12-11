import { getPracticeResults } from "@/app/services/authService";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ReportTable from "./report-table";
import Loading from "@/app/loading";
import BookmarkIcon from "../../../public/bookmark2.svg";
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  LeftOutlined,
} from "@ant-design/icons";
import { timeInMMSS } from "@/utils/utils";
import Image from "next/image";
import ReportStats from "./report-stats";

function PracticeTestReport() {
  const { practice_test_id, id } = useParams();
  const [resultData, setResultData] = useState({});
  const router = useRouter();

  useEffect(() => {
    getPracticeResults(practice_test_id).then((res) => {
      setResultData(res.data);
    });
  }, []);

  return Object.keys(resultData).length == 0 ? (
    <Loading />
  ) : (
    <div>
      <div className="w-full flex justify-between">
        <div>
          <div className="tracking-wide text-2xl flex place-items-center">
            <LeftOutlined
              className="text-lg cursor-pointer mr-2"
              onClick={() => router.push(`/student/${id}/test/practice`)}
            />{" "}
            {resultData.name}
          </div>
          <div className="">
            <span className="text-sm font-semibold">
              You took this test on:{" "}
            </span>{" "}
            <span>{new Date(resultData.testDate).toDateString()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="uppercase tracking-wide">Student Name</div>
          <div className="font-semibold text-lg">{resultData.student_name}</div>
        </div>
      </div>
      <div className="flex justify-start flex-col place-items-start border p-2 my-2">
        <div className="flex justify-between w-full">
          <div className="space-x-2">
            <span className="space-x-1 text-lg">
              <CheckCircleTwoTone twoToneColor="#52c41a" />{" "}
              {resultData.section_correct_count} Correct
            </span>
            <span className="space-x-1 text-lg">
              <CloseCircleTwoTone twoToneColor="#ff0000" />{" "}
              {resultData.section_incorrect_count} Incorrect
            </span>
            <span className="space-x-1 font-extralight text-xs">
              ({resultData.section_blank_count} Blank)
            </span>
          </div>

          <div className="flex gap-1 place-items-center">
            <span>
              <Image className="" src={BookmarkIcon} height={14} width={14} />
            </span>
            {resultData.marked} Marked
          </div>
        </div>
        <div className="space-y-0">
          <div className="space-x-2 flex justify-start">
            <span className="font-semibold text-left">Time On Section</span>:
            <span>{timeInMMSS(resultData.time_on_section)}</span>
          </div>
          <div className="space-x-2 flex justify-start">
            <span className="font-semibold">Time On Correct</span>:
            <span>{timeInMMSS(resultData.section_correct_time_taken)}</span>
          </div>
          <div className="space-x-2 flex justify-start">
            <span className="font-semibold">Time On Incorrect</span>:
            <span>{timeInMMSS(resultData.section_incorrect_time_taken)}</span>
          </div>
        </div>
      </div>

      <ReportTable sectionData={resultData} testSubmissionId={practice_test_id} />
      <ReportStats sectionData={resultData} testSubmissionId={practice_test_id} />
    </div>
  );
}

export default PracticeTestReport;

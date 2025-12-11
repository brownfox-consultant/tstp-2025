import React, { useEffect, useState } from "react";
import Summary from "./summary";
import ReportTabs from "./report-tabs";
import CurrentTab from "./current-tab";
import SectionSegmentLabel from "./section-segment-label";
import ReportTable from "./report-table";
import { getTestResult } from "@/app/services/authService";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import Loading from "@/app/loading";
import { LeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import ReportStats from "./report-stats";
import TestList from "@/components/TestList";

function Report({ testSubmissionId }) {
  const [resultData, setResultData] = useState({});
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams();
  const role = pathname.split("/")[1];

  const test_submission_id = searchParams.get("test_submission_id");

  const [selectedSubject, setSelectedSubject] = useState(0);

  const [currentSectionsArray, setCurrentSectionsArray] = useState([]);

  const [selectedSection, setSelectedSection] = useState(0);
  const [showTestList, setShowTestList] = useState(false);

  

  // const currentSubject = resultData ? resultData.subjects[selectedSubject] : {};
  // const currentSectionsArray = resultData
  //   ? resultData.subjects[selectedSubject].sections
  //   : [];
  useEffect(() => {
    getTestResult({
      test_submission_id: testSubmissionId
        ? testSubmissionId
        : test_submission_id,
    }).then((res) => {
      setResultData(res.data);
      setCurrentSectionsArray(res.data.subjects[selectedSubject].sections);
    });
  }, []);

  useEffect(() => {
    if (Object.keys(resultData).length != 0) {
      // setCurrentSubject(resultData.subjects[selectedSubject]);
      setCurrentSectionsArray(resultData.subjects[selectedSubject].sections);
    }
  }, [selectedSubject]);

  return (
    <>
      {Object.keys(resultData).length == 0 ? (
        <Loading />
      ) : showTestList ? (
        <TestList />
      ) : (
        <div className="max-w-7xl mx-auto my-5">
          <div className="w-full flex justify-between">
            <div>
              <div className="tracking-wide text-2xl flex place-items-center">
                {role != "admin" && (
                  <LeftOutlined
                    className="text-lg cursor-pointer mr-2"
                    onClick={() => {
                      /* router.push(`/${role}/${id}/test/`); */
                      /* setShowTestList(true); */
                      window.location.reload();
                    }}
                  />
                )}{" "}
                {resultData.testName}
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
              <div className="font-semibold text-lg">
                {resultData.studentName}
              </div>
              {/* 
              <Link
                href={`/report/test/${testSubmissionId ?? test_submission_id}`}
                target="_blank"
              >
                <ShareAltOutlined />
              </Link> */}
            </div>
          </div>
          <Summary data={resultData} />
          <ReportTabs
            options={resultData.subjects.map(({ name }, index) => {
              return {
                label: <div className="">{name}</div>,
                value: index,
                className: `py-2 border-t-4 ${
                  selectedSubject == index && "border-yellow-400 font-semibold"
                }`,
              };
            })}
            selectedValue={selectedSubject}
            handleChange={(value) => {
              setSelectedSubject(value);
            }}
          />
          <CurrentTab selectedSubject={selectedSubject} data={resultData} />
          <ReportTabs
            options={currentSectionsArray.map((sectionObj, index) => {
              return {
                label: <SectionSegmentLabel data={sectionObj} />,
                value: index,
                className: `py-2 border-t-4 ${
                  selectedSection == index && "border-yellow-400 "
                }`,
              };
            })}
            selectedValue={selectedSection}
            handleChange={(value) => {
              setSelectedSection(value);
            }}
          />
          <ReportTable sectionData={currentSectionsArray[selectedSection]} />
          <ReportStats sectionData={currentSectionsArray[selectedSection]} />
        </div>
      )}
    </>
  );
}

export default Report;

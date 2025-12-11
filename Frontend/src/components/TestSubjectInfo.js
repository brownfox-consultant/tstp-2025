import { getSubjectQuestions } from "@/app/services/authService";
import { Card, Col, Empty, Row } from "antd";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import TableComponent from "./TableComponent";
import EmptyTableComponent from "./EmptyTableComponent";

function TestSubjectInfo({ testDetails, setTestReady, updated, setUpdated }) {
  const [selectedSection, setSelectedSection] = useState("none");
  const { id, testId } = useParams();
  const router = useRouter();
  const role = usePathname().split("/")[1];
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [topics, setTopics] = useState([]);
  const [descSearch, setDescSearch] = useState("");

  const {
    course: courseId,
    course_name,
    format_type,
    test_type,
    id: test_id,
    name: testName,
    subject: subjects,
  } = testDetails;

  useEffect(() => {
    if (selectedSection !== "none") {
      setLoading(true);

      getSubjectQuestions({
        courseSubId: selectedSection.course_subject_id,
        page: current,
        params: {
          is_active: true,
          test_type: "FULL_LENGTH_TEST",
          description: descSearch,
        },
      })
        .then((res) => {
          let temp = [];

          const { results, count, current_page } = res.data;
          let subject = subjects.find(
            (subject) =>
              subject.course_subject === selectedSection.course_subject_id
          );
          subject.sections.forEach((section) => {
            if (section.id !== selectedSection.section_id) {
              section.questions.forEach((questionId) =>
                temp.push(Number(questionId))
              );
            }
          });

          setDataSource(
            results.questions.filter(({ id }) => !temp.includes(id))
          );
          setTopics(results.topics);
          setCurrent(current_page);
          setTotal(count);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedSection, current, descSearch]);

  // ✅ UseEffect to handle test readiness logic safely
  useEffect(() => {
    if (format_type !== "DYNAMIC" && subjects.length) {
      let ready = true;
      subjects.forEach(({ sections }) => {
        sections.forEach(({ questions, no_of_questions }) => {
          if (questions.length !== no_of_questions) {
            ready = false;
          }
        });
      });
      setTestReady(ready);
    }
  }, [format_type, subjects, setTestReady]);

  return format_type === "DYNAMIC" ? (
    <Empty description="Questions will be added dynamically for subjects and sections." />
  ) : (
    <>
      {selectedSection === "none" ? (
        subjects
          .sort((a, b) => a.order - b.order)
          .map(
            ({
              id: subject_id,
              course_subject: course_subject_id,
              name: subject_name,
              order,
              sections,
            }) => (
              <Card
                key={subject_id}
                title={subject_name}
                className="mb-5 bg-slate-100"
              >
                <Row gutter={[16, 8]}>
                  {sections
                    .sort((a, b) => a.order - b.order)
                    .map(
                      ({
                        id: section_id,
                        name: section_name,
                        duration,
                        questions,
                        no_of_questions,
                      }) => (
                        <Col md={8} sm={24} key={section_id}>
                          <Card
                            title={section_name}
                            hoverable
                            onClick={() => {
                              setSelectedSection({
                                subject_name,
                                subject_id,
                                test_id,
                                course_subject_id,
                                section_name,
                                section_id,
                                questions,
                                no_of_questions,
                                duration,
                              });

                              setSelectedRowKeys(
                                questions.map((val) => Number(val))
                              );
                            }}
                          >
                            <p>Duration: {duration} Minutes</p>
                            <p>
                              Questions: {questions.length} / {no_of_questions}
                            </p>
                          </Card>
                        </Col>
                      )
                    )}
                </Row>
              </Card>
            )
          )
      ) : (
        <Card
          key={selectedSection.subject_id}
          title={selectedSection.subject_name}
          className="mb-5 bg-slate-100"
        >
          {dataSource.length === 0 ? (
            <EmptyTableComponent
              sectionDetails={selectedSection}
              dataSource={dataSource}
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
              setSelectedSection={setSelectedSection}
              selectedSection={selectedSection}
              updated={updated}
              setUpdated={setUpdated}
              total={total}
              setCurrent={setCurrent}
              role={role}
              topics={topics}
              descSearch={descSearch}
              setDescSearch={setDescSearch}
              setDataSource={setDataSource}
            />
          ) : (
            <TableComponent
              sectionDetails={selectedSection}
              dataSource={dataSource}
              selectedRowKeys={selectedRowKeys}
              setSelectedRowKeys={setSelectedRowKeys}
              setSelectedSection={setSelectedSection}
              selectedSection={selectedSection}
              updated={updated}
              setUpdated={setUpdated}
              total={total}
              setCurrent={setCurrent}
              role={role}
              topics={topics}
              descSearch={descSearch}
              setDescSearch={setDescSearch}
              setDataSource={setDataSource}
            />
          )}
        </Card>
      )}
    </>
  );
}

export default TestSubjectInfo;

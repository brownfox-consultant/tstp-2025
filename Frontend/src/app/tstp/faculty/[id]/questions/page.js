// "use client";

// import QuestionsComponent from "@/components/QuestionsComponent";

// function QuestionsPage() {
//   return <QuestionsComponent />;
// }

// export default QuestionsPage;


"use client";

import { getCoursesInsideAuth } from "@/app/services/courseService";
// import QuestionsComponent from "@/components/QuestionsComponent";
import QuestionsComponent2 from "@/components/QuestionsComponent2";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "../loading";

function QuestionsPage() {
  // return <QuestionsComponent />;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    getCoursesInsideAuth()
      .then((res) => {
        setCourses(res.data);
        let params = new URLSearchParams(searchParams);
        let id = res.data[0].id;
        let course_subject_id = res.data[0].subjects[0].course_subject_id;
        if (params.has("course_subject_id") && params.has("page")) {
        } else {
          params.set("course_subject_id", course_subject_id.toString());
          params.set("page", "1");
          router.replace(`${pathname}?${params.toString()}`);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      {courses.length !== 0 ? (
        <QuestionsComponent2 courses={courses} />
      ) : (
        <Loading />
      )}
    </div>
  );
}

export default QuestionsPage;

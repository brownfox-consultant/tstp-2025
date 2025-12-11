import { getCoursesInsideAuth } from "@/app/services/courseService";
import { Tabs } from "antd";
import React, { useEffect, useState } from "react";
import MaterialsList from "./MaterialsList";
import { useParams, usePathname } from "next/navigation";
import { getUserDetails } from "@/app/services/authService";

function MaterialsComponent() {
  const [tabItems, setTabItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const role = usePathname().split("/")[1];
  const { id } = useParams();

  useEffect(() => {
    if (role == "student") {
      getUserDetails(id).then((res) => {
        // setCourses([res.data.course_details]);
        setCourses(res.data.course_details.map(({ course }) => course));
      });
    } else {
      getCoursesInsideAuth()
        .then((res) => {
          setCourses(res.data);
        })
        .catch((err) => console.log(err));
    }
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      setTabItems(
        courses.map((course) => {
          return {
            ...course,
            key: course.name,
            label: course.name,
            children: (
              <MaterialsList
                course={course.name}
                subjectsData={course.subjects}
              />
            ),
          };
        })
      );
    }
  }, [courses]);

  return <Tabs items={tabItems} />;
}

export default MaterialsComponent;

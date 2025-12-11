"use client";

export default function TabsCourses({ courses, selectedCourse, setSelectedCourse }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        width: "100%",
        justifyContent: "center",
        marginTop: "15px",
      }}
    >
      {courses.map((course) => (
        <button
          key={course.id}
          onClick={() => setSelectedCourse(course.id)}
          className={`course-tab ${selectedCourse === course.id ? "active" : ""}`}
        >
          {course.name}
        </button>
      ))}

      {/* INLINE CSS */}
      <style jsx>{`
        .course-tab {
          background: #f3f3f3;
          color: #444;
          padding: 10px 20px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: 0.25s;
          font-weight: 500;
        }

        .course-tab:hover {
          background: #e5e5e5;
        }

        .course-tab.active {
          background: #f59403; /* ORANGE */
          color: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}

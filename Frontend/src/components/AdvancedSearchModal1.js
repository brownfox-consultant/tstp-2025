import { Modal, Checkbox, Input, DatePicker, Tag, Button } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { BASE_URL } from "@/app/constants/apiConstants";
import axios from "axios";

const { RangePicker } = DatePicker;

const CATEGORIES = [
  "Course",
  "Created By",
  "Status",
  "Difficulty",
  "Created Date",
  "Question Text",
];

export default function AdvancedSearchModal1({ open, onClose, onApply, data = [] }) {
  const [filters, setFilters] = useState({});
  const [creators, setCreators] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Course");




useEffect(() => {
  const dataCreators = [...new Set(data.map((d) => d.created_by))];
  setCreators((prev) => Array.from(new Set([...prev, ...dataCreators])));
}, [data]);



  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

 useEffect(() => {
  const fetchCreators = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/suggestion/suggestion-creators/`, {
        withCredentials: true,
      });
      const data = res.data;
      const creatorNames = data.map((c) => c.name);
      setCreators(creatorNames);
    } catch (err) {
      console.error("Error fetching creators:", err);
    }
  };

  fetchCreators();
}, []);

useEffect(() => {
  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/course/list/`, {
        withCredentials: true,
      });
      setCourses(res.data); // [{ id: 1, name: "SAT" }, ...]
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  fetchCourses();
}, []);


  const removeTag = (category, value) => {
    const updated = { ...filters };
    if (Array.isArray(updated[category])) {
      updated[category] = updated[category].filter((v) => v !== value);
      if (updated[category].length === 0) delete updated[category];
    } else {
      delete updated[category];
    }
    setFilters(updated);
  };

  const renderOptions = () => {
    switch (activeCategory) {
     case "Course":
  return (
    <Checkbox.Group
      options={courses.map((c) => ({ label: c.name, value: c.id }))}
      value={filters.course || []}
      onChange={(val) => setFilters({ ...filters, course: val })}
    />
  );

      case "Created By":
        return (
          <Checkbox.Group
            options={creators}
            value={filters["created_by"] || []}
            onChange={(val) => setFilters({ ...filters, created_by: val })}
          />
        );
      case "Status":
        return (
          <Checkbox.Group
            options={["APPROVED", "IN_REVIEW", "REJECTED"]}
            value={filters.status || []}
            onChange={(val) => setFilters({ ...filters, status: val })}
          />
        );
      case "Difficulty":
        return (
          <Checkbox.Group
            options={["VERY_EASY","EASY", "MODERATE", "HARD","VERY_HARD"]}
            value={filters.difficulty || []}
            onChange={(val) => setFilters({ ...filters, difficulty: val })}
          />
        );
      case "Created Date":
        return (
          <RangePicker
            value={filters.dateRange || []}
            onChange={(val) => setFilters({ ...filters, dateRange: val })}
          />
        );
      case "Question Text":
        return (
          <Input
            placeholder="Search..."
            value={filters.question || ""}
            onChange={(e) => setFilters({ ...filters, question: e.target.value })}
          />
        );
      default:
        return null;
    }
  };

 const renderAppliedTags = () => {
  const tags = [];

  const getCourseName = (id) => {
    const c = courses.find((x) => x.id === id);
    return c ? c.name : id;
  };

  for (const [key, value] of Object.entries(filters)) {

    // ----- COURSE TAGS (IDs → Names) -----
    if (key === "course" && Array.isArray(value)) {
      value.forEach((v) =>
        tags.push(
          <Tag key={`course-${v}`} closable onClose={() => removeTag(key, v)}>
            {getCourseName(v)}
          </Tag>
        )
      );
      continue; // prevent default handling
    }

    // ----- ARRAY TAGS (generic) -----
    if (Array.isArray(value)) {
      value.forEach((v) =>
        tags.push(
          <Tag key={`${key}-${v}`} closable onClose={() => removeTag(key, v)}>
            {v}
          </Tag>
        )
      );
      continue;
    }

    // ----- DATE RANGE TAG -----
    if (key === "dateRange") {
      tags.push(
        <Tag
          key="dateRange"
          closable
          onClose={() => setFilters({ ...filters, dateRange: null })}
        >
          {dayjs(value?.[0]).format("DD MMM")} - {dayjs(value?.[1]).format("DD MMM")}
        </Tag>
      );
      continue;
    }

    // ----- NORMAL SINGLE VALUE TAG -----
    tags.push(
      <Tag key={key} closable onClose={() => removeTag(key, value)}>
        {value}
      </Tag>
    );
  }

  return tags.length > 0 ? (
    <div className="mb-4 flex gap-2 flex-wrap">
      <strong>Applied Keywords:</strong>
      {tags}
      <Button type="link" size="small" onClick={handleClear}>
        Clear All
      </Button>
    </div>
  ) : null;
};


  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="clear" onClick={handleClear}>
          Clear
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Apply
        </Button>,
      ]}
      width={800}
      title="Advanced Search"
    >
      {renderAppliedTags()}
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ width: 150 }}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={`cursor-pointer px-3 py-2 rounded hover:bg-gray-100 ${
                activeCategory === cat ? "bg-gray-200 font-semibold" : ""
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>{renderOptions()}</div>
      </div>
    </Modal>
  );
}

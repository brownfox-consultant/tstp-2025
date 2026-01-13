import { Modal, Checkbox, Input, DatePicker, Tag, Button, Radio } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { BASE_URL } from "@/app/constants/apiConstants";
import axios from "axios";
import { SearchOutlined, FilterOutlined, CloseOutlined } from "@ant-design/icons";
import { difficultyTags } from "@/utils/utils";

const { RangePicker } = DatePicker;

const CATEGORIES = [
  { key: "Course", label: "Course" },
  { key: "Created By", label: "Created By" },
  { key: "Status", label: "Status" },
  { key: "Difficulty", label: "Difficulty" },
  { key: "Created Date", label: "Created Date" },
  { key: "Question Text", label: "Question Text" },
];

export default function AdvancedSearchModal1({ open, onClose, onApply, data = [] }) {
  const [localFilters, setLocalFilters] = useState({});
  const [creators, setCreators] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Course");

  useEffect(() => {
    if (data?.length) {
      const dataCreators = [...new Set(data.map((d) => d.created_by))];
      setCreators((prev) => Array.from(new Set([...prev, ...dataCreators])));
    }
  }, [data]);

  // Fetch creators from API
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/suggestion/suggestion-creators/`, {
          withCredentials: true,
        });
        const apiCreators = res.data.map((c) => c.name);
        setCreators((prev) => Array.from(new Set([...prev, ...apiCreators])));
      } catch (err) {
        console.error("Error fetching creators:", err);
      }
    };
    fetchCreators();
  }, []);

  // Fetch courses from API
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

  // Reset/Initialize filters when opening
  useEffect(() => {
    if (open) {
      // Logic to preserve previous filters if needed could go here, 
      // but typically we might start fresh or pass currentFilters prop.
      // For now, retaining state is fine or reset if preferred.
      // If we want to persist between opens, don't clear here.
    }
  }, [open]);


  // --- HANDLERS ---

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClearAll = () => {
    setLocalFilters({});
  };

  const handleTagClose = (key, value) => {
    const updated = { ...localFilters };
    if (key === "dateRange") {
      delete updated.dateRange;
    } else if (["question"].includes(key) || key === "Question Text") {
         delete updated[key];
         // Note: original code used key="question" for Question Text input
    } else if (Array.isArray(updated[key])) {
      updated[key] = updated[key].filter((v) => v !== value);
      if (updated[key].length === 0) delete updated[key];
    } else {
      delete updated[key];
    }
    setLocalFilters(updated);
  };

  // --- RENDERERS ---

  const renderContentPane = () => {
    switch (activeCategory) {
      case "Course":
        return (
           <div className="h-full overflow-y-auto">
            <Checkbox.Group
              className="w-full"
              value={localFilters.course || []}
              onChange={(val) => setLocalFilters({ ...localFilters, course: val })}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {courses.map((c) => (
                  <Checkbox key={c.id} value={c.id} className="text-gray-700 hover:text-blue-600 border border-gray-200 rounded-md p-2 hover:bg-blue-50 transition-colors">
                    {c.name}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </div>
        );

      case "Created By":
        return (
          <div className="h-full overflow-y-auto">
            <Checkbox.Group
              className="w-full"
              value={localFilters["created_by"] || []}
              onChange={(val) => setLocalFilters({ ...localFilters, created_by: val })}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {creators.map((name) => (
                  <Checkbox key={name} value={name} className="text-gray-700 hover:text-blue-600 border border-gray-200 rounded-md p-2 hover:bg-blue-50 transition-colors">
                    {name}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </div>
        );

      case "Status":
        return (
           <div className="h-full overflow-y-auto">
            <Checkbox.Group
              className="w-full"
              value={localFilters.status || []}
              onChange={(val) => setLocalFilters({ ...localFilters, status: val })}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {["APPROVED", "IN_REVIEW", "REJECTED"].map((status) => (
                   <Checkbox key={status} value={status} className="text-gray-700 hover:text-blue-600 border border-gray-200 rounded-md p-2 hover:bg-blue-50 transition-colors">
                     {status}
                   </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </div>
        );

      case "Difficulty":
        return (
          <div className="h-full overflow-y-auto">
             <Checkbox.Group
                className="w-full"
                value={localFilters.difficulty || []}
                onChange={(val) => setLocalFilters({ ...localFilters, difficulty: val })}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {difficultyTags.map((d) => (
                    <Checkbox key={d.value} value={d.value} className="text-gray-700 hover:text-blue-600 border border-gray-200 rounded-md p-2 hover:bg-blue-50 transition-colors">
                      {d.label}
                    </Checkbox>
                  ))}
                </div>
              </Checkbox.Group>
          </div>
        );

      case "Created Date":
        return (
          <div>
            <RangePicker
              value={localFilters.dateRange || []}
              onChange={(val) => setLocalFilters({ ...localFilters, dateRange: val })}
              size="large"
              className="w-full"
            />
          </div>
        );

      case "Question Text":
        return (
           <div>
             <Input
                placeholder="Search text in questions..."
                value={localFilters.question || ""}
                onChange={(e) => setLocalFilters({ ...localFilters, question: e.target.value })}
                prefix={<SearchOutlined />}
                size="large"
                className="w-full"
              />
           </div>
        );

      default:
        return null;
    }
  };

  const getCourseName = (id) => {
    const c = courses.find((x) => x.id === id);
    return c ? c.name : id;
  };

  const getDifficultyLabel = (val) => {
    const tag = difficultyTags.find(d => d.value === val);
    return tag ? tag.label : val;
  };

  const appliedTags = () => {
    const tags = [];
    for (const [key, value] of Object.entries(localFilters)) {
      if (!value) continue;

      // Course
      if (key === "course" && Array.isArray(value)) {
        value.forEach((v) => tags.push({ key, value: v, label: getCourseName(v) }));
        continue;
      }

      // Difficulty
      if (key === "difficulty" && Array.isArray(value)) {
        value.forEach((v) => tags.push({ key, value: v, label: getDifficultyLabel(v) }));
        continue;
      }

      // Date Range
      if (key === "dateRange") {
        if (value && value.length === 2) {
           tags.push({ key, value: "dateRange", label: `${dayjs(value[0]).format("DD MMM")} - ${dayjs(value[1]).format("DD MMM")}` });
        }
        continue;
      }

      // Question Text
      if (key === "question" && typeof value === 'string' && value.trim()) {
         tags.push({ key, value: value, label: `Text: "${value}"` });
         continue;
      }

      // Generic Arrays (Created By, Status)
      if (Array.isArray(value)) {
        value.forEach((v) => tags.push({ key, value: v, label: v }));
        continue;
      }
    }
    return tags;
  };


  // --- MAIN RENDER ---
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={null}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      className="p-0 rounded-xl overflow-hidden"
      bodyStyle={{ padding: 0 }}
      closeIcon={null}
    >
      <div className="flex flex-col h-[450px] bg-white">
        
        {/* 1. Header & Applied Filters */}
        <div className="shrink-0  pb-4">
           <div className="flex justify-between items-center mb-3">
             <h2 className="text-xl font-bold text-gray-800 m-0">Advanced Search</h2>
             <button type="text" onClick={onClose} className="text-gray-500 hover:text-red-500 bg-transparent text-lg"><CloseOutlined /></button>
           </div>

           {/* Applied Filters Bar */}
           <div className="min-h-[46px] bg-gray-50 border border-gray-200 rounded-md p-2 flex flex-wrap gap-2 items-center">
             <span className="text-gray-400 text-sm select-none px-1">
                <FilterOutlined /> Filters:
             </span>
             {appliedTags().length === 0 ? (
                <span className="text-gray-400 text-sm italic">No filters selected.</span>
             ) : (
                <>
                  {appliedTags().map((tag) => (
                    <Tag
                      key={`${tag.key}-${tag.value}`}
                      closable
                      onClose={() => handleTagClose(tag.key, tag.value)}
                      className="flex items-center bg-white border-blue-200 text-blue-700 rounded px-2 py-1 m-0 text-sm shadow-sm"
                    >
                      {tag.label}
                    </Tag>
                  ))}
                  <Button 
                    type="link" 
                    size="small" 
                    danger 
                    onClick={handleClearAll} 
                    className="text-xs ml-auto"
                  >
                    Clear All
                  </Button>
                </>
             )}
           </div>
        </div>

        {/* 2. Main Content (Sidebar + Content) */}
        <div className="flex flex-1 overflow-hidden border border-gray-200 rounded-md">
           {/* Sidebar */}
           <div className="w-1/4 min-w-[160px] bg-gray-50 border-r border-gray-200 overflow-y-auto">
             {CATEGORIES.map((cat) => {
               const isActive = activeCategory === cat.key;
               // Check if this category has active filters
               let hasFilters = false;
               if (cat.key === "Course") hasFilters = localFilters.course?.length > 0;
               else if (cat.key === "Created By") hasFilters = localFilters.created_by?.length > 0;
               else if (cat.key === "Status") hasFilters = localFilters.status?.length > 0;
               else if (cat.key === "Difficulty") hasFilters = localFilters.difficulty?.length > 0;
               else if (cat.key === "Created Date") hasFilters = !!localFilters.dateRange;
               else if (cat.key === "Question Text") hasFilters = !!localFilters.question;

               return (
                 <div
                   key={cat.key}
                   onClick={() => setActiveCategory(cat.key)}
                   className={`
                     group p-3 cursor-pointer text-sm font-medium flex justify-between items-center transition-all border-l-4
                     ${isActive 
                       ? "bg-white border-l-blue-600 text-blue-700 shadow-[0_2px_8px_-5px_rgba(0,0,0,0.1)]" 
                       : "border-l-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
                   `}
                 >
                   <span>{cat.label}</span>
                   {hasFilters && <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>}
                 </div>
               );
             })}
           </div>

           {/* Content Pane */}
           <div className="flex-1 bg-white p-4">
             <div className="mb-4 pb-2 border-b border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800 m-0">
                  Select {activeCategory}
               </h3>
             </div>
             {renderContentPane()}
           </div>
        </div>

        {/* 3. Footer */}
        <div className="pt-4 bg-white flex justify-end gap-3 shrink-0">
           <Button onClick={onClose} size="large" className="hover:bg-gray-50">
             Cancel
           </Button>
           <Button 
             type="primary" 
             onClick={handleApply} 
             size="large" 
             className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
             icon={<SearchOutlined />}
           >
             Apply Filters
           </Button>
        </div>

      </div>
    </Modal>
  );
}

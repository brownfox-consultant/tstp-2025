import { Modal, Checkbox, Divider, Tag, Input, Button, Radio, Select } from "antd";
import { useEffect, useState } from "react";
import { SearchOutlined, FilterOutlined, CloseOutlined } from "@ant-design/icons";

// --- 1. DATA & HELPER FUNCTIONS (UNCHANGED) ---
const keywordMap = [
  { key: "question_text", label: "Question" },
  { key: "option_text", label: "Option" },
  { key: "difficulty", label: "Difficulty" },
  { key: "question_type", label: "Question Type" },
  { key: "question_subtype", label: "Question Subtype" },
  { key: "test_type", label: "Test Type" },
  { key: "topic", label: "Topic" },
  { key: "sub_topic", label: "Subtopic" },
  { key: "srno", label: "Que. Id" },
  { key: "is_active", label: "Status" },
];

function groupTopicsBySubject(topics) {
  const subjectMap = {};

  topics.forEach((topic) => {
    topic.subtopics?.forEach((sub) => {
      const subjectName = sub.subject?.name || "Other";
      if (!subjectMap[subjectName]) subjectMap[subjectName] = {};
      if (!subjectMap[subjectName][topic.name]) subjectMap[subjectName][topic.name] = [];
      subjectMap[subjectName][topic.name].push(sub);
    });
  });

  // Sort topics & subtopics alphabetically
  Object.keys(subjectMap).forEach((subject) => {
    Object.keys(subjectMap[subject]).forEach((topic) => {
      subjectMap[subject][topic].sort((a, b) => a.name.localeCompare(b.name));
    });
  });

  return subjectMap;
}

function groupTopicsOnlyBySubject(topics) {
  const map = {};
  topics.forEach((t) => {
    const subjectName = t.subject?.name || "Other";
    if (!map[subjectName]) map[subjectName] = [];
    map[subjectName].push(t);
  });
  Object.keys(map).forEach((s) => map[s].sort((a, b) => a.name.localeCompare(b.name)));
  return map;
}

function getUniqueCourses(topics) {
  const map = {};
  topics.forEach((t) => {
    if (t.course?.id) map[t.course.id] = t.course;
  });
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
}



// --- 2. MAIN COMPONENT ---
export default function AdvancedSearchModal({
  open,
  onClose,
  onApply,
  currentFilters = {},
  topics = [],
  difficultyList = [],
  questionTypeList = [],
  questionSubtypeList = [],
  testTypeList = [],
  selectedCourseName = "",
  selectedCourseId = "ALL",
}) {
  const [activeCategory, setActiveCategory] = useState("difficulty");
  const [localFilters, setLocalFilters] = useState({});
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [selectedCourse, setSelectedCourse] = useState(selectedCourseId || "ALL");

  useEffect(() => {
    setLocalFilters(currentFilters || {});
  }, [currentFilters, open]);

  // --- LOGIC (UNCHANGED) ---
  useEffect(() => {
    if (open) {
      setSelectedSubject("ALL");
      setSelectedCourse(selectedCourseId || "ALL");
      const filters = { ...currentFilters };
      if (filters.is_active) {
        filters.is_active = filters.is_active.map((v) => (v ? "true" : "false"));
      }
      if (filters.question_subtype) {
        filters.question_subtype = filters.question_subtype.map(String);
      }
      setLocalFilters(filters);
    }
  }, [open]);

  const renderSubjectRadio = () => (
    <div className="mb-4">
      <Radio.Group
        value={selectedSubject}
        onChange={(e) => setSelectedSubject(e.target.value)}
        buttonStyle="solid"
        className="w-full flex"
      >
        <Radio.Button value="ALL" className="flex-1 text-center">All</Radio.Button>
        <Radio.Button value="English" className="flex-1 text-center">English</Radio.Button>
        <Radio.Button value="Math" className="flex-1 text-center">Math</Radio.Button>
      </Radio.Group>
    </div>
  );


  const renderCheckboxList = (key, options) => (
    <div className="h-full overflow-y-auto">
      <Checkbox.Group
        value={localFilters[key] || []}
        onChange={(vals) => setLocalFilters((prev) => ({ ...prev, [key]: vals }))}
        className="w-full"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {options.map((opt) => {
            const label = typeof opt === "string" ? opt : opt.label;
            const value = typeof opt === "string" ? opt : opt.value;
            return (
              <Checkbox key={value} value={value} className="text-gray-700 hover:text-blue-600 border border-gray-200 rounded-md p-2 hover:bg-blue-50 transition-colors">
                {label}
              </Checkbox>
            );
          })}
        </div>
      </Checkbox.Group>
    </div>
  );

  const renderTopics = () => {
    const filteredTopics = selectedCourseId === "ALL" ? topics : topics.filter((t) => t.course?.id === selectedCourseId);
    const grouped = groupTopicsBySubject(filteredTopics);
    const subjectsToRender = selectedSubject === "ALL" ? Object.keys(grouped) : Object.keys(grouped).filter((s) => s === selectedSubject);

    return (
      <div className="flex flex-col h-full">
        {renderSubjectRadio()}
        <div className="overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col">
            {subjectsToRender.sort().map((subject) => (
              <div key={subject} className="mb-3" style={{width: "100%"}}>
                <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">{subject}</h3>
                {Object.keys(grouped[subject]).sort().map((topicName) => (
                  <div key={topicName} className="mb-4">
                    <strong className="text-gray-600 text-sm block mb-2">{topicName}</strong>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                       {grouped[subject][topicName].map((sub) => {
                         const isChecked = (localFilters.sub_topic || []).includes(sub.id);
                         return (
                           <Checkbox 
                             key={`sub-${sub.id}`} 
                             checked={isChecked}
                             onChange={(e) => {
                               const val = sub.id;
                               const currentList = localFilters.sub_topic || [];
                               const newList = e.target.checked 
                                 ? [...currentList, val] 
                                 : currentList.filter(v => v !== val);
                               setLocalFilters(prev => ({ ...prev, sub_topic: newList }));
                             }}
                             className="text-sm text-gray-700 hover:text-blue-600 border border-gray-200 rounded-md p-2 hover:bg-blue-50 transition-colors"
                           >
                             {sub.name}
                           </Checkbox>
                         );
                       })}
                     </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderTopicFilter = () => {
    const filtered = selectedCourseId === "ALL" ? topics : topics.filter((t) => t.course?.id === selectedCourseId);
    const grouped = groupTopicsOnlyBySubject(filtered);
    const subjectsToRender = selectedSubject === "ALL" ? Object.keys(grouped) : Object.keys(grouped).filter((s) => s === selectedSubject);

    return (
      <div className="flex flex-col h-full">
        {renderSubjectRadio()}
        <div className="overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-100">
             {subjectsToRender.sort().map((subject) => (
               <div key={subject} className="mb-3" style={{width: "100%"}}>
                 <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">{subject}</h3>
                 <div className="pl-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                   {grouped[subject].map((t) => {
                     const isChecked = (localFilters.topic || []).includes(t.id);
                     return (
                       <Checkbox 
                         key={t.id} 
                         checked={isChecked}
                         onChange={(e) => {
                           const val = t.id;
                           const currentList = localFilters.topic || [];
                           const newList = e.target.checked 
                             ? [...currentList, val] 
                             : currentList.filter(v => v !== val);
                           setLocalFilters(prev => ({ ...prev, topic: newList }));
                         }}
                         className="text-gray-700 hover:text-blue-600 border border-gray-200 rounded-md p-2 hover:bg-blue-50 transition-colors"
                       >
                         {t.name}
                       </Checkbox>
                     );
                   })}
                 </div>
               </div>
             ))}
        </div>
      </div>
    );
  };

  const getFilterPane = () => {
    switch (activeCategory) {
      case "difficulty": return renderCheckboxList("difficulty", difficultyList);
      case "question_type": return renderCheckboxList("question_type", questionTypeList);
      case "question_subtype": return renderCheckboxList("question_subtype", questionSubtypeList);
      case "test_type": return renderCheckboxList("test_type", testTypeList);
      case "srno":
        return (
          <Input
            placeholder="Search by Que. Id..."
            value={localFilters.srno || ""}
            onChange={(e) => setLocalFilters((prev) => ({ ...prev, srno: e.target.value }))}
            prefix={<SearchOutlined />}
            size="large"
            className="w-full"
          />
        );
      case "topic": return renderTopicFilter();
      case "sub_topic": return renderTopics();
      case "option_text":
        return (
          <Input
            placeholder="Search text in options..."
            value={localFilters.option_text || ""}
            onChange={(e) => setLocalFilters((prev) => ({ ...prev, option_text: e.target.value }))}
            prefix={<SearchOutlined />}
            size="large"
            className="w-full"
          />
        );
      case "is_active":
        return (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <Radio.Group
              value={localFilters.is_active?.[0] || null}
              onChange={(e) => setLocalFilters((prev) => ({ ...prev, is_active: [e.target.value] }))}
              className="w-full flex flex-col gap-3"
            >
              <Radio value="true" className="text-gray-700">Active</Radio>
              <Radio value="false" className="text-gray-700">Inactive</Radio>
            </Radio.Group>
          </div>
        );
      case "question_text":
        return (
          <Input
            placeholder="Search text in questions..."
            value={localFilters.question_text || ""}
            onChange={(e) => setLocalFilters((prev) => ({ ...prev, question_text: e.target.value }))}
            prefix={<SearchOutlined />}
            size="large"
            className="w-full"
          />
        );
      default: return null;
    }
  };

  const appliedTags = () => {
    const tags = [];
    for (const [key, values] of Object.entries(localFilters)) {
      if (Array.isArray(values)) {
        values.forEach((val) => {
          if (!val && val !== 0) return;
          let label = val;
          if (key === "difficulty") label = difficultyList.find((d) => (d.value || d) === val)?.label || val;
          else if (key === "question_type") label = questionTypeList.find((q) => (q.value || q) === val)?.label || val;
          else if (key === "question_subtype") label = questionSubtypeList.find((s) => (s.value || s) === val)?.label || val;
          else if (key === "test_type") label = testTypeList.find((t) => (t.value || t) === val)?.label || val;
          else if (key === "topic") label = topics.find((t) => t.id === val)?.name || "";
          else if (key === "sub_topic") {
            topics.forEach((t) => {
              const found = t.subtopics?.find((s) => s.id === val);
              if (found) label = found.name;
            });
          }
          if (label?.toString().trim()) tags.push({ key, value: val, label });
        });
      } else if (["option_text", "question_text", "srno"].includes(key) && typeof values === "string" && values.trim() !== "") {
         let prefix = key === "srno" ? "ID" : key === "option_text" ? "Option" : "Q";
         tags.push({ key, value: values.trim(), label: `${prefix}: "${values.trim()}"` });
      } else if (key === "is_active" && Array.isArray(values)) {
        values.forEach((val) => tags.push({ key, value: val, label: val === "true" ? "Active" : "Inactive" }));
      }
    }
    return tags;
  };

  const handleTagClose = (tag) => {
    if (Array.isArray(localFilters[tag.key])) {
      const updated = localFilters[tag.key].filter((v) => v !== tag.value);
      setLocalFilters((prev) => ({ ...prev, [tag.key]: updated }));
    } else {
      setLocalFilters((prev) => ({ ...prev, [tag.key]: "" }));
    }
  };

  const handleApply = () => {
    const cleaned = {};
    Object.entries(localFilters).forEach(([key, values]) => {
      if (["option_text", "question_text", "srno"].includes(key)) {
        if (typeof values === "string" && values.trim() !== "") cleaned[key] = values.trim();
      } else if (key === "is_active") {
        if (Array.isArray(values) && values.length > 0) cleaned[key] = values.map((v) => v === "true");
      } else {
        cleaned[key] = (values || []).filter((v) => v !== 0 && v !== null && v !== "");
      }
    });
    onApply(cleaned);
    onClose();
  };

  // --- NEW UI STRUCTURE ---
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={null} // Custom Header used below
      footer={null} // Custom Footer used below
      width={1200}
      className="p-0 rounded-xl overflow-hidden"
      bodyStyle={{ padding: 0 }}
      closeIcon={null}
    >
      <div className="flex flex-col h-[85vh] md:h-[700px] bg-white">
        
        {/* 1. Header & Applied Filters Bar (Sticky Top) */}
        <div className=" shrink-0">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-gray-800 m-0">Advanced Search {selectedCourseName ? `for ${selectedCourseName}` : ""}</h2>
             <button type="text" onClick={onClose} className="text-gray-500 hover:text-red-500 bg-transparent text-lg"><CloseOutlined /></button>
          </div>
          
          {/* Active Filters Container - Looks like a search bar */}
          <div className="min-h-[51px] max-h-[100px] overflow-y-auto bg-white border border-gray-300 rounded-md p-2 flex flex-wrap gap-2 items-center shadow-inner my-3">
            <span className="text-gray-400 text-sm select-none px-1">
               <FilterOutlined /> Filters:
            </span>
            {appliedTags().length === 0 ? (
               <span className="text-gray-400 text-sm italic">No filters selected. Select categories below to begin.</span>
            ) : (
               <>
                 {appliedTags().map((tag) => (
                    <Tag
                      key={`${tag.key}-${tag.value}`}
                      closable
                      onClose={() => handleTagClose(tag)}
                      className="flex items-center bg-blue-50 border-blue-200 text-blue-700 rounded px-2 py-1 m-0 text-sm"
                    >
                      {tag.label}
                    </Tag>
                 ))}
                 <Button 
                   type="link" 
                   size="small" 
                   danger 
                   onClick={() => setLocalFilters({})} 
                   className="text-xs ml-auto"
                 >
                   Clear All
                 </Button>
               </>
            )}
          </div>
        </div>

        {/* 2. Main Content Area (Flex Row) */}
        <div className="flex flex-1 overflow-hidden border border-gray-200 rounded-md">
          
          {/* A. Sidebar Navigation */}
          <div className="w-1/4 min-w-[180px] bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
            {keywordMap.map((item) => {
               const isActive = activeCategory === item.key;
               const hasFilters = localFilters[item.key]?.length > 0 || (typeof localFilters[item.key] === 'string' && localFilters[item.key]);
               
               return (
                <div
                  key={item.key}
                  onClick={() => setActiveCategory(item.key)}
                  className={`
                    group px-4 py-3 cursor-pointer text-sm font-medium flex justify-between items-center transition-all border-l-4
                    ${isActive 
                      ? "bg-white border-l-blue-600 text-blue-700 shadow-[0_2px_8px_-5px_rgba(0,0,0,0.1)] z-10" 
                      : "border-l-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
                  `}
                >
                  <span>{item.label}</span>
                  {hasFilters && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
                  )}
                </div>
              );
            })}
          </div>

          {/* B. Content Pane */}
          <div className="flex-1 bg-white p-4 overflow-y-auto">
             <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                   Select {keywordMap.find(k => k.key === activeCategory)?.label}
                </h3>
             </div>
             <div className="animate-fade-in">
                {getFilterPane()}
             </div>
          </div>
        </div>

        {/* 3. Footer Action Bar */}
        <div className="border-t border-gray-200 p-4 bg-white flex justify-end gap-3 shrink-0">
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
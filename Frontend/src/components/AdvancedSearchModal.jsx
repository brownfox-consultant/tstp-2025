import { Modal, Checkbox, Divider, Tag, Input, Button, Radio, Select } from "antd";
import { useEffect, useState } from "react";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";

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
}) {
  const [activeCategory, setActiveCategory] = useState("difficulty");
  const [localFilters, setLocalFilters] = useState({});
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [selectedCourse, setSelectedCourse] = useState("ALL");

  useEffect(() => {
    setLocalFilters(currentFilters || {});
  }, [currentFilters, open]);

  useEffect(() => {
    if (open) {
      setSelectedSubject("ALL");
      setSelectedCourse("ALL");
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

  const renderCourseDropdown = () => {
    const courses = getUniqueCourses(topics);
    return (
      <Select
        value={selectedCourse}
        onChange={(val) => setSelectedCourse(val)}
        className="w-full mb-4"
        placeholder="Select Course"
        size="large"
      >
        <Select.Option value="ALL">All Courses</Select.Option>
        {courses.map((c) => (
          <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
        ))}
      </Select>
    );
  };

  const renderCheckboxList = (key, options) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 h-full overflow-y-auto max-h-[400px]">
      <Checkbox.Group
        value={localFilters[key] || []}
        onChange={(vals) => setLocalFilters((prev) => ({ ...prev, [key]: vals }))}
        className="w-full"
      >
        <div className="flex flex-col gap-3">
          {options.map((opt) => {
            const label = typeof opt === "string" ? opt : opt.label;
            const value = typeof opt === "string" ? opt : opt.value;
            return (
              <Checkbox key={value} value={value} className="text-gray-700 hover:text-blue-600">
                {label}
              </Checkbox>
            );
          })}
        </div>
      </Checkbox.Group>
    </div>
  );

  const renderTopics = () => {
    const filteredTopics = selectedCourse === "ALL" ? topics : topics.filter((t) => t.course?.id === selectedCourse);
    const grouped = groupTopicsBySubject(filteredTopics);
    const subjectsToRender = selectedSubject === "ALL" ? Object.keys(grouped) : Object.keys(grouped).filter((s) => s === selectedSubject);

    return (
      <div className="flex flex-col h-full">
        {renderCourseDropdown()}
        {renderSubjectRadio()}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-100 max-h-[300px]">
          <Checkbox.Group
            value={localFilters.sub_topic || []}
            onChange={(vals) => setLocalFilters((prev) => ({ ...prev, sub_topic: vals }))}
            className="w-full"
          >
            {subjectsToRender.sort().map((subject) => (
              <div key={subject} className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">{subject}</h3>
                {Object.keys(grouped[subject]).sort().map((topicName) => (
                  <div key={topicName} className="mb-4 pl-2">
                    <strong className="text-gray-600 text-sm block mb-2">{topicName}</strong>
                    <div className="pl-3 flex flex-col gap-2">
                      {grouped[subject][topicName].map((sub) => (
                        <Checkbox key={`sub-${sub.id}`} value={sub.id} className="text-sm text-gray-500">
                          {sub.name}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </Checkbox.Group>
        </div>
      </div>
    );
  };

  const renderTopicFilter = () => {
    const filtered = selectedCourse === "ALL" ? topics : topics.filter((t) => t.course?.id === selectedCourse);
    const grouped = groupTopicsOnlyBySubject(filtered);
    const subjectsToRender = selectedSubject === "ALL" ? Object.keys(grouped) : Object.keys(grouped).filter((s) => s === selectedSubject);

    return (
      <div className="flex flex-col h-full">
        {renderCourseDropdown()}
        {renderSubjectRadio()}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-100 max-h-[300px]">
           <Checkbox.Group
            value={localFilters.topic || []}
            onChange={(vals) => setLocalFilters((prev) => ({ ...prev, topic: vals }))}
            className="w-full"
          >
            {subjectsToRender.sort().map((subject) => (
              <div key={subject} className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">{subject}</h3>
                <div className="pl-2 flex flex-col gap-2">
                  {grouped[subject].map((t) => (
                    <Checkbox key={t.id} value={t.id} className="text-gray-600">
                      {t.name}
                    </Checkbox>
                  ))}
                </div>
              </div>
            ))}
          </Checkbox.Group>
        </div>
      </div>
    );
  }

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
      } else if (typeof values === "string" && values.trim() !== "") {
          if(key === "srno") tags.push({ key, value: values.trim(), label: `ID: ${values.trim()}` });
          else if(key === "option_text") tags.push({ key, value: values.trim(), label: `Option: "${values.trim()}"` });
          else if(key === "question_text") tags.push({ key, value: values.trim(), label: `Question: "${values.trim()}"` });
      } else if (key === "is_active" && Array.isArray(values)) {
        values.forEach((val) => tags.push({ key, value: val, label: val === "true" ? "Status: Active" : "Status: Inactive" }));
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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<div className="text-lg font-bold flex items-center gap-2"><FilterOutlined /> Advanced Search</div>}
      width={900}
      className="advanced-search-modal"
      footer={
        <div className="flex justify-between items-center w-full px-2">
           <Button onClick={() => setLocalFilters({})} className="text-gray-500 hover:text-red-500">
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button onClick={onClose} className="rounded-lg">Cancel</Button>
            <Button type="primary" onClick={handleApply} className="bg-blue-600 rounded-lg px-6">
              Apply Filters
            </Button>
          </div>
        </div>
      }
      bodyStyle={{ padding: 0 }}
    >
      <div className="flex h-[470px]">
        {/* Left Column: Categories */}
        <div className="w-1/4 border-r border-gray-100 bg-gray-50/50  overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Filters</div>
          <div className="w-full h-px bg-gray-200 mb-2"></div>
          {keywordMap.map((item) => (
            <div
              key={item.key}
              onClick={() => setActiveCategory(item.key)}
              className={`
                px-3 py-2 me-2 mb-1 rounded-md cursor-pointer transition-all text-sm font-medium flex items-center justify-between
                ${activeCategory === item.key 
                  ? "bg-blue-50 text-blue-600 shadow-sm" 
                  : "text-gray-600 hover:bg-gray-100"}
              `}
            >
              {item.label}
              {activeCategory === item.key && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
            </div>
          ))}
        </div>

        {/* Middle Column: Filter Options */}
        <div className="w-1/2 px-4 overflow-y-auto">
          <div className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            {keywordMap.find(k => k.key === activeCategory)?.label}
          </div>
          {getFilterPane()}
        </div>

        {/* Right Column: Active Tags */}
        <div className="w-1/4 bg-gray-50 border-l border-gray-100 p-4 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Applied Filters</div>
          <div className="w-full h-px bg-gray-200 mb-2"></div>
          {appliedTags().length === 0 ? (
            <div className="text-gray-400 text-sm italic text-center mt-10">No filters applied</div>
          ) : (
            <div className="flex flex-col gap-2">
              {appliedTags().map((tag) => (
                <Tag
                  key={`${tag.key}-${tag.value}`}
                  closable
                  onClose={() => handleTagClose(tag)}
                  className="bg-white border-blue-100 text-blue-700 py-1 px-2 rounded-md flex items-center justify-between mx-0 shadow-sm"
                >
                  <span className="truncate max-w-[150px]">{tag.label}</span>
                </Tag>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

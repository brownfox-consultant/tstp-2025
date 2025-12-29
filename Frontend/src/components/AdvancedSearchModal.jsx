import { Modal, Checkbox, Divider, Tag, Input, Button,Radio,Select  } from "antd";
import { useEffect, useState } from "react";

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

      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = {};
      }

      if (!subjectMap[subjectName][topic.name]) {
        subjectMap[subjectName][topic.name] = [];
      }

      subjectMap[subjectName][topic.name].push(sub);
    });
  });
  

  // 🔤 Sort topics & subtopics alphabetically
  Object.keys(subjectMap).forEach((subject) => {
    Object.keys(subjectMap[subject]).forEach((topic) => {
      subjectMap[subject][topic].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });
  });

  return subjectMap;
}

function groupTopicsOnlyBySubject(topics) {
  const map = {};

  topics.forEach((t) => {
    const subjectName = t.subject?.name || "Other";

    if (!map[subjectName]) {
      map[subjectName] = [];
    }

    map[subjectName].push(t);
  });

  // sort topics alphabetically
  Object.keys(map).forEach((s) => {
    map[s].sort((a, b) => a.name.localeCompare(b.name));
  });

  return map;
}


 function getUniqueCourses(topics) {
  const map = {};
  topics.forEach((t) => {
    if (t.course?.id) {
      map[t.course.id] = t.course;
    }
  });
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
}

function mergeDuplicateTopics(topics) {
  const topicMap = {};
  topics.forEach((topic) => {
    const { name, subtopics } = topic;
    if (!topicMap[name]) {
      topicMap[name] = {
        id: topic.id,
        name,
        subtopics: [...(subtopics || [])],
      };
    } else {
      const existing = topicMap[name].subtopics;
      const uniqueSubs = (subtopics || []).filter(
        (sub) => !existing.some((e) => e.id === sub.id)
      );
      topicMap[name].subtopics = [...existing, ...uniqueSubs];
    }
  });

  const merged = Object.values(topicMap).sort((a, b) => a.name.localeCompare(b.name));
  merged.forEach((topic) => {
    topic.subtopics = (topic.subtopics || []).sort((a, b) => a.name.localeCompare(b.name));
  });

  return merged;
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
  const courseFilteredTopics =
  selectedCourse === "ALL"
    ? topics
    : topics.filter((t) => t.course?.id === selectedCourse);



  useEffect(() => {
    setLocalFilters(currentFilters || {});
  }, [currentFilters, open]);

  useEffect(() => {
  if (open) {
    setSelectedSubject("ALL");
  }
}, [open]);
useEffect(() => {
  if (open) {
    setSelectedCourse("ALL");
  }
}, [open]);


const renderSubjectRadio = () => (
  <Radio.Group
    value={selectedSubject}
    onChange={(e) => setSelectedSubject(e.target.value)}
    style={{ marginBottom: 16 }}
  >
    <Radio value="ALL">All</Radio>
    <Radio value="English">English</Radio>
    <Radio value="Math">Math</Radio>
  </Radio.Group>
);

const renderCourseDropdown = () => {
  const courses = getUniqueCourses(topics);

  return (
    <Select
      value={selectedCourse}
      onChange={(val) => setSelectedCourse(val)}
      style={{ width: "100%", marginBottom: 12 }}
      placeholder="Select Course"
    >
      <Select.Option value="ALL">All Courses</Select.Option>
      {courses.map((c) => (
        <Select.Option key={c.id} value={c.id}>
          {c.name}
        </Select.Option>
      ))}
    </Select>
  );
};



  const handleCheckboxChange = (key, value) => {
    const isSelected = localFilters[key]?.includes(value);
    const updated = isSelected
      ? localFilters[key].filter((item) => item !== value)
      : [...(localFilters[key] || []), value];
    setLocalFilters((prev) => ({ ...prev, [key]: updated }));
  };

  useEffect(() => {
  if (open) {
    const filters = { ...currentFilters };

    if (filters.is_active) {
      filters.is_active = filters.is_active.map((v) => (v ? "true" : "false"));
    }
     if (filters.question_subtype) {
      filters.question_subtype = filters.question_subtype.map(String); // ✅ ensure strings
    }

    setLocalFilters(filters);
  }
  }, [currentFilters, open]);
  
  const renderCheckboxList = (key, options) => (
    <Checkbox.Group
      value={localFilters[key] || []}
      onChange={(vals) => setLocalFilters((prev) => ({ ...prev, [key]: vals }))}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt) => {
          const label = typeof opt === "string" ? opt : opt.label;
          const value = typeof opt === "string" ? opt : opt.value;
          return (
            <Checkbox key={value} value={value}>
              {label}
            </Checkbox>
          );
        })}
      </div>
    </Checkbox.Group>
  );

 const renderTopics = () => {
  const filteredTopics =
    selectedCourse === "ALL"
      ? topics
      : topics.filter((t) => t.course?.id === selectedCourse);

  const grouped = groupTopicsBySubject(filteredTopics);

  const subjectsToRender =
    selectedSubject === "ALL"
      ? Object.keys(grouped)
      : Object.keys(grouped).filter((s) => s === selectedSubject);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {renderCourseDropdown()}
      {renderSubjectRadio()}

      {/* ✅ SINGLE Checkbox.Group */}
      <Checkbox.Group
        value={localFilters.sub_topic || []}
        onChange={(vals) =>
          setLocalFilters((prev) => ({ ...prev, sub_topic: vals }))
        }
      >
        {subjectsToRender.sort().map((subject) => (
          <div key={subject}>
            <h3 style={{ marginBottom: 12 }}>{subject}</h3>

            {Object.keys(grouped[subject]).sort().map((topicName) => (
              <div key={topicName} style={{ marginBottom: 16 }}>
                <strong>{topicName}</strong>

                <div
                  style={{
                    paddingLeft: 12,
                    marginTop: 6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {grouped[subject][topicName].map((sub) => (
                    <Checkbox
                      key={`sub-${sub.id}`}
                      value={sub.id}
                    >
                      {sub.name}
                    </Checkbox>
                  ))}
                </div>
              </div>
            ))}

            <Divider />
          </div>
        ))}
      </Checkbox.Group>
    </div>
  );
};




  const getFilterPane = () => {
    switch (activeCategory) {
      case "difficulty":
        return renderCheckboxList("difficulty", difficultyList);
      case "question_type":
        return renderCheckboxList("question_type", questionTypeList);
      case "question_subtype":  // 🔥 new
       return renderCheckboxList("question_subtype", questionSubtypeList);
        
      case "srno":
  return (
    <Input
      placeholder="Search by Que. Id..."
      value={localFilters.srno || ""}
      onChange={(e) =>
        setLocalFilters((prev) => ({ ...prev, srno: e.target.value }))
      }
      style={{ width: "100%", padding: "8px" }}
    />
  );
      case "test_type":
        return renderCheckboxList("test_type", testTypeList);
    case "topic": {
  const filtered =
    selectedCourse === "ALL"
      ? topics
      : topics.filter((t) => t.course?.id === selectedCourse);

  const grouped = groupTopicsOnlyBySubject(filtered);

  const subjectsToRender =
    selectedSubject === "ALL"
      ? Object.keys(grouped)
      : Object.keys(grouped).filter((s) => s === selectedSubject);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {renderCourseDropdown()}
      {renderSubjectRadio()}

      {subjectsToRender.sort().map((subject) => (
        <div key={subject}>
          <h3 style={{ marginBottom: 12 }}>{subject}</h3>

          <Checkbox.Group
            value={localFilters.topic || []}
            onChange={(vals) =>
              setLocalFilters((prev) => ({ ...prev, topic: vals }))
            }
          >
            <div style={{ paddingLeft: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {grouped[subject].map((t) => (
                <Checkbox key={t.id} value={t.id}>
                  {t.name}
                </Checkbox>
              ))}
            </div>
          </Checkbox.Group>

          <Divider />
        </div>
      ))}
    </div>
  );
}



      case "sub_topic":
        return renderTopics();
      case "option_text":
        return (
          <Input
            placeholder="Search text in options..."
            value={localFilters.option_text || ""}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, option_text: e.target.value }))
            }
            style={{ width: "100%", padding: "8px" }}
          />
        );
      
     case "is_active":
  return (
    <Radio.Group
      value={localFilters.is_active?.[0] || null}
      onChange={(e) =>
        setLocalFilters((prev) => ({ ...prev, is_active: [e.target.value] }))
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Radio value="true">Active</Radio>
        <Radio value="false">Inactive</Radio>
      </div>
    </Radio.Group>
  );

      case "question_text":
        return (
          <Input
            placeholder="Search text in questions..."
            value={localFilters.question_text || ""}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, question_text: e.target.value }))
            }
            style={{ width: "100%", padding: "8px" }}
          />
        );
      default:
        return null;
    }
  };

  const appliedTags = () => {
    const tags = [];

    for (const [key, values] of Object.entries(localFilters)) {
      if (Array.isArray(values)) {
        values.forEach((val) => {
          if (!val && val !== 0) return;

          let label = val;

          if (key === "difficulty") {
            label = typeof difficultyList[0] === "string"
              ? val
              : difficultyList.find((d) => (d.value || d) === val)?.label || val;
          } else if (key === "question_type") {
            label = typeof questionTypeList[0] === "string"
              ? val
              : questionTypeList.find((q) => (q.value || q) === val)?.label || val;
          }
          else if (key === "question_subtype") {
  label = typeof questionSubtypeList[0] === "string"
    ? val
    : questionSubtypeList.find((s) => (s.value || s) === val)?.label || val;
}

          else if (key === "test_type") {
            label = typeof testTypeList[0] === "string"
              ? val
              : testTypeList.find((t) => (t.value || t) === val)?.label || val;
          } else if (key === "topic") {
            label = topics.find((t) => t.id === val)?.name || "";
          } else if (key === "sub_topic") {
            topics.forEach((t) => {
              const found = t.subtopics?.find((s) => s.id === val);
              if (found) label = found.name;
            });
          }

          if (label?.toString().trim()) {
            tags.push({ key, value: val, label });
          }
        });
      } else if (key === "option_text" && typeof values === "string" && values.trim() !== "") {
        tags.push({ key, value: values.trim(), label: `Option: "${values.trim()}"` });
      } else if (key === "question_text" && typeof values === "string" && values.trim() !== "") {
        tags.push({ key, value: values.trim(), label: `Question: "${values.trim()}"` });
      }
      else if (key === "srno" && typeof values === "string" && values.trim() !== "") {
  tags.push({ key, value: values.trim(), label: `Que. Id: "${values.trim()}"` });
      }
    else if (key === "is_active" && Array.isArray(values)) {
  values.forEach((val) => {
    const label = val === "true" ? "Active" : "Inactive";
    tags.push({ key, value: val, label: `Status: ${label}` });
  });
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
      if (key === "option_text" || key === "question_text"|| key === "srno") {
        if (typeof values === "string" && values.trim() !== "") {
          cleaned[key] = values.trim();
        }
      }
     else if (key === "is_active") {
  if (Array.isArray(values) && values.length > 0) {
    cleaned[key] = values.map((v) => v === "true");
  }
}
      else {
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
      title="Advanced Search"
      width={800}
      bodyStyle={{ display: "flex", minHeight: 300, paddingTop: 16 }}
      footer={[
        <Button key="clear" onClick={() => setLocalFilters({})}>
          Clear
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Apply
        </Button>,
      ]}
    >
      {/* Left Column - Keyword Type */}
      <div style={{ width: "25%", borderRight: "1px solid #f0f0f0", paddingRight: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Select Keyword</div>
        {keywordMap.map((item) => (
          <div
            key={item.key}
            onClick={() => setActiveCategory(item.key)}
            style={{
              padding: "8px 12px",
              marginBottom: 4,
              borderRadius: 4,
              backgroundColor: activeCategory === item.key ? "#f5f5f5" : "transparent",
              cursor: "pointer",
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Middle Column - Filter Pane */}
      <div style={{ width: "45%", padding: "0 16px" }}>{getFilterPane()}</div>

      {/* Right Column - Applied Tags */}
      <div style={{ width: "30%", paddingLeft: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Applied Keywords</span>
          {appliedTags().length > 0 && (
            <Button type="link" size="small" onClick={() => setLocalFilters({})}>
              Clear All
            </Button>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {appliedTags().map((tag) => (
            <Tag
              key={`${tag.key}-${tag.value}`}
              closable
              onClose={() => handleTagClose(tag)}
              style={{
                marginBottom: 6,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
                paddingRight: 24,
              }}
              title={tag.label}
            >
              {tag.label}
            </Tag>
          ))}
        </div>
      </div>
    </Modal>
  );
}

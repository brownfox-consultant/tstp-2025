import { Modal, Checkbox, Divider, Tag, Input, Button,Radio } from "antd";
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

  useEffect(() => {
    setLocalFilters(currentFilters || {});
  }, [currentFilters, open]);

  

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
    const mergedTopics = mergeDuplicateTopics(topics);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {mergedTopics.map((topic) => (
          <div key={topic.name} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <strong>{topic.name}</strong>
            <Checkbox.Group
              value={localFilters.sub_topic || []}
              onChange={(vals) => setLocalFilters((prev) => ({ ...prev, sub_topic: vals }))}
            >
              <div style={{ paddingLeft: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {(topic.subtopics || []).map((sub) => (
                  <Checkbox key={sub.id} value={sub.id}>
                    {sub.name}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
            <Divider style={{ margin: "12px 0" }} />
          </div>
        ))}
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
      case "topic":
        return renderCheckboxList(
          "topic",
          topics.map((t) => ({ label: t.name, value: t.id }))
        );
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

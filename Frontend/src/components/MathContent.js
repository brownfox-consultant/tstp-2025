import React from "react";
import DOMPurify from "dompurify";

const MathContent = ({ cls = "", style = {}, content }) => {
  const sanitizeHtml = (htmlContent) => {
    const config = {
      ADD_TAGS: [
        "math",
        "mi",
        "mo",
        "mn",
        "ms",
        "mtext",
        "mglyph",
        "malignmark",
        "annotation",
        "semantics",
        "mrow",
      ],
      ADD_ATTR: ["encoding", "mathvariant", "stretchy", "xmlns"],
    };

    return DOMPurify.sanitize(htmlContent, config);
  };

  return (
    <div
      className={`${cls} question-table-class`}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
};

export default MathContent;

"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import katex from "katex";
import "katex/dist/katex.min.css";

if (typeof window !== "undefined") {
  window.katex = katex;
}

// Custom font size configuration
const Size = Quill.import("attributors/style/size");
Size.whitelist = ["8pt", "10pt", "12pt", "14pt", "16pt", "18pt", "24pt", "36pt", "48pt", "72pt"];
Quill.register(Size, true);

// Custom undo/redo icons
const icons = Quill.import("ui/icons");
icons["undo"] = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>`;
icons["redo"] = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>`;

// --- Editor Component ---
export default function RichTextEditor({ value, onChange }) {
  const [content, setContent] = useState(value);
  const quillRef = useRef(null);

  useEffect(() => {
    setContent(value);
  }, [value]);

  const handleChange = (html) => {
    setContent(html);
    if (onChange) {
      onChange(html);
    }
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ["undo", "redo"],
        [{ size: ["8pt", "10pt", "12pt", "14pt", "16pt", "18pt", "24pt", "36pt", "48pt", "72pt"] }],
        ["bold", "italic", "underline"],
        [{ background: ["red", "green", "blue", "orange", "violet", "yellow"] }],
        [{ align: ["", "center", "right", "justify"] }],
        ["link", "image", "formula"],
      ],
      handlers: {
        undo: function() {
          this.quill.history.undo();
        },
        redo: function() {
          this.quill.history.redo();
        },
      },
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true,
    },
  }), []);

  const formats = [
    "size",
    "bold",
    "italic",
    "underline",
    "color",
    "background",
    "script",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
    "formula",
  ];

  return (
    <div className="text-editor">
      <style jsx global>{`
        .text-editor .ql-toolbar {
          border: 1px solid #e5e7eb;
          border-radius: 8px 8px 0 0;
          background: #f9fafb;
        }
        .text-editor .ql-container {
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 8px 8px;
          min-height: 200px;
        }
        .text-editor .ql-editor {
          min-height: 180px;
        }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label::before,
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-item::before {
          content: attr(data-value) !important;
        }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="8pt"]::before { content: '8pt' !important; }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="10pt"]::before { content: '10pt' !important; }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="12pt"]::before { content: '12pt' !important; }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="14pt"]::before { content: '14pt' !important; }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="16pt"]::before { content: '16pt' !important; }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="18pt"]::before { content: '18pt' !important; }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="24pt"]::before { content: '24pt' !important; }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="36pt"]::before { content: '36pt' !important; }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="48pt"]::before { content: '48pt' !important; }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="72pt"]::before { content: '72pt' !important; }
        .text-editor .ql-snow .ql-picker.ql-size .ql-picker-label::before { content: '14pt' !important; }
        .text-editor .ql-undo svg, .text-editor .ql-redo svg {
          width: 18px;
          height: 18px;
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={content || ""}
        onChange={handleChange}
        modules={modules}
        formats={formats}
      />
    </div>
  );
}

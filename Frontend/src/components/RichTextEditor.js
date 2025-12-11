import { Editor } from "@tinymce/tinymce-react";
import { useState, useEffect, useRef } from "react";

export default function RichTextEditor({ value, onChange }) {
  const [content, setContent] = useState(value);
  const [mathFormula, setMathFormula] = useState();
  const editorRef = useRef(null);
  const editorId = useRef(`editor-${Math.random().toString(36).substr(2, 9)}`); // Unique identifier for each editor instance

  useEffect(() => {
    if (editorRef.current && !editorRef.current.getContent()) {
      editorRef.current.setContent(value);
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.insertContent(mathFormula);
    }
  }, [mathFormula]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (
        event.origin === window.location.origin &&
        event.data.type === "math-ml" &&
        event.data.editorId === editorId.current
      ) {
        setMathFormula(` <math>${event.data.value}</math> `);
        editorRef.current.windowManager.close();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <Editor
      tinymceScriptSrc="/assets/libs/tinymce/tinymce.min.js"
      onInit={(evt, editor) => {
        editorRef.current = editor;
      }}
      initialValue={content}
      init={{
        elementpath: false,
        branding: false,
        min_height: 100,
        height:300,
        menubar: false,

        // ✅ Paste settings
        paste_as_text: true,
        paste_preprocess: function (plugin, args) {
          if (args.content) {
            args.content = args.content
              .replace(/ {2,}/g, " ") // collapse multiple spaces
              .replace(/\u00a0/g, " ") // replace non-breaking spaces
              .trim(); // trim leading/trailing spaces
          }
        },

        setup: function (editor) {
          // --- Formula icon + button ---
          
        editor.ui.registry.addMenuButton("customFontSize", {
  text: "Font Size",
  fetch: function (callback) {
    const sizes = [
      "8pt", "10pt", "12pt", "14pt", "16pt",
      "18pt", "24pt", "36pt", "48pt", "72pt"
    ];

    callback(
      sizes.map((size) => ({
        type: "menuitem",
        text: size,
        onAction: () => {
          editor.execCommand("FontSize", false, size);

          // 🔥 update button label
          if (editor.customFontSizeButtonApi) {
            editor.customFontSizeButtonApi.setText(size);
          }
        },
      }))
    );
  },
  onSetup: (api) => {
    // store a reference so we can update later
    editor.customFontSizeButtonApi = api;

    // also update when cursor moves into text
    const nodeChangeHandler = () => {
      const fontSize = editor.queryCommandValue("FontSize");
      if (fontSize) {
        api.setText(fontSize);
      } else {
        api.setText("Font Size");
      }
    };

    editor.on("NodeChange", nodeChangeHandler);

    return () => {
      editor.off("NodeChange", nodeChangeHandler);
    };
  },
});


          
  editor.ui.registry.addIcon(
    "formula",
    `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000">
      <path d="M400-240v-80h62l105-120-105-120h-66l-64 344q-8 45-37 70.5T221-120q-45 0-73-24t-28-64q0-32 17-51.5t43-19.5q25 0 42.5 17t17.5 41q0 5-.5 9t-1.5 9q5-1 8.5-5.5T252-221l62-339H200v-80h129l21-114q7-38 37.5-62t72.5-24q44 0 72 26t28 65q0 30-17 49.5T500-680q-25 0-42.5-17T440-739q0-5 .5-9t1.5-9q-6 2-9 6t-5 12l-17 99h189v80h-32l52 59 52-59h-32v-80h200v80h-62L673-440l105 120h62v80H640v-80h32l-52-60-52 60h32v80H400Z" />
    </svg>`
  );

  editor.ui.registry.addButton("formula", {
    icon: "formula",
    onAction: function () {
      editor.windowManager.openUrl({
        title: "Formula Editor",
        url: `/formula?editorId=${editorId.current}`,
        width: 800,
        height: 600,
        modal: false,
      });

      // make dialog draggable
      setTimeout(() => {
        const dialogEl = document.querySelector(".tox-dialog");
        if (dialogEl) {
          dialogEl.style.cursor = "move";

          let isDragging = false;
          let startX, startY, startLeft, startTop;

          const mouseDown = (e) => {
            if (e.target.closest("input, textarea, button, select, iframe"))
              return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = dialogEl.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            document.addEventListener("mousemove", mouseMove);
            document.addEventListener("mouseup", mouseUp);
          };

          const mouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            dialogEl.style.position = "fixed";
            dialogEl.style.left = `${startLeft + dx}px`;
            dialogEl.style.top = `${startTop + dy}px`;
            dialogEl.style.margin = "0";
          };

          const mouseUp = () => {
            isDragging = false;
            document.removeEventListener("mousemove", mouseMove);
            document.removeEventListener("mouseup", mouseUp);
          };

          dialogEl.addEventListener("mousedown", mouseDown);
        }
      }, 100);
    },
  });

  // --- Focus/blur for AntD label highlight ---
  editor.on("focus", () => {
    const wrapper = editor.getContainer().closest(".ant-form-item");
    if (wrapper) wrapper.classList.add("editor-focused");
  });

  editor.on("blur", () => {
    const wrapper = editor.getContainer().closest(".ant-form-item");
    if (wrapper) wrapper.classList.remove("editor-focused");
  });
}
,

        

        plugins: ["image", "table", "advlist", "autolink", "lists", "link"],
        toolbar:
           "undo redo | formatselect customFontSize | " +
          "bold italic underline backcolor | alignleft aligncenter " +
          "alignright alignjustify | bullist numlist outdent indent | " +
          "link image table formula",
        automatic_uploads: true,
        file_picker_types: "image",
        file_picker_callback: function (cb, value, meta) {
          var input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");
          input.onchange = function () {
            var file = this.files[0];
            var reader = new FileReader();
            reader.onload = function () {
              var id = "blobid" + new Date().getTime();
              var blobCache = tinymce.activeEditor.editorUpload.blobCache;
              var base64 = reader.result.split(",")[1];
              var blobInfo = blobCache.create(id, file, base64);
              blobCache.add(blobInfo);
              cb(blobInfo.blobUri(), { title: file.name });
            };
            reader.readAsDataURL(file);
          };
          input.click();
        },
        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
//         content_style: `
//   body { font-family:Helvetica,Arial,sans-serif; font-size:14px }
//   math {
//     font-size: 1.5em; /* increase formula size */
//     display: inline-block;
//     vertical-align: middle;
//   }
//   mfrac, msup, msub, munder, mover, munderover {
//     font-size: 1.2em; /* scale sub-elements too */
//   }
// `,

        valid_elements: "*[*]",
        extended_valid_elements: "*[*]",
        custom_elements: "*[*]",
      }}
      onEditorChange={(newContent) => {
        if (onChange) {
          onChange(newContent);
        }
      }}
    />
  );
}

import React from "react";

const shortcuts = [
  { action: "Open/Close Keyboard Shortcuts", shortcut: "Alt/Option + K" },
  { action: "Show/Hide Calculator", shortcut: "Alt/Option + C" },
  {
    action: "Show/Hide Reference Sheet",
    shortcut: "Alt/Option + R",
  },
  {
    action: "Show/Hide Reference Sheet",
    shortcut: "Alt/Option + K",
  },
  {
    action: "Show/Hide Time",
    shortcut: "Alt/Option + T",
  },
  {
    action: "Open/Close Directions",
    shortcut: "Alt/Option + D",
  },
  {
    action: "Mark/Unmark for Review",
    shortcut: "Alt/Option + M",
  },
  { action: "Back", shortcut: "Alt/Option + B" },
  { action: "Next", shortcut: "Alt/Option + N" },
  { action: "Open/Close Question Menu", shortcut: "Alt/Option + O" },
  {
    action: "Select Option A",
    shortcut: "Alt/Option + 1",
  },
  {
    action: "Select Option B",
    shortcut: "Alt/Option + 2",
  },
  {
    action: "Select Option C",
    shortcut: "Alt/Option + 3",
  },
  {
    action: "Select Option D",
    shortcut: "Alt/Option + 4",
  },
  {
    action: "Option Eliminator mode",
    shortcut: "Alt/Option + E",
  },
  {
    action: "Select Option E",
    shortcut: "Alt/Option + 5",
  },
  {
    action: "Eliminate Option A",
    shortcut: "Ctrl + Alt/Option + 1",
  },
  {
    action: "Eliminate Option B",
    shortcut: "Ctrl + Alt/Option + 2",
  },
  {
    action: "Eliminate Option C",
    shortcut: "Ctrl + Alt/Option + 3",
  },
  {
    action: "Eliminate Option D",
    shortcut: "Ctrl + Alt/Option + 4",
  },
  {
    action: "Eliminate Option E",
    shortcut: "Ctrl + Alt/Option + 5",
  },
];

const ShortcutTable = () => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 bg-gray-200 text-left border-b">Action</th>
            <th className="py-2 px-4 bg-gray-200 text-left border-b">
              Shortcut
            </th>
          </tr>
        </thead>
        <tbody>
          {shortcuts.map((item, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b">{item.action}</td>
              <td className="py-2 px-4 border-b">{item.shortcut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShortcutTable;

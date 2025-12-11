import React, { useRef, useState } from "react";
import FullScreenExitIcon from "../icons/fullscreen-exit";
import FullScreenIcon from "../icons/fullscreen";
import DragIndicatorIcon from "../icons/drag-indicator";
import { Button } from "antd";
import { CloseOutlined, PaperClipOutlined } from "@ant-design/icons";
import KeyboardShortcut from "../icons/keyboard-shortcut";
import ShortcutTable from "./shortcuts-table";

const ShortcutsReference = ({ isOpen, setIsOpen }) => {
  // const [isOpen, setIsOpen] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const modalRef = useRef(null);

  const toggleModal = () => {
    setIsOpen(!isOpen);
    isOpen && setIsMouseDown(false);
  };

  const toggleWidth = () => {
    setIsWide(!isWide);
  };

  const handleDragStart = (e) => {
    setIsMouseDown(true);
    const rect = modalRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDrag = (e) => {
    if (e.clientX === 0 && e.clientY === 0) return; // Prevent drag end event issues
    if (isMouseDown) {
      modalRef.current.style.left = `${e.clientX - position.x}px`;
      modalRef.current.style.top = `${e.clientY - position.y}px`;
    }
  };

  const handleDragEnd = (e) => {
    setPosition({
      x: e.clientX - modalRef.current.offsetLeft,
      y: e.clientY - modalRef.current.offsetTop,
    });

    setIsMouseDown(false);
  };

  return (
    <div>
      <div
        onClick={toggleModal}
        className="flex flex-col gap-2 justify-center text-sm items-center cursor-pointer p-2 rounded hover:bg-black/5"
      >
        <KeyboardShortcut />
        Keyboard Shortcuts
      </div>
      {isOpen && (
        <div
          ref={modalRef}
          className={`fixed h-[40rem] z-10  top-0 left-0 p-4 bg-white shadow-lg rounded-lg overflow-y-scroll`}
          style={{ top: "10%", left: "0%", width: isWide ? "50rem" : "32rem" }}
        >
          <div className="flex justify-between items-center mb-4">
            <Button
              icon={isWide ? <FullScreenExitIcon /> : <FullScreenIcon />}
              onClick={toggleWidth}
            ></Button>
            <div
              className="px-10 cursor-move"
              onMouseEnter={() => setIsMouseDown(false)}
              onMouseDown={handleDragStart}
              onMouseMove={handleDrag}
              onMouseUp={handleDragEnd}
              onMouseLeave={() => setIsMouseDown(false)}
            >
              <div
                className={`${
                  isMouseDown && "scale-11 bg-gray-100"
                } rounded-md`}
              >
                <DragIndicatorIcon />
              </div>
            </div>
            <Button icon={<CloseOutlined />} onClick={toggleModal}></Button>
          </div>
          <h1 className="text-xl font-bold text-center mb-6">
            Keyboard Shortcuts Reference
          </h1>
          {/* <div
            className={`grid ${isWide ? "grid-cols-4" : "grid-cols-3"} gap-6`}
          ></div> */}
          <ShortcutTable />
        </div>
      )}
    </div>
  );
};

export default ShortcutsReference;

"use client";

import { getMaterialDetails } from "@/app/services/authService";
import { WarningOutlined } from "@ant-design/icons";
import { Modal, Skeleton, Watermark } from "antd";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import PDFViewer from "./PdfViewer";

function ViewMaterial() {
  const params = useParams();
  const { id, tutorialId } = params;
  const [materialData, setMaterialData] = useState({});
  const [embedUrl, setEmbedUrl] = useState();
  // const name = window.sessionStorage.getItem("name");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [overlay, setOverlay] = useState(false);

  const [keyState, setKeyState] = useState({
    cmd: false,
    shift: false,
    five: false,
  });

  function handleKeyDown(e) {
    e.preventDefault();

    if (e.key === "Meta" || e.key === "Shift" || e.key == "5") {
      if (e.key == "Meta") {
        setKeyState((prevState) => ({
          ...prevState,
          cmd: true,
        }));
      }

      if (e.key == "Shift") {
        setKeyState((prevState) => ({
          ...prevState,
          shift: true,
        }));
      }

      if (e.key == "5") {
        setKeyState((prevState) => ({
          ...prevState,
          five: true,
        }));
      }
    }
  }

  function handleKeyUp(e) {
    e.preventDefault();

    if (e.key === "Meta" || e.key === "Shift" || e.key == "5") {
      if (e.key == "Meta") {
        setKeyState((prevState) => ({
          ...prevState,
          cmd: false,
        }));
      }

      if (e.key == "Shift") {
        setKeyState((prevState) => ({
          ...prevState,
          shift: false,
        }));
      }

      if (e.key == "5") {
        setKeyState((prevState) => ({
          ...prevState,
          five: false,
        }));
      }
    }
  }

  useEffect(() => {
    setName(window.localStorage.getItem("name"));
    setEmail(window.localStorage.getItem("email"));
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (keyState.cmd && keyState.shift && keyState.five) {
      setOverlay(true);
    }
  }, [keyState]);

  useEffect(() => {
    getMaterialDetails(tutorialId).then((res) => {
      setMaterialData(res.data);
      console.log("res.data",res.data)
      if (res.data?.material_url?.includes("youtube.com/watch?v=")) {
        const videoId = res.data.material_url.split("v=")[1];
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        setEmbedUrl(embedUrl);
      }
    });
  }, []);

  return (
    <div className="mt-2" onContextMenu={(e) => e.preventDefault()}>
      <Skeleton loading={Object.keys(materialData).length == 0}>
        {materialData.material_type == "VIDEO" && (
          <div className="text-2xl font-semibold mb-2">{materialData.name}</div>
        )}
        {overlay ? (
          <Modal
            centered
            open={true}
            width={2000}
            closable={false}
            footer={false}
          >
            <div className="text-5xl">
              <WarningOutlined twoToneColor="#eb2f96" /> Screen Capture Not
              Allowed. Reload the Page to Continue.
            </div>
          </Modal>
        ) : (
          <Watermark
            gap={[250, 250]}
            content={`The Smart Test Prep: ${name}, ${email}, ID: ${id}`}
          >
            {materialData.material_type == "PDF" && (
              <PDFViewer
                file={materialData.material_url}
                title={materialData.name}
              />
            )}
            {materialData.material_type == "VIDEO" &&
              (embedUrl ? (
                <iframe
                  className="w-full"
                  width="560"
                  height="630"
                  src={embedUrl}
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                  allowfullscreen
                ></iframe>
              ) : (
                <video controls width="100%" src={materialData.material_url}>
                  Your browser does not support the video tag.
                </video>
              ))}
            {materialData.material_type == "IMAGE" && (
              <iframe
                className="w-full"
                width="560"
                height="630"
                src={materialData.material_url}
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                allowfullscreen
              ></iframe>
            )}
          </Watermark>
        )}
      </Skeleton>
    </div>
  );
}

export default ViewMaterial;

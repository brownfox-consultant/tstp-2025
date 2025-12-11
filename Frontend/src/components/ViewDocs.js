"use client";
import { SpecialZoomLevel, Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

export default function ViewDocs({ pdfUrl }) {
  const transform = (slot) => ({
    ...slot,
    Open: () => <></>,
    Download: () => <></>,
    DownloadMenuItem: () => <></>,
    SwitchTheme: () => <></>,
    SwitchThemeMenuItem: () => <></>,
  });

  const renderToolbar = (
    // eslint-disable-next-line no-unused-vars
    Toolbar
  ) => <Toolbar>{renderDefaultToolbar(transform)}</Toolbar>;

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    // eslint-disable-next-line no-unused-vars
    sidebarTabs: (defaultTabs) => [],
    renderToolbar,
  });

  const { renderDefaultToolbar } =
    defaultLayoutPluginInstance.toolbarPluginInstance;

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.7.107/build/pdf.worker.js">
      <Viewer
        fileUrl={pdfUrl}
        plugins={[defaultLayoutPluginInstance]}
        defaultScale={SpecialZoomLevel.PageWidth}
      />
    </Worker>
  );
}

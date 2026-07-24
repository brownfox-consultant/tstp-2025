"use client";

import React from "react";
import { Modal } from "antd";
import { DisconnectOutlined, LoadingOutlined } from "@ant-design/icons";
import useNetworkStatus from "@/utils/useNetworkStatus";

export default function NetworkOfflineModal() {
  const isOnline = useNetworkStatus();

  return (
    <Modal
      open={!isOnline}
      closable={false}
      keyboard={false}
      maskClosable={false}
      footer={null}
      centered
      zIndex={99999}
    >
      <div className="flex flex-col justify-center items-center gap-4 py-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-3xl animate-pulse">
          <DisconnectOutlined />
        </div>

        <h3 className="text-xl font-bold text-gray-800 m-0">
          Internet Connection Lost
        </h3>

        <p className="text-sm text-gray-600 max-w-sm m-0">
          Your internet connection has been lost. Please check your connection and try again.
        </p>

        <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium">
          <LoadingOutlined spin style={{ fontSize: "16px" }} />
          <span>Reconnecting... The test will automatically resume once the connection is restored.</span>
        </div>
      </div>
    </Modal>
  );
}


"use client";

import { verifyOtp } from "@/app/services/registerStudent";
import { Modal, message } from "antd";
import React, { useState } from "react";
import OtpInput from "react-otp-input";

function OtpModal({
  open,
  setOpen,
  extraPayload = {},
  afterSuccess = () => {},
  email = "",
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      message.warning("Please enter the complete 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...extraPayload,
        otp,
      };

      await verifyOtp(payload);

      setOtp("");
      afterSuccess();
    } catch (error) {
      console.error("OTP verification failed:", error);

      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setOtp("");
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title="Enter OTP"
      okText="Verify"
      cancelText="Cancel"
      onOk={handleVerify}
      confirmLoading={loading}
      okButtonProps={{
        disabled: otp.length !== 6,
      }}
      closable={!loading}
      maskClosable={!loading}
      keyboard={!loading}
      destroyOnHidden
    >
      <p className="mb-4">
        Please enter the 6-digit OTP sent to your email{" "}
        {email ? <strong>({email})</strong> : null}
      </p>

      <div className="flex justify-center">
        <OtpInput
          value={otp}
          onChange={setOtp}
          numInputs={6}
          shouldAutoFocus
          inputType="tel"
          renderInput={(props) => (
            <input
              {...props}
              style={{
                width: "2.5rem",
                height: "2.75rem",
                margin: "0 0.3rem",
                fontSize: "1.25rem",
                textAlign: "center",
                borderRadius: "6px",
                border: "1px solid #d9d9d9",
                outline: "none",
              }}
            />
          )}
        />
      </div>
    </Modal>
  );
}

export default OtpModal;

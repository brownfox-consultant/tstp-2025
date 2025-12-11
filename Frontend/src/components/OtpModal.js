"use client";

import { verifyOtp } from "@/app/services/registerStudent";
import { Input, InputNumber, Modal } from "antd";
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

  const handleChange = (otp) => setOtp(otp);

  const handleVerify = () => {
    setLoading(true);
    let payload = {
      ...extraPayload,
      otp: otp,
    };

    verifyOtp(payload)
      .then((res) => {
        afterSuccess();
      })
      .finally(() => setLoading(false));
  };

  // const renderInput = (inputProps, index, inputRef) => {
  //   return (
  //     <input
  //       key={index}
  //       {...inputProps}
  //       ref={inputRef}
  //       style={{
  //         width: "3rem",
  //         height: "3rem",
  //         margin: "0 0.5rem",
  //         fontSize: "2.5rem",
  //         borderRadius: "4px",
  //         border: "1px solid rgba(0,0,0,0.3)",
  //       }}
  //     />
  //   );
  // };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title="Enter OTP"
      okText="Verify"
      onOk={handleVerify}
      okButtonProps={{ loading: loading }}
    >
      <p>
        Please enter the 6-digit OTP sent to your email{" "}
        {email ? <>({email})</> : ""}
      </p>
      <OtpInput
        value={otp}
        onChange={setOtp}
        numInputs={6}
        renderInput={(props) => (
          <input
            {...props}
            style={{
              width: "1.75rem",
              height: "2rem",
              margin: "0.5rem",
              fontSize: "1.75rem",
              borderRadius: "4px",
              border: "1px solid rgba(0,0,0,0.3)",
              paddingLeft: "0.25rem",
            }}
          />
        )}
      />
    </Modal>
  );
}

export default OtpModal;

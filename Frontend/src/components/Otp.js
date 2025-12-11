import OtpInput from "react-otp-input";

const Otp = ({ value, onChange, className, autofocus = true }) => {
  return (
    <OtpInput
      onChange={onChange}
      value={value}
      numInputs={6}
      // shouldAutoFocus={autofocus}
      // containerStyle={`otp-input-wrapper ${className}`}
      inputStyle="otp-input"
    />
  );
};

export default Otp;

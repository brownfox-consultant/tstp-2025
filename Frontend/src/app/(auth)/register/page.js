"use client";

import RegisterForm from "@/components/RegisterForm";
import logo from "../../../../public/logo_with_tagline.png";
import Image from "next/image";

// Custom SVG Icons - Learning focused
const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 7H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 11H14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="12" width="4" height="9" rx="1" fill="white"/>
    <rect x="10" y="8" width="4" height="13" rx="1" fill="white"/>
    <rect x="17" y="4" width="4" height="17" rx="1" fill="white"/>
    <circle cx="5" cy="9" r="2" fill="white"/>
    <circle cx="12" cy="5" r="2" fill="white"/>
    <circle cx="19" cy="2" r="2" fill="white"/>
    <path d="M5 9L12 5L19 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TrophyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 21H16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 4H17V9C17 11.7614 14.7614 14 12 14C9.23858 14 7 11.7614 7 9V4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 6H19C20.1046 6 21 6.89543 21 8C21 9.10457 20.1046 10 19 10H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 6H5C3.89543 6 3 6.89543 3 8C3 9.10457 3.89543 10 5 10H7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 4V2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function RegisterPage() {
  return (
    <>
      <style jsx global>{`
        .register-form .ant-form-item-label > label {
          font-weight: 600;
          color: #374151;
        }
        
        .register-form .ant-input {
          border: none !important;
          border-bottom: 2px solid #e5e7eb !important;
          border-radius: 0 !important;
          // padding: 10px 0 !important;
          background: transparent !important;
        }
        
        .register-form .ant-select-selector {
          border: none !important;
          border-bottom: 2px solid #e5e7eb !important;
          border-radius: 0 !important;
          padding: 6px 0 !important;
          background: transparent !important;
        }
        
        .register-form .ant-input:focus,
        .register-form .ant-input:hover,
        .register-form .ant-select-focused .ant-select-selector,
        .register-form .ant-select-selector:hover {
          border-bottom-color: #f97316 !important;
          box-shadow: none !important;
        }
        
        .register-form .ant-btn-primary {
          height: 48px;
          border-radius: 12px;
          font-weight: 700;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border: none;
          width: 100%;
          box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35);
        }
        
        .register-form .ant-btn-primary:hover {
          transform: translateY(-2px);
        }
        
        .register-form .ant-btn-primary:disabled {
          background: #e5e7eb;
          box-shadow: none;
        }
      `}</style>

      <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        
        {/* Left Side - Branding */}
        <div className="flex-1 flex flex-col items-center justify-center p-10 relative overflow-hidden">
          
          {/* Decorative Circles */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full border-2 border-orange-200 opacity-50" />
          <div className="absolute bottom-24 right-12 w-36 h-36 rounded-full border-2 border-orange-300 opacity-40" />
          
          {/* Logo */}
          <div className="relative z-10 w-full max-w-md px-5">
            <Image alt="logo" src={logo} className="w-full h-auto" priority />
          </div>
          
          {/* Tagline */}
          <div className="relative z-10 mt-8 text-center px-5">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-3">
              Start Your Learning Journey
            </h2>
            <p className="text-gray-600 max-w-md leading-relaxed">
              Join thousands of students preparing for success with our comprehensive test preparation platform.
            </p>
          </div>
          
          {/* Features */}
          <div className="relative z-10 flex flex-wrap justify-center gap-6 mt-10 px-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                <BookIcon />
              </div>
              <span className="font-semibold text-gray-700">Expert Content</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                <ChartIcon />
              </div>
              <span className="font-semibold text-gray-700">Track Progress</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                <TrophyIcon />
              </div>
              <span className="font-semibold text-gray-700">Achieve Goals</span>
            </div>
          </div>
        </div>
        
        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 lg:p-10 relative overflow-hidden">
            
            {/* Top Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400" />
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Create Account</h1>
              <p className="text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-orange-500 font-semibold hover:text-orange-600 hover:underline">
                  Sign in
                </a>
              </p>
            </div>
            
            {/* Form */}
            <RegisterForm />
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;

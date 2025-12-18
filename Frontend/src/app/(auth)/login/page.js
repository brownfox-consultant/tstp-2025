"use client";

import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import LoginForm from "@/components/LoginForm";
import { LeftOutlined } from "@ant-design/icons";
import { Carousel } from "antd";
import { useRef } from "react";
import logo from "../../../../public/logo_with_tagline.png";
import Image from "next/image";
import Link from "next/link";
import BookIcon from "@/components/icons/book-icon";
import ChartIcon from "@/components/icons/chart-icon";
import TrophyIcon from "@/components/icons/trophy-icon";

function LoginPage() {
  const carouselRef = useRef();

  function handleNext() {
    carouselRef.current.next();
  }

  function handlePrev() {
    carouselRef.current.prev();
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 min-w-[100vw]">
      
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
            Welcome Back!
          </h2>
          <p className="text-gray-600 max-w-md leading-relaxed">
            Sign in to continue your learning journey and track your progress.
          </p>
        </div>
        
        {/* Features */}
        <div className="relative z-10 flex flex-wrap justify-center gap-6 mt-10 px-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
              <BookIcon />
            </div>
            <span className="font-semibold text-gray-700">Expert Learning</span>
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
          
          {/* Carousel for Login/Forgot Password */}
          <Carousel dots={false} ref={carouselRef}>
            {/* Login Form */}
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Sign In</h1>
                <p className="text-gray-600">
                  New User?{" "}
                  <Link href="/register" className="text-orange-500 font-semibold hover:text-orange-600 hover:underline">
                    Create Account
                  </Link>
                </p>
              </div>
              <LoginForm handleNext={handleNext} />
            </div>
            
            {/* Forgot Password Form */}
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={handlePrev}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <LeftOutlined className="text-gray-600" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-gray-800">Forgot Password</h1>
                </div>
                <p className="text-gray-600 ml-11 mt-2">
                  Enter your email to reset password
                </p>
              </div>
              <ForgotPasswordForm />
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

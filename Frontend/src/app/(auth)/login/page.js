"use client";

import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import LoginForm from "@/components/LoginForm";
import { useState } from "react";
import logo from "../../../../public/logo_with_tagline.png";
import Image from "next/image";
import Link from "next/link";
import BookIcon from "@/components/icons/book-icon";
import ChartIcon from "@/components/icons/chart-icon";
import TrophyIcon from "@/components/icons/trophy-icon";

function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  function handleNavigateToForgot() {
    setShowForgotPassword(true);
  }

  function handleNavigateToLogin() {
    setShowForgotPassword(false);
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 overflow-x-hidden">

      <div className="w-full lg:w-1/2  lg:flex-1 flex flex-col items-center justify-center lg:h-screen p-4 lg:p-12 relative">
   
        <div className="hidden md:block absolute -top-12 -left-12 w-48 h-48 rounded-full border-2 border-orange-200 opacity-50" />
        <div className="hidden md:block absolute bottom-24 right-12 w-36 h-36 rounded-full border-2 border-orange-300 opacity-40" />
 
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
           
            <div className="w-40 lg:w-full lg:max-w-lg mb-4 lg:mb-8">
              <Image alt="logo" src={logo} className="w-full h-auto" priority />
            </div>
            
            <h2 className="text-xl lg:text-4xl font-bold text-gray-800 mb-2 lg:mb-4">
              Welcome Back!
            </h2>

            <p className="text-sm lg:text-lg text-gray-600 leading-relaxed mb-4 lg:mb-6">
              Sign in to continue your learning journey and track your progress.
            </p>
            
            <div className="flex flex-row flex-wrap justify-center items-center gap-3 lg:gap-4">
              <FeatureItem icon={<BookIcon />} text="Expert Learning" />
              <FeatureItem icon={<ChartIcon />} text="Track Progress" />
              <FeatureItem icon={<TrophyIcon />} text="Achieve Goals" />
            </div>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 lg:flex-1 flex items-center justify-center p-4 lg:p-12 lg:h-screen">
        
      <div className="w-full max-w-md lg:max-w-lg bg-white rounded-lg lg:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400" />
          
          {!showForgotPassword ? (
            // VIEW 1: LOGIN
            <div className="animate-fade-in">
              <div className="mb-4 lg:mb-6">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-800 mb-2">Sign In</h1>
                <p className="text-sm text-gray-600">
                  New User?{" "}
                  <Link href="/register" className="text-orange-500 font-semibold hover:text-orange-600 hover:underline">
                    Create Account
                  </Link>
                </p>
              </div>
              <LoginForm handleNext={handleNavigateToForgot} />
            </div>
          ) : (
            // VIEW 2: FORGOT PASSWORD
            <div className="animate-fade-in">
              <div className="mb-4 lg:mb-6">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-800">Forgot Password</h1>
                <p className="text-sm text-gray-600 mt-2">
                  Enter your email to reset password
                </p>
              </div>
              
              <ForgotPasswordForm />
              
              <div className="mt-3 lg:mt-4 flex">
                <p className="text-sm text-gray-600">
                  Remember your password?{" "}
                  <button 
                    onClick={handleNavigateToLogin} 
                    className="text-orange-500 font-semibold hover:text-orange-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg text-white flex-shrink-0">
        <div className="scale-75 lg:scale-90">
           {icon}
        </div>
      </div>
      <span className="text-xs lg:text-sm font-semibold text-gray-700 whitespace-nowrap">{text}</span>
    </div>
  );
}

export default LoginPage;
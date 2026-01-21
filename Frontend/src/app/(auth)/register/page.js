"use client";

import RegisterForm from "@/components/RegisterForm";
import logo from "../../../../public/logo_with_tagline.png";
import Image from "next/image";
import Link from "next/link";
import BookIcon from "@/components/icons/book-icon";
import ChartIcon from "@/components/icons/chart-icon";
import TrophyIcon from "@/components/icons/trophy-icon";

function RegisterPage() {
  return (
    // ROOT CONTAINER
    // 1. flex-col for mobile, lg:flex-row for desktop
    // 2. items-center justify-center to handle vertical alignment on all screens
    <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 overflow-x-hidden p-4 lg:p-0">
      
      {/* LEFT SIDE - BRANDING 
          - Mobile: w-full, auto height
          - Desktop: w-1/2, full height (lg:h-screen)
      */}
      <div className="w-full lg:w-1/2 lg:flex-1 flex flex-col items-center justify-center lg:h-screen p-4 lg:p-12 relative">
        
        {/* Decorative Circles - Hidden on small mobile to save space */}
        <div className="hidden md:block absolute -top-12 -left-12 w-48 h-48 rounded-full border-2 border-orange-200 opacity-50 pointer-events-none" />
        <div className="hidden md:block absolute bottom-24 right-12 w-36 h-36 rounded-full border-2 border-orange-300 opacity-40 pointer-events-none" />
        
        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
            
            {/* Logo */}
            <div className="w-40 lg:w-full lg:max-w-md mb-4 lg:mb-8">
              <Image alt="logo" src={logo} className="w-full h-auto" priority />
            </div>
            
            {/* Tagline */}
            <h2 className="text-xl lg:text-4xl font-bold text-gray-800 mb-2 lg:mb-4">
              Start Your Journey
            </h2>
            <p className="text-sm lg:text-lg text-gray-600 leading-relaxed mb-6 lg:mb-8">
              Join thousands of students preparing for success with our comprehensive test preparation platform.
            </p>
            
            {/* Features */}
            <div className="flex flex-row flex-wrap justify-center items-center gap-3 lg:gap-4">
              <FeatureItem icon={<BookIcon />} text="Expert Content" />
              <FeatureItem icon={<ChartIcon />} text="Track Progress" />
              <FeatureItem icon={<TrophyIcon />} text="Achieve Goals" />
            </div>
        </div>
      </div>
      
      {/* RIGHT SIDE - FORM 
          - Mobile: w-full
          - Desktop: w-1/2, full height, centered
      */}
      <div className="w-full lg:w-1/2 lg:flex-1 flex items-center justify-center p-2 sm:p-4 lg:p-12 lg:h-screen">
        
        {/* Card Container 
            - max-w-xl on mobile (wider than before)
            - lg:max-w-2xl on desktop (gives the form much more room)
        */}
        <div className="w-full max-w-xl lg:max-w-2xl bg-white rounded-lg lg:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 relative overflow-hidden">
          
          {/* Top Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400" />
          
          <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-4 lg:mb-6">
              <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-800 mb-2">Create Account</h1>
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
            
            {/* Form Component */}
            <RegisterForm />
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper Component for consistent responsive styling
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

export default RegisterPage;
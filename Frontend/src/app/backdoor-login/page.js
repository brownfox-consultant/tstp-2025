"use client";

import BackdoorLoginForm from "@/components/BackdoorLoginForm";
import { useState } from "react";
import logo from "../../../public/logo_with_tagline.png";
import Image from "next/image";
import Link from "next/link";
import BookIcon from "@/components/icons/book-icon";
import ChartIcon from "@/components/icons/chart-icon";
import TrophyIcon from "@/components/icons/trophy-icon";

function BackdoorLoginPage() {

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
              Backdoor Login Access
            </h2>

            <p className="text-sm lg:text-lg text-gray-600 leading-relaxed mb-4 lg:mb-6">
              Special access portal for authorized personnel only.
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
          
          <div className="animate-fade-in">
            <div className="mb-4 lg:mb-6">
              <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-800 mb-2">Backdoor Sign In</h1>
              <p className="text-sm text-gray-600">
                Authorized access only
              </p>
            </div>
            <BackdoorLoginForm />
          </div>
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

export default BackdoorLoginPage;

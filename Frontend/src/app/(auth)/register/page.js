"use client";

import RegisterForm from "@/components/RegisterForm";
import { Card, Col, Divider, Row } from "antd";
import logo from "../../../../public/logo_with_tagline.png";
import Image from "next/image";

function page() {
  return (
    // <div className="w-screen flex">
    //   <div class="logo-placeholder text-4xl font-bold flex justify-center">
    //     <div className="m-10">Logo</div>
    //   </div>
    //   <Divider type="vertical" />
    //   <Card
    //     // style={{ background: "white" }}
    //     className="w-1/3 border-r-4 left-1/2"
    //   >
    //     <div className="text-2xl font-bold mb-3">Sign Up</div>

    //     <div className="mb-10">
    //       Existing User? <a href="/login">Sign in</a>
    //     </div>
    //     <RegisterForm className="" />
    //   </Card>
    // </div>
    <Row className="w-screen flex">
      <Col sm={24} lg={12} className="logo-placeholder p-5 relative">
        <div className="md:ml-10 mt-40">
          <Image alt="logo" style={{ width: "690px" }} src={logo}></Image>
        </div>
      </Col>
      <Col sm={24} lg={12} className="p-5 md:ml-28 lg:ml-0">
        <Card hoverable className="sm:w-full md:w-2/3 border-r-4 ">
          <div className="text-2xl font-bold mb-3">Sign Up</div>

          <div className="mb-10">
            Existing User? <a href="/login">Sign in</a>
          </div>
          <RegisterForm className="" />
        </Card>
      </Col>
    </Row>
  );
}

export default page;

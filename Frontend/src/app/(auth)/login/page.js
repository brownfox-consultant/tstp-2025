"use client";

import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import LoginForm from "@/components/LoginForm";
import { LeftOutlined } from "@ant-design/icons";
import { Card, Carousel, Col, Row } from "antd";
import { useRef } from "react";
import logo from "../../../../public/logo_with_tagline.png";
import Image from "next/image";

function Page() {
  const carouselRef = useRef();

  function handleNext() {
    carouselRef.current.next();
  }

  function handlePrev() {
    carouselRef.current.prev();
  }
  return (
    <Row className="w-screen flex">
      <Col
        xs={24}
        sm={24}
        md={24}
        lg={12}
        className="logo-placeholder p-5 relative"
        // style={{ display: "flex" }}
      >
        <div className="md:ml-10 md:mt-20">
          <Image alt="logo" style={{ width: "690px" }} src={logo}></Image>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={12} className="p-5 md:ml-28 lg:ml-0">
        <Card className="md:w-2/3 border-r-4">
          <Carousel dots={false} ref={carouselRef}>
            <div>
              <div className="text-2xl font-bold mb-3">Sign In</div>
              <div className="mb-10">
                New User? <a href="/register">Create Account</a>
              </div>

              <LoginForm handleNext={handleNext} className="" />
            </div>
            <div>
              <div className="text-2xl font-bold mb-10 flex items-center gap-2">
                <LeftOutlined className="text-base" onClick={handlePrev} />{" "}
                Forgot Password
              </div>
              <ForgotPasswordForm />
            </div>
          </Carousel>
        </Card>
      </Col>
    </Row>
  );
}

export default Page;

import LoginForm from "@/components/LoginForm";
import ResetPwdForm from "@/components/ResetPwdForm";
import { Card, Col, Divider, Row } from "antd";
import logo from "../../../../public/logo_with_tagline.png";
import Image from "next/image";

function Page() {
  return (
    <Row className="w-screen flex">
      <Col sm={24} lg={12} className="logo-placeholder p-5 relative">
        <div className="lg:ml-10 mt-20">
          <Image alt="logo" style={{ width: "690px" }} src={logo}></Image>
        </div>
      </Col>
      <Col sm={24} lg={12} className="p-5 sm:ml md:ml-32 lg:ml-0">
        <Card className="sm:w-3/4 md:w-2/3 absolute top-0 border-r-4">
          <div className="text-2xl font-bold mb-3">Reset Password</div>

          <ResetPwdForm className="" />
        </Card>
      </Col>
    </Row>
  );
}

export default Page;

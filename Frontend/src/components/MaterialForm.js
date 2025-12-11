import { getSubjectTopics, uploadMaterial } from "@/app/services/authService";
import { getCoursesInsideAuth } from "@/app/services/courseService";
import { CloudUploadOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Card,
  Select,
  Upload,
  message,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import CustomSelect from "./CustomSelect";
import { updateMaterial } from "@/app/services/authService";


function MaterialForm({ course_subject, onClose,material  }) {
  const [form] = useForm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fileList, setFileList] = useState("");
  const [urlInput, setUrlInput] = useState();
  const [materialType, setMaterialType] = useState("PDF");
  const [uploadFormat, setUploadFormat] = useState("URL");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(course_subject);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [selectedCourseSubject, setSelectedCourseSubject] = useState();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState();
  const [selectedSubTopic, setSelectedSubTopic] = useState();
  const [topicOptions, setTopicOptions] = useState();
  const [subTopicOptions, setSubTopicOptions] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState("select_existing");
  const [selectedSubTopicOption, setSelectedSubTopicOption] =
    useState("select_existing");
  const [selectedAccessTypeOption, setSelectedAccessTypeOption] =
    useState("PAID");

  const props = {
    name: "file",
    accept: "application/pdf",
    listType: "picture-card",
    showPreviewIcon: false,
    multiple: false,
    maxCount: 1,
    accept:
      form.getFieldValue("material_type") == "PDF"
        ? "application/pdf"
        : form.getFieldValue("material_type") == "IMAGE"
        ? "application/image"
        : "video/mp4",
    status: "done",
    beforeUpload: (file) => {
      const isLt25M = file.size / 1024 / 1024 < 30;
      if (!isLt25M) {
        message.error("File must be smaller than 30MB!");
        return Upload.LIST_IGNORE;
      }

      return false;
    },
    // action: 'https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188',
    onChange(info) {
      form.setFieldsValue({
        file: info.fileList.length == 0 ? null : info.fileList[0],
      });
      setFileList(info.fileList);
    },
  };

  const onFieldsChange = (_, allFields) => {
    const isFormValid = allFields
      .filter((field) => field.name[0] != "sub_topic")
      .every((field) => {
        if (!field.value || field.errors.length > 0) {
          return false;
        }
        if (field.name[0] == "file" && field.value.fileList.length == 0) {
          return false;
        }
        return true;
      });
    setIsSubmitDisabled(!isFormValid);
  };

  const uploadButton = (
    <div>
      <CloudUploadOutlined />
      <div
        style={{
          marginTop: 8,
        }}
      >
        Upload
      </div>
    </div>
  );

  useEffect(() => {
  if (material) {
    form.setFieldsValue({
      name: material.name,
      material_type: material.material_type,
      access_type: material.access_type,
      topic: material.topic,
      sub_topic: material.sub_topic,
      course_subject: material.course_subject,
      url: material.url || "",
    });
    setSelectedCourseSubject(material.course_subject);
    setSelectedAccessTypeOption(material.access_type);
    setMaterialType(material.material_type);
    setUploadFormat(material.url ? "URL" : "FILE");
    setUrlInput(material.url || "");
  }
}, [material]);

  useEffect(() => {
  getCoursesInsideAuth()
    .then((res) => {
      const courseList = res.data;
      setCourses(courseList);

      // Set the first course as default selected
      if (courseList.length > 0) {
        setSelectedCourse(courseList[0].name);
      }
    })
    .catch((err) => console.log(err));
  }, []);
  
  


  useEffect(() => {
    if (courses && courses.length > 0) {
      setSubjectOptions(
        courses
          .find((course) => course.name == selectedCourse)
          ?.subjects.map((subject) => {
            return {
              value: subject.course_subject_id,
              label: subject.name,
            };
          })
      );
      setSelectedCourseSubject();
      setSelectedTopic();
      form.setFieldValue("course_subject", null);
    }
  }, [courses, selectedCourse]);

  useEffect(() => {
    if (selectedCourseSubject) {
      getSubjectTopics(selectedCourseSubject).then((res) => {
        setTopicOptions(
          res.data.map((option) => {
            return { ...option, label: option.name };
          })
        );
      });
      console.log("topicOptions", topicOptions);
      setSelectedTopic();
      form.setFieldValue("topic", null);
      form.setFieldValue("sub_topic", null);
    }
  }, [selectedCourseSubject]);

  const handleFinish = async (values) => {
  setSubmitLoading(true);

  const payload = new FormData();
  payload.append("name", values.name);
  payload.append("material_type", values.material_type);
  payload.append("access_type", values.access_type);
  payload.append("course_subject", values.course_subject);
  payload.append("topic", values.topic);
  payload.append("sub_topic", values.sub_topic);

  if (fileList.length !== 0) {
    payload.append("file", fileList[0].originFileObj);
  } else {
    payload.append("url", values.url);
  }

  try {
    if (material?.id) {
      // UPDATE mode
      await updateMaterial(material.id, payload);
      window.location.reload()
      message.success("Tutorial updated successfully.");
      
    } else {
      // CREATE mode
      await uploadMaterial(payload);
      window.location.reload()
      message.success("Tutorial uploaded successfully.");
    }

    onClose(); // Close modal
  } catch (error) {
    console.error("Submission failed", error);
    message.error("Failed to save tutorial.");
  } finally {
    setSubmitLoading(false);
  }
};


  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };
  const handleSubTopicOptionChange = (e) => {
    setSelectedSubTopicOption(e.target.value);
  };

  return (
    <div className=" w-full">
      <div className="text-xl font-semibold mb-3 flex align-middle">
        Upload Tutorial
      </div>
      <Form form={form} onFinish={handleFinish} onFieldsChange={onFieldsChange}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <h2 className="text-base font-semibold mt-4">Tutorial name</h2>
          </Col>
          <Col span={12}>
            <Form.Item name="name">
              <Input placeholder="Tutorial Name" className="mb-2" />
              </Form.Item>
          </Col>
        </Row>
        <Card
          className="text-lg bg-gray-50 mt-2"
          bodyStyle={{ paddingTop: "10px" }}
        >
          <Row>
            <h2 className="text-base font-semibold pb-2">Course Details</h2>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Row>
                <label
                  style={{
                    display: "block",
                    width: "100%",
                    marginBottom: "4px",
                  }}
                >
                  Select course
                </label>
                <Form.Item style={{width:"100%"}}>
                <Select
                  onChange={(v) => setSelectedCourse(v)}
                  value={selectedCourse}
                  placeholder="Select Course"
                  options={courses?.map((course) => {
                    return { value: course.name, label: course.name };
                  })}
                  style={{ width: "90%" }}
                ></Select></Form.Item>
              </Row>
              <Row>
                <Form.Item
                  label="Topic"
                  required
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                  style={{ marginBottom: 0 }}
                >
                  <Radio.Group
                    onChange={handleOptionChange}
                    value={selectedOption}
                    className="flex justify-between w-full mb-2"
                  >
                    <div
                      className={`flex-1 border border-gray-300 rounded-md p-2 ${
                        selectedOption === "select_existing"
                          ? "bg-orange-50 border-orange-300"
                          : ""
                      } mr-2`}
                    >
                      <Radio
                        value="select_existing"
                        className={`w-full text-center ${
                          selectedOption == "select_existing"
                            ? "text-orange-500"
                            : ""
                        }`
                      }
                      style={{
                        
                        marginRight:"20px"
                        
                      }}  
                      >
                        Select from existing

                      </Radio>
                    </div>
                    <div
                      className={`flex-1 border border-gray-300 rounded-md p-2 ${
                        selectedOption === "add_new"
                          ? "bg-orange-50 text-orange-500 border-orange-300"
                          : ""
                      }`}
                    >
                      <Radio
                        value="add_new"
                        className={`w-full text-center ${
                          selectedOption == "add_new" ? "text-orange-500" : ""
                        }`}

                      >
                        Add new
                      </Radio>
                    </div>
                  </Radio.Group>
                </Form.Item>
              </Row>
              <Row>
                {selectedOption === "select_existing" ? (
                  <Form.Item name="topic" style={{width:"100%"}}>
                  <Select
                    value={selectedTopic}
                    onChange={(value) => {
                      setSelectedTopic(value);
                      setSubTopicOptions(
                        topicOptions?.find(
                          (topicOption) => topicOption.name == value
                        )?.subtopics
                      );
                    }}
                    placeholder="Select Topic"
                    options={topicOptions?.map((topicOption) => ({
                      value: topicOption.name,
                      label: topicOption.name,
                    }))}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    style={{ width: "90%" }}
                  /></Form.Item>
                ) : (
                  <div style={{ width: "90%" }}>
                    <Form.Item
                      required
                      rules={[
                        {
                          required: true,
                          message: "Please enter a new subject",
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </div>
                )}
              </Row>
            </Col>
            <Col span={12}>
              <Row>
                <label
                  style={{
                    display: "block",
                    width: "100%",
                    marginBottom: "4px",
                  }}
                >
                  Select subject
                </label>
                <Form.Item name="course_subject" style={{width:"100%"}}>
                <Select
                  value={selectedCourseSubject}
                  onChange={setSelectedCourseSubject}
                  placeholder="Select Subject"
                  options={subjectOptions}
                  style={{ width: "100%" }}
                ></Select></Form.Item>
              </Row>
              <Row>
                <Form.Item
                  label="Sub-Topic"
                  required
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                  style={{ marginBottom: 0 }}
                >
                  <Radio.Group
                    onChange={handleSubTopicOptionChange}
                    value={selectedSubTopicOption}
                    className="flex justify-between w-full mb-2"
                  >
                    <div
                      className={`flex-1 border border-gray-300 rounded-md p-2 ${
                        selectedSubTopicOption === "select_existing"
                          ? "bg-orange-50 border-orange-300"
                          : ""
                      } mr-2`}
                    >
                      <Radio
                        value="select_existing"
                        className={`w-full text-center ${
                          selectedSubTopicOption == "select_existing"
                            ? "text-orange-500"
                            : ""
                        }`}
                      >
                        Select from existing
                      </Radio>
                    </div>
                    <div
                      className={`flex-1 border border-gray-300 rounded-md p-2 ${
                        selectedSubTopicOption === "add_new"
                          ? "bg-orange-50 text-orange-500 border-orange-300"
                          : ""
                      }`}
                    >
                      <Radio
                        value="add_new"
                        className={`w-full text-center ${
                          selectedSubTopicOption == "add_new"
                            ? "text-orange-500"
                            : ""
                        }`}
                      >
                        Add new
                      </Radio>
                    </div>
                  </Radio.Group>
                </Form.Item>
              </Row>
              <Row style={{ width: "100%" }}>
                {selectedSubTopicOption === "select_existing" ? (
                  <Form.Item name="sub_topic" style={{width:"100%"}}>
                  <Select
                    value={selectedSubTopic}
                    onChange={(value) => {
                      setSelectedSubTopic(value);
                    }}
                    placeholder="Select Sub Topic"
                    options={subTopicOptions.map((subTopicOption) => ({
                      value: subTopicOption.name,
                      label: subTopicOption.name,
                    }))}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    style={{ width: "100%" }}
                  /></Form.Item>
                ) : (
                  <Form.Item
                    required
                    rules={[
                      { required: true, message: "Please enter a new subject" },
                    ]}
                    style={{ width: "100%" }}
                  >
                    <Input style={{ width: "100%" }} />{" "}
                  </Form.Item>
                )}
              </Row>
            </Col>
          </Row>
        </Card>
        <Card
          className="text-lg bg-gray-50 mt-2"
          bodyStyle={{ paddingTop: "10px", paddingBottom: "5px" }}
        >
          <Row>
            <h2 className="text-base font-semibold pb-2">Other Details</h2>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Tutorial Type"
                name="material_type"
                required
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                style={{ marginBottom: 0 }}
              >
                <Radio.Group
                  onChange={(e) => setMaterialType(e.target.value)}
                  value={materialType}
                  className="flex justify-between w-full mb-2"
                >
                  <div
                    className={`flex-1 border border-gray-300 rounded-md p-2 ${
                      materialType === "Video"
                        ? "bg-orange-50 border-orange-300"
                        : ""
                    } mr-2`}
                  >
                    <Radio
                      value="VIDEO"
                      className={`w-full text-center ${
                        materialType == "Video" ? "text-orange-500" : ""
                      }`}
                    >
                      Video
                    </Radio>
                  </div>
                  <div
                    className={`flex-1 border border-gray-300 rounded-md p-2 ${
                      materialType === "PDF"
                        ? "bg-orange-50 text-orange-500 border-orange-300"
                        : ""
                    }`}
                  >
                    <Radio
                      value="PDF"
                      className={`w-full text-center ${
                        materialType == "PDF" ? "text-orange-500" : ""
                      }`}
                    >
                      PDF
                    </Radio>
                  </div>
                  <div
                    className={`flex-1 border border-gray-300 ml-2 rounded-md p-2 ${
                      materialType === "Image"
                        ? "bg-orange-50 text-orange-500 border-orange-300"
                        : ""
                    }`}
                  >
                    <Radio
                      value="IMAGE"
                      className={`w-full text-center ${
                        materialType == "Image" ? "text-orange-500" : ""
                      }`}
                    >
                      Image
                    </Radio>
                  </div>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Access Type"
                name="access_type"
                required
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                style={{ marginBottom: 0 }}
              >
                <Radio.Group
                  onChange={(e) => {
                    setSelectedAccessTypeOption(e.target.value);
                  }}
                  value={selectedAccessTypeOption}
                  className="flex justify-between w-full mb-2"
                >
                  <div
                    className={`flex-1 border border-gray-300 rounded-md p-2 ${
                      selectedAccessTypeOption === "FREE"
                        ? "bg-orange-50 border-orange-300"
                        : ""
                    } mr-2`}
                  >
                    <Radio
                      value="FREE"
                      className={`w-full text-center ${
                        selectedAccessTypeOption == "FREE"
                          ? "text-orange-500"
                          : ""
                      }`}
                    >
                      Free
                    </Radio>
                  </div>
                  <div
                    className={`flex-1 border border-gray-300 rounded-md p-2 ${
                      selectedAccessTypeOption === "PAID"
                        ? "bg-orange-50 text-orange-500 border-orange-300"
                        : ""
                    }`}
                  >
                    <Radio
                      value="PAID"
                      className={`w-full text-center ${
                        selectedAccessTypeOption == "PAID"
                          ? "text-orange-500"
                          : ""
                      }`}
                    >
                      Paid
                    </Radio>
                  </div>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item
                label="Tutorial Upload Format"
                name="upload_format"
                required
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                style={{ marginBottom: 0 }}
              >
                <Radio.Group
                  value={uploadFormat}
                  onChange={(e) => {
                    setUploadFormat(e.target.value);
                    setFileList([]);
                    setUrlInput(null);
                    form.setFieldValue("file", null);
                    form.setFieldValue("url", null);
                  }}
                  className="flex justify-between w-full mb-2"
                >
                  <div
                    className={`flex-1 border border-gray-300 rounded-md p-2 ${
                      uploadFormat === "URL"
                        ? "bg-orange-50 border-orange-300"
                        : ""
                    } mr-2`}
                  >
                    <Radio
                      value="URL"
                      className={`w-full text-center ${
                        uploadFormat == "URL" ? "text-orange-500" : ""
                      }`}
                    >
                      URL
                    </Radio>
                  </div>
                  <div
                    className={`flex-1 border border-gray-300 rounded-md p-2 ${
                      uploadFormat === "FILE"
                        ? "bg-orange-50 text-orange-500 border-orange-300"
                        : ""
                    }`}
                  >
                    <Radio
                      value="FILE"
                      className={`w-full text-center ${
                        uploadFormat == "FILE" ? "text-orange-500" : ""
                      }`}
                    >
                      File
                    </Radio>
                  </div>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            {/*  {fileList.length == 0 &&
            (urlInput == "" || urlInput == undefined) ? (
              <Col span={6}>OR</Col>
            ) : null} */}
            {uploadFormat == "URL" && (
              <Row style={{ width: "100%" }}>
                <Form.Item
                  required
                  colon
                  wrapperCol={{ span: 24 }}
                  label="URL"
                  name="url"
                  style={{ width: "50%" }}
                >
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter URL"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Row>
            )}
            {uploadFormat == "FILE" && (
              <Col span={12}>
                <Form.Item
                  required
                  colon
                  wrapperCol={{ offset: 1 }}
                  label="Upload"
                  name="file"
                >
                  <Upload {...props}>
                    {fileList.length >= 1 ? null : uploadButton}
                  </Upload>
                </Form.Item>
              </Col>
            )}
          </Row>
        </Card>
        <Row
          justify="end"
          align="middle"
          style={{ marginTop: "20px", paddingRight: "20px" }}
        >
          <Button style={{ marginRight: "10px" }} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitLoading}
            disabled={isSubmitDisabled}
          >
            Submit
          </Button>
        </Row>
      </Form>
    </div>
  );
}

export default MaterialForm;

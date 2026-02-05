import { Modal, Table, Button, Select, message } from "antd";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/app/constants/apiConstants";

export default function AssignTestModal({ open, onClose, studentId }) {
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    axios
      .get(`${BASE_URL}/api/test/assignable/`, { withCredentials: true })
      .then((res) => setTests(res.data));
  }, [open]);

  const assignTest = () => {
    if (!selectedTests.length) {
      message.warning("Please select at least one test");
      return;
    }

    setLoading(true);

    axios
      .post(
        `${BASE_URL}/api/test/assign/`,
        {
          student_id: studentId,
          test_ids: selectedTests,
          expiration_days: 7,
        },
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": localStorage.getItem("csrfToken"),
          },
        }
      )
      .then((res) => {
        const { assigned_count, skipped_count } = res.data;

        message.success(
          `${assigned_count} test(s) assigned${
            skipped_count ? `, ${skipped_count} skipped` : ""
          }`
        );

        onClose();
        setSelectedTests([]);
      })
      .catch((err) => {
        message.error(err.response?.data?.detail || "Failed to assign tests");
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Assign Tests"
      okText="Assign"
      onOk={assignTest}
      confirmLoading={loading}
      destroyOnClose
    >
      <Select
        mode="multiple"
        className="w-full"
        placeholder="Select Tests"
        value={selectedTests}
        onChange={setSelectedTests}
        options={tests.map((t) => ({
          label: `${t.name} (${t.course_name})`,
          value: t.id,
        }))}
        optionFilterProp="label"
        showSearch
      />
    </Modal>
  );
}


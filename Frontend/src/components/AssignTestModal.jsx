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
      validateStatus: () => true, // 🔥 IMPORTANT
    }
  )
  .then((res) => {
    const data = res.data;

    if (!data) {
      message.error("Invalid response from server");
      return;
    }

    const { assigned_count, skipped_count, skipped } = data;

    // ✅ SUCCESS
    if (assigned_count > 0) {
      message.success(`${assigned_count} test(s) assigned successfully`);
    }

    // ⚠️ SKIPPED
    if (skipped_count > 0) {
      Modal.warning({
        title: "Some tests were not assigned",
        content: (
          <div>
            <p>{skipped_count} test(s) skipped:</p>
            <ul style={{ paddingLeft: 16 }}>
              {skipped?.map((s, i) => (
                <li key={i}>
                  <strong>{s.test_name}</strong> → {s.reason}
                </li>
              ))}
            </ul>
          </div>
        ),
      });
    }

    // ❌ NOTHING ASSIGNED
    if (assigned_count === 0 && skipped_count > 0) {
      message.error("No tests were assigned");
    }

    onClose();
    setSelectedTests([]);
  })
  .catch((err) => {
    message.error("Server error");
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


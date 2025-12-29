export default function Header({ studentName }) {
  const name = studentName || localStorage.getItem("name") || "Student";

  return (
    <div className="header-section">
      <h2 className="welcome-title">Welcome back, {name}</h2>
      <p className="student-info">Student Dashboard & Report Analysis</p>
    </div>
  );
}

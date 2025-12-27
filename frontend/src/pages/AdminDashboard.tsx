import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  rollNumber?: string;
  courseName?: string;
  biologyMarks?: number;
  physicsMarks?: number;
  chemistryMarks?: number;
  totalMarks?: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [marksForm, setMarksForm] = useState({
    biologyMarks: 0,
    physicsMarks: 0,
    chemistryMarks: 0,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch("http://localhost:5000/admin/students", {
        credentials: "include",
      });

      if (!response.ok) {
        navigate("/login");
        return;
      }

      const data = await response.json();
      setStudents(data.students);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch students", error);
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    await fetch("http://localhost:5000/logout", {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  const openMarksModal = (student: Student) => {
    setSelectedStudent(student);
    setMarksForm({
      biologyMarks: student.biologyMarks || 0,
      physicsMarks: student.physicsMarks || 0,
      chemistryMarks: student.chemistryMarks || 0,
    });
    setShowMarksModal(true);
  };

  const handleMarksSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) return;

    try {
      const response = await fetch(
        `http://localhost:5000/admin/students/${selectedStudent._id}/marks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(marksForm),
        }
      );

      if (response.ok) {
        alert("Marks updated successfully!");
        setShowMarksModal(false);
        fetchStudents(); // Refresh list
      } else {
        alert("Failed to update marks");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating marks");
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard - Shreyas Academy</h1>
        <button onClick={handleLogout} className="admin-logout-btn">
          Logout
        </button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-number">{students.length}</p>
        </div>
      </div>

      <div className="students-table-container">
        <h2>All Students</h2>
        <table className="students-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Biology</th>
              <th>Physics</th>
              <th>Chemistry</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id}>
                <td>{student.rollNumber || "N/A"}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.courseName || "Not enrolled"}</td>
                <td>{student.biologyMarks || 0}/360</td>
                <td>{student.physicsMarks || 0}/180</td>
                <td>{student.chemistryMarks || 0}/180</td>
                <td>{student.totalMarks || 0}/720</td>
                <td>
                  <button
                    onClick={() => openMarksModal(student)}
                    className="update-btn"
                  >
                    Update Marks
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMarksModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowMarksModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Update Marks for {selectedStudent.name}</h2>
            <form onSubmit={handleMarksSubmit}>
              <div className="form-group">
                <label>Biology Marks (out of 360)</label>
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={marksForm.biologyMarks}
                  onChange={(e) =>
                    setMarksForm({
                      ...marksForm,
                      biologyMarks: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Physics Marks (out of 180)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={marksForm.physicsMarks}
                  onChange={(e) =>
                    setMarksForm({
                      ...marksForm,
                      physicsMarks: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Chemistry Marks (out of 180)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={marksForm.chemistryMarks}
                  onChange={(e) =>
                    setMarksForm({
                      ...marksForm,
                      chemistryMarks: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn">
                  Save Marks
                </button>
                <button
                  type="button"
                  onClick={() => setShowMarksModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
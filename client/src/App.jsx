import { useEffect, useState } from "react";

function App() {
  const [jobs, setJobs] = useState([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Applied");

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const [filter, setFilter] = useState("All"); // ✅ moved inside

  /* ================= LOAD JOBS ================= */

  useEffect(() => {
    if (token) {
      fetch("http://localhost:5000/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) {
            throw new Error("Unauthorized");
          }
          return res.json();
        })
        .then(data => setJobs(data))
        .catch(() => {
          localStorage.clear();
          setToken(null);
        });
    }
  }, [token]);
  

  /* ================= AUTH ================= */

  const handleAuth = () => {
    const endpoint = isLogin ? "login" : "register";

    fetch(`http://localhost:5000/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(res => res.json())
      .then(data => {
        if (isLogin) {
          if (data.token) {
            localStorage.setItem("token", data.token);
            setToken(data.token);
          } else {
            alert(data.message);
          }
        } else {
          if (data.message === "User registered successfully") {
            alert("Registration successful! Please login.");
            setIsLogin(true);
            setPassword("");
          } else {
            alert(data.message);
          }
        }
      });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setJobs([]);
  };

  /* ================= JOB ACTIONS ================= */

  const addJob = () => {
    fetch("http://localhost:5000/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ company, role, status })
    })
      .then(res => res.json())
      .then(newJob => {
        setJobs([...jobs, newJob]);
        setCompany("");
        setRole("");
      });
  };

  const deleteJob = (id) => {
    fetch(`http://localhost:5000/jobs/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(() => {
      setJobs(jobs.filter(job => job._id !== id));
    });
  };

  const updateStatus = (id, newStatus) => {
    fetch(`http://localhost:5000/jobs/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(updatedJob => {
        setJobs(
          jobs.map(job =>
            job._id === id ? updatedJob : job
          )
        );
      });
  };

  /* ================= STATS ================= */

  const stats = {
    Applied: jobs.filter(j => j.status === "Applied").length,
    Interview: jobs.filter(j => j.status === "Interview").length,
    Offer: jobs.filter(j => j.status === "Offer").length,
    Rejected: jobs.filter(j => j.status === "Rejected").length,
  };

  const filteredJobs =
    filter === "All"
      ? jobs
      : jobs.filter(job => job.status === filter);

  const statusColors = {
    Applied: "bg-blue-100 text-blue-700",
    Interview: "bg-yellow-100 text-yellow-700",
    Offer: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  /* ================= AUTH SCREEN ================= */

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-80">
          <h2 className="text-xl font-semibold mb-4 text-center">
            {isLogin ? "Login" : "Register"}
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mb-3 border border-gray-200 rounded-lg px-3 py-2"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mb-4 border border-gray-200 rounded-lg px-3 py-2"
          />

          <button
            onClick={handleAuth}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {isLogin ? "Login" : "Register"}
          </button>

          <p
            className="text-sm text-center mt-4 cursor-pointer text-blue-500"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  /* ================= MAIN APP ================= */

  return (
    <div className="min-h-screen bg-gray-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">
            Job Application Tracker
          </h1>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>

        <p className="text-gray-500 mb-8">
          Track and manage your job applications.
        </p>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Object.entries(stats).map(([key, value]) => (
            <div
              key={key}
              className="bg-white p-4 rounded-xl shadow-sm text-center"
            >
              <p className="text-sm text-gray-500">{key}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {/* ===== FILTER ===== */}
        <div className="flex justify-end mb-4">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option>All</option>
            <option>Applied</option>
            <option>Interview</option>
            <option>Offer</option>
            <option>Rejected</option>
          </select>
        </div>

        {/* ===== FORM ===== */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="flex flex-wrap gap-4">
            <input
              placeholder="Company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="flex-1 min-w-[150px] border border-gray-200 rounded-lg px-3 py-2"
            />
            <input
              placeholder="Role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="flex-1 min-w-[150px] border border-gray-200 rounded-lg px-3 py-2"
            />
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2"
            >
              <option>Applied</option>
              <option>Interview</option>
              <option>Offer</option>
              <option>Rejected</option>
            </select>
            <button
              onClick={addJob}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add Job
            </button>
          </div>
        </div>

        {/* ===== JOBS ===== */}
        {filteredJobs.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            No jobs found.
          </div>
        )}

        <div className="space-y-5">
          {filteredJobs.map(job => (
            <div
              key={job._id}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-lg font-semibold">
                    {job.company}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {job.role}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}
                >
                  {job.status}
                </span>
              </div>

              <div className="flex gap-3 mt-4">
                <select
                  value={job.status}
                  onChange={e =>
                    updateStatus(job._id, e.target.value)
                  }
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option>Applied</option>
                  <option>Interview</option>
                  <option>Offer</option>
                  <option>Rejected</option>
                </select>

                <button
                  onClick={() => deleteJob(job._id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Data States
  const [stats, setStats] = useState({
    total_revenue: 0,
    pending_revenue: 0,
    total_tickets: 0,
    active_officers: 0,
  });
  const [allTickets, setAllTickets] = useState([]);
  const [offences, setOffences] = useState([]);
  const [officersList, setOfficersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isOffenceModalOpen, setIsOffenceModalOpen] = useState(false);
  const [editingOffence, setEditingOffence] = useState(null);
  const [offenceForm, setOffenceForm] = useState({
    code: "",
    name: "",
    description: "",
    fine_amount: "",
  });

  // NEW: Officer Inspection State
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  // Custom UI States
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [officerDeleteId, setOfficerDeleteId] = useState(null);

  const brandGreen = "#007A33";
  const brandRed = "#DA291C";

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "success" }),
      4000,
    );
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return navigate("/");
      const headers = { Authorization: `Bearer ${token}` };

      const statsRes = await axios.get(
        "http://127.0.0.1:8000/api/admin/stats/",
        { headers },
      );
      setStats(statsRes.data);

      const ticketsRes = await axios.get(
        "http://127.0.0.1:8000/api/bookings/",
        { headers },
      );
      setAllTickets(ticketsRes.data);

      const offencesRes = await axios.get(
        "http://127.0.0.1:8000/api/offences/",
        { headers },
      );
      setOffences(offencesRes.data);

      const officersRes = await axios.get(
        "http://127.0.0.1:8000/api/admin/officers/",
        { headers },
      );
      setOfficersList(officersRes.data);
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        showNotification(
          "Access Denied: Administrator privileges required.",
          "error",
        );
        setTimeout(() => navigate("/"), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  // --- OFFENCE LOGIC ---
  const openOffenceModal = (offence = null) => {
    if (offence) {
      setEditingOffence(offence);
      setOffenceForm({
        code: offence.code || "",
        name: offence.name,
        description: offence.description || "",
        fine_amount: offence.fine_amount,
      });
    } else {
      setEditingOffence(null);
      setOffenceForm({ code: "", name: "", description: "", fine_amount: "" });
    }
    setIsOffenceModalOpen(true);
  };

  const saveOffence = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editingOffence) {
        await axios.patch(
          `http://127.0.0.1:8000/api/offences/${editingOffence.id}/`,
          offenceForm,
          { headers },
        );
        showNotification("Traffic law updated successfully!", "success");
      } else {
        await axios.post("http://127.0.0.1:8000/api/offences/", offenceForm, {
          headers,
        });
        showNotification("New traffic offence added to the system!", "success");
      }
      setIsOffenceModalOpen(false);
      const offencesRes = await axios.get(
        "http://127.0.0.1:8000/api/offences/",
        { headers },
      );
      setOffences(offencesRes.data);
    } catch (error) {
      showNotification(`Failed to save!`, "error");
    }
  };

  const executeDeleteOffence = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `http://127.0.0.1:8000/api/offences/${deleteConfirmId}/`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showNotification("Offence deleted successfully!", "success");
      setOffences(offences.filter((offence) => offence.id !== deleteConfirmId));
    } catch (error) {
      showNotification(
        "Failed to delete. This offence is tied to existing tickets.",
        "error",
      );
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // --- OFFICER MANAGEMENT LOGIC ---
  const approveOfficer = async (id) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `http://127.0.0.1:8000/api/admin/officers/${id}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showNotification("Officer badge granted successfully!", "success");

      setOfficersList(
        officersList.map((officer) =>
          officer.id === id ? { ...officer, is_staff: true } : officer,
        ),
      );
      setSelectedOfficer(null); // Close modal after approval
    } catch (error) {
      showNotification("Failed to approve officer.", "error");
    }
  };

  const executeDeleteOfficer = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `http://127.0.0.1:8000/api/admin/officers/${officerDeleteId}/`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showNotification("User removed from the system.", "success");
      setOfficersList(
        officersList.filter((officer) => officer.id !== officerDeleteId),
      );
      setSelectedOfficer(null); // Close profile modal if open
    } catch (error) {
      showNotification("Failed to remove user.", "error");
    } finally {
      setOfficerDeleteId(null);
    }
  };

  if (isLoading)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Loading Administrator Portal...
      </div>
    );

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f1f5f9",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* TOAST NOTIFICATION */}
      {notification.show && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            backgroundColor:
              notification.type === "success" ? "#dcfce7" : "#fee2e2",
            color: notification.type === "success" ? brandGreen : brandRed,
            padding: "16px 24px",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            borderLeft: `5px solid ${notification.type === "success" ? brandGreen : brandRed}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "bold",
            animation: "slideIn 0.3s ease-out forwards",
          }}
        >
          {notification.message}
        </div>
      )}

      {/* HEADER SECTION */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "white",
          padding: "15px 30px",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img src={oyrtmaLogo} alt="OYRTMA Logo" style={{ width: "60px" }} />
          <div>
            <h2 style={{ color: "#1e293b", margin: 0 }}>Command Center</h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              System Administrator Portal
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#334155",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Secure Logout
        </button>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "dashboard" ? brandGreen : "white",
            color: activeTab === "dashboard" ? "white" : "#64748b",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          Overview & Revenue
        </button>
        <button
          onClick={() => setActiveTab("offences")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "offences" ? brandGreen : "white",
            color: activeTab === "offences" ? "white" : "#64748b",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          Manage Offences & Prices
        </button>
        <button
          onClick={() => setActiveTab("officers")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "officers" ? brandGreen : "white",
            color: activeTab === "officers" ? "white" : "#64748b",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          Manage Field Officers
        </button>
      </div>

      {/* --- TAB 1: DASHBOARD --- */}
      {activeTab === "dashboard" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                borderLeft: `5px solid ${brandGreen}`,
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  color: "#64748b",
                  fontWeight: "bold",
                  fontSize: "14px",
                  textTransform: "uppercase",
                }}
              >
                Total Collected Revenue
              </p>
              <h2 style={{ margin: 0, color: brandGreen, fontSize: "28px" }}>
                ₦{stats.total_revenue.toLocaleString()}
              </h2>
            </div>
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                borderLeft: `5px solid ${brandRed}`,
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  color: "#64748b",
                  fontWeight: "bold",
                  fontSize: "14px",
                  textTransform: "uppercase",
                }}
              >
                Pending / Unpaid Fines
              </p>
              <h2 style={{ margin: 0, color: brandRed, fontSize: "28px" }}>
                ₦{stats.pending_revenue.toLocaleString()}
              </h2>
            </div>
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                borderLeft: "5px solid #3b82f6",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  color: "#64748b",
                  fontWeight: "bold",
                  fontSize: "14px",
                  textTransform: "uppercase",
                }}
              >
                Total Tickets Issued
              </p>
              <h2 style={{ margin: 0, color: "#3b82f6", fontSize: "28px" }}>
                {stats.total_tickets}
              </h2>
            </div>
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                borderLeft: "5px solid #f59e0b",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  color: "#64748b",
                  fontWeight: "bold",
                  fontSize: "14px",
                  textTransform: "uppercase",
                }}
              >
                Active Field Officers
              </p>
              <h2 style={{ margin: 0, color: "#f59e0b", fontSize: "28px" }}>
                {stats.active_officers}
              </h2>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "10px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px 0",
                color: "#1e293b",
                borderBottom: "2px solid #f1f5f9",
                paddingBottom: "10px",
              }}
            >
              Statewide Traffic Offence Log
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", color: "#475569" }}>
                  <th
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Reference
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Location
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {allTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: "bold",
                        color: "#334155",
                      }}
                    >
                      {ticket.reference_id}
                    </td>
                    <td style={{ padding: "12px", color: "#64748b" }}>
                      {new Date(ticket.date_time).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px", color: "#64748b" }}>
                      {ticket.location}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: "bold",
                        color: "#334155",
                      }}
                    >
                      ₦{parseFloat(ticket.amount_due).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          backgroundColor:
                            ticket.payment_status === "Paid"
                              ? "#dcfce7"
                              : "#fee2e2",
                          color:
                            ticket.payment_status === "Paid"
                              ? brandGreen
                              : brandRed,
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {ticket.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- TAB 2: MANAGE OFFENCES --- */}
      {activeTab === "offences" && (
        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid #f1f5f9",
              paddingBottom: "10px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: 0, color: "#1e293b" }}>
              System Traffic Offences & Pricing
            </h3>
            <button
              onClick={() => openOffenceModal()}
              style={{
                padding: "8px 15px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              + Add New Offence Law
            </button>
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", color: "#475569" }}>
                <th
                  style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}
                >
                  Offence Name / Code
                </th>
                <th
                  style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}
                >
                  Current Fine Amount
                </th>
                <th
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #e2e8f0",
                    textAlign: "right",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {offences.map((offence) => (
                <tr
                  key={offence.id}
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <td
                    style={{
                      padding: "12px",
                      fontWeight: "bold",
                      color: "#334155",
                    }}
                  >
                    {offence.name}{" "}
                    <span style={{ color: "#94a3b8", marginLeft: "8px" }}>
                      [{offence.code}]
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontWeight: "bold",
                      color: brandRed,
                    }}
                  >
                    ₦{parseFloat(offence.fine_amount).toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      display: "flex",
                      gap: "10px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => openOffenceModal(offence)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(offence.id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#fee2e2",
                        color: brandRed,
                        border: "1px solid #fecaca",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TAB 3: MANAGE OFFICERS --- */}
      {activeTab === "officers" && (
        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid #f1f5f9",
              paddingBottom: "10px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: 0, color: "#1e293b" }}>
              Field Officer Requests & Roster
            </h3>
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", color: "#475569" }}>
                <th
                  style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}
                >
                  Officer Name & ID
                </th>
                <th
                  style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}
                >
                  Date Registered
                </th>
                <th
                  style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}
                >
                  System Status
                </th>
                <th
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #e2e8f0",
                    textAlign: "right",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {officersList.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No officer records found.
                  </td>
                </tr>
              ) : (
                officersList.map((officer) => (
                  <tr
                    key={officer.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      backgroundColor: officer.is_staff
                        ? "transparent"
                        : "#fffbeb",
                    }}
                  >
                    <td style={{ padding: "12px" }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          color: "#334155",
                          fontSize: "15px",
                        }}
                      >
                        {officer.first_name || "Unknown"}{" "}
                        {officer.last_name || "Officer"}
                      </div>
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        Badge/ID: @{officer.username}
                      </div>
                    </td>
                    <td style={{ padding: "12px", color: "#64748b" }}>
                      {new Date(officer.date_joined).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          backgroundColor: officer.is_staff
                            ? "#dcfce7"
                            : "#fef3c7",
                          color: officer.is_staff ? brandGreen : "#d97706",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {officer.is_staff
                          ? "Active Officer"
                          : "Pending Request"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedOfficer(officer)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#f1f5f9",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ADD/EDIT OFFENCE MODAL --- */}
      {isOffenceModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "400px",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "15px 20px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, color: "#333" }}>
                {editingOffence ? "Update Fine Amount" : "Create Traffic Law"}
              </h3>
              <button
                onClick={() => setIsOffenceModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={saveOffence} style={{ padding: "20px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#64748b",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  Offence Code
                </label>
                <input
                  type="text"
                  value={offenceForm.code}
                  onChange={(e) =>
                    setOffenceForm({ ...offenceForm, code: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "5px",
                    boxSizing: "border-box",
                    textTransform: "uppercase",
                  }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#64748b",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  Offence Name
                </label>
                <input
                  type="text"
                  value={offenceForm.name}
                  onChange={(e) =>
                    setOffenceForm({ ...offenceForm, name: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "5px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#64748b",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  Legal Description
                </label>
                <textarea
                  value={offenceForm.description}
                  onChange={(e) =>
                    setOffenceForm({
                      ...offenceForm,
                      description: e.target.value,
                    })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "5px",
                    boxSizing: "border-box",
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                />
              </div>
              <div style={{ marginBottom: "25px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#64748b",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  Fine Amount (₦)
                </label>
                <input
                  type="number"
                  value={offenceForm.fine_amount}
                  onChange={(e) =>
                    setOffenceForm({
                      ...offenceForm,
                      fine_amount: e.target.value,
                    })
                  }
                  required
                  min="0"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "5px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsOffenceModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: brandGreen,
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- OFFICER PROFILE INSPECTION MODAL --- */}
      {selectedOfficer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "450px",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "15px 20px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, color: "#333" }}>
                Officer Profile Details
              </h3>
              <button
                onClick={() => setSelectedOfficer(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: "25px" }}>
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  marginBottom: "20px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "#e2e8f0",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#64748b",
                  }}
                >
                  {selectedOfficer.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2
                    style={{
                      margin: "0 0 5px 0",
                      color: "#1e293b",
                      fontSize: "20px",
                    }}
                  >
                    {selectedOfficer.first_name} {selectedOfficer.last_name}
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                    @{selectedOfficer.username}
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "25px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontWeight: "bold",
                      fontSize: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    Email Address
                  </span>
                  <span
                    style={{
                      color: "#334155",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    {selectedOfficer.email || "No email provided"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontWeight: "bold",
                      fontSize: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    Date Applied
                  </span>
                  <span
                    style={{
                      color: "#334155",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    {new Date(selectedOfficer.date_joined).toLocaleDateString()}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontWeight: "bold",
                      fontSize: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    Current Status
                  </span>
                  <span
                    style={{
                      color: selectedOfficer.is_staff ? brandGreen : "#d97706",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {selectedOfficer.is_staff
                      ? "Active Officer"
                      : "Pending Request"}
                  </span>
                </div>
              </div>

              {/* Action Buttons Inside the Profile Modal */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  borderTop: "1px solid #eee",
                  paddingTop: "20px",
                }}
              >
                {!selectedOfficer.is_staff && (
                  <button
                    onClick={() => approveOfficer(selectedOfficer.id)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      backgroundColor: "#dcfce7",
                      color: brandGreen,
                      border: "1px solid #bbf7d0",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Approve Badge
                  </button>
                )}
                <button
                  onClick={() => setOfficerDeleteId(selectedOfficer.id)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#fee2e2",
                    color: brandRed,
                    border: "1px solid #fecaca",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {selectedOfficer.is_staff
                    ? "Revoke & Delete"
                    : "Reject & Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE OFFENCE / OFFICER MODALS (Hidden but active) --- */}
      {deleteConfirmId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "350px",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
              Delete Traffic Law?
            </h3>
            <p
              style={{
                margin: "0 0 20px 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteOffence}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: brandRed,
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {officerDeleteId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "350px",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
              Remove Officer?
            </h3>
            <p
              style={{
                margin: "0 0 20px 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Are you sure you want to permanently delete this user from the
              system?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setOfficerDeleteId(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteOfficer}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: brandRed,
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

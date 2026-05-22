import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard', 'offences', 'officers', 'analytics'

  // Data States
  const [stats, setStats] = useState({
    total_revenue: 0,
    pending_revenue: 0,
    total_tickets: 0,
    active_officers: 0,
    this_month_revenue: 0,
    last_month_revenue: 0,
    revenue_growth: 0,
    top_locations: [],
    top_officers: [],
    top_offences: [],
  });
  const [allTickets, setAllTickets] = useState([]);
  const [offences, setOffences] = useState([]);
  const [officersList, setOfficersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // SMS Monitoring States
  const [smsStats, setSmsStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    success_rate: "0%"
  });
  const [smsLogs, setSmsLogs] = useState([]);
  const [smsLogsLoading, setSmsLogsLoading] = useState(false);
  const [smsLogsError, setSmsLogsError] = useState("");
  const [smsSearch, setSmsSearch] = useState("");
  const [smsStatusFilter, setSmsStatusFilter] = useState("all");
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsLogModal, setSmsLogModal] = useState(null);
  const [smsPage, setSmsPage] = useState(1);
  const smsPerPage = 10;

  // Modal States
  const [isOffenceModalOpen, setIsOffenceModalOpen] = useState(false);
  const [editingOffence, setEditingOffence] = useState(null);
  const [offenceForm, setOffenceForm] = useState({
    code: "",
    name: "",
    description: "",
    fine_amount: "",
  });
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  // Custom UI States
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [officerDeleteId, setOfficerDeleteId] = useState(null);

  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketPage, setTicketPage] = useState(1);
  const ticketsPerPage = 10;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

      const statsUrl = startDate && endDate 
        ? `http://127.0.0.1:8000/api/admin/stats/?start_date=${startDate}&end_date=${endDate}`
        : "http://127.0.0.1:8000/api/admin/stats/";

      const statsRes = await axios.get(statsUrl, { headers });
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

  // --- SMS MONITORING LOGIC ---
  useEffect(() => {
    if (activeTab === "sms_monitoring") {
      fetchSmsData();
    }
  }, [activeTab]);

  useEffect(() => {
    setSmsPage(1);
  }, [smsSearch, smsStatusFilter]);

  const fetchSmsData = async () => {
    setSmsLogsLoading(true);
    setSmsLogsError("");
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return navigate("/");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch SMS statistics
      const statsRes = await axios.get("http://127.0.0.1:8000/api/sms-logs/stats/", { headers });
      setSmsStats(statsRes.data);

      // Fetch SMS logs
      const logsRes = await axios.get("http://127.0.0.1:8000/api/sms-logs/", { headers });
      setSmsLogs(logsRes.data);
    } catch (error) {
      console.error("Error fetching SMS data:", error);
      setSmsLogsError("Failed to fetch SMS logs or statistics.");
    } finally {
      setSmsLogsLoading(false);
    }
  };

  const handleRetrySms = async (id) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return navigate("/");
      const headers = { Authorization: `Bearer ${token}` };

      showNotification("Queuing SMS retry task...", "success");
      await axios.post(`http://127.0.0.1:8000/api/sms-logs/${id}/retry/`, {}, { headers });
      showNotification("SMS retry task successfully queued!", "success");
      
      // Refresh data
      fetchSmsData();
      
      // If modal is open for this log, close it or refresh it
      if (smsLogModal && smsLogModal.id === id) {
        setIsSmsModalOpen(false);
        setSmsLogModal(null);
      }
    } catch (error) {
      console.error("Error retrying SMS:", error);
      const errorMsg = error.response?.data?.error || "Failed to retry SMS notification.";
      showNotification(errorMsg, "error");
    }
  };

  const filteredSmsLogs = smsLogs.filter((log) => {
    // 1. Filter by status
    if (smsStatusFilter !== "all" && log.status !== smsStatusFilter) {
      return false;
    }
    // 2. Filter by search string
    if (smsSearch) {
      const searchLower = smsSearch.toLowerCase();
      const phoneMatch = log.phone_number && log.phone_number.toLowerCase().includes(searchLower);
      const refMatch = log.booking_reference && log.booking_reference.toLowerCase().includes(searchLower);
      const nameMatch = log.driver_name && log.driver_name.toLowerCase().includes(searchLower);
      const msgMatch = log.message && log.message.toLowerCase().includes(searchLower);
      return phoneMatch || refMatch || nameMatch || msgMatch;
    }
    return true;
  });

  const totalSmsPages = Math.ceil(filteredSmsLogs.length / smsPerPage);
  const displayedSmsLogs = filteredSmsLogs.slice((smsPage - 1) * smsPerPage, smsPage * smsPerPage);

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
      setSelectedOfficer(null);
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
      setSelectedOfficer(null);
    } catch (error) {
      showNotification("Failed to remove user.", "error");
    } finally {
      setOfficerDeleteId(null);
    }
  };

  // HELPER: Find highest count for CSS Bar Charts
  const getMaxValue = (array) =>
    array.length > 0 ? Math.max(...array.map((item) => item.count)) : 1;

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
        className="no-print"
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
      <div
        className="no-print"
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
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
          onClick={() => setActiveTab("analytics")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "analytics" ? brandGreen : "white",
            color: activeTab === "analytics" ? "white" : "#64748b",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          Analytics & Reports
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
          Manage Offences
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
          Manage Officers
        </button>
        <button
          onClick={() => setActiveTab("sms_monitoring")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "sms_monitoring" ? brandGreen : "white",
            color: activeTab === "sms_monitoring" ? "white" : "#64748b",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          SMS Monitoring
        </button>
      </div>

      {/* --- TAB 1: OVERVIEW DASHBOARD --- */}
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

          <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#1e293b" }}>Statewide Traffic Offence Log</h3>
              {/* NEW: Real-time Search Bar */}
              <input 
                type="text" 
                placeholder="Search by Ref ID or Location..." 
                value={ticketSearch}
                onChange={(e) => { setTicketSearch(e.target.value); setTicketPage(1); }} // Reset to page 1 on search
                style={{ padding: "8px 12px", borderRadius: "5px", border: "1px solid #ccc", width: "250px" }}
              />
            </div>
            
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              {/* Your existing thead goes here */}
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", color: "#475569" }}>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Reference</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Date</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Location</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Amount</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* NEW: Filter and Paginate the data before mapping */}
                {allTickets
                  .filter(t => t.reference_id?.toLowerCase().includes(ticketSearch.toLowerCase()) || t.location?.toLowerCase().includes(ticketSearch.toLowerCase()))
                  .slice((ticketPage - 1) * ticketsPerPage, ticketPage * ticketsPerPage)
                  .map((ticket) => (
                  <tr key={ticket.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontWeight: "bold", color: "#334155" }}>{ticket.reference_id}</td>
                    <td style={{ padding: "12px", color: "#64748b" }}>{new Date(ticket.date_time).toLocaleDateString()}</td>
                    <td style={{ padding: "12px", color: "#64748b" }}>{ticket.location}</td>
                    <td style={{ padding: "12px", fontWeight: "bold", color: "#334155" }}>₦{parseFloat(ticket.amount_due).toLocaleString()}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ backgroundColor: ticket.payment_status === "Paid" ? "#dcfce7" : "#fee2e2", color: ticket.payment_status === "Paid" ? brandGreen : brandRed, padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                        {ticket.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* NEW: Pagination Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
              <button 
                onClick={() => setTicketPage(prev => Math.max(prev - 1, 1))} 
                disabled={ticketPage === 1}
                style={{ padding: "8px 15px", backgroundColor: ticketPage === 1 ? "#e2e8f0" : brandGreen, color: ticketPage === 1 ? "#94a3b8" : "white", border: "none", borderRadius: "5px", cursor: ticketPage === 1 ? "not-allowed" : "pointer", fontWeight: "bold" }}
              >Previous</button>
              <span style={{ color: "#64748b", fontWeight: "bold" }}>Page {ticketPage}</span>
              <button 
                onClick={() => setTicketPage(prev => prev + 1)} 
                disabled={ticketPage * ticketsPerPage >= allTickets.filter(t => t.reference_id?.toLowerCase().includes(ticketSearch.toLowerCase()) || t.location?.toLowerCase().includes(ticketSearch.toLowerCase())).length}
                style={{ padding: "8px 15px", backgroundColor: ticketPage * ticketsPerPage >= allTickets.length ? "#e2e8f0" : brandGreen, color: ticketPage * ticketsPerPage >= allTickets.length ? "#94a3b8" : "white", border: "none", borderRadius: "5px", cursor: ticketPage * ticketsPerPage >= allTickets.length ? "not-allowed" : "pointer", fontWeight: "bold" }}
              >Next</button>
            </div>
          </div>
        </>
      )}

      {/* --- TAB 2: ANALYTICS & REPORTS (NEW!) --- */}
      {activeTab === "analytics" && (
        <>
          <style>
            {`
              @media print {
                /* Hide everything with the no-print class */
                .no-print { display: none !important; }
                
                /* Force a clean white background */
                body, html { background-color: white !important; }
                
                /* Prevent the charts from being sliced in half across pages */
                #printable-analytics > div > div { 
                    page-break-inside: avoid; 
                    break-inside: avoid; 
                }
              }
            `}
          </style>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", backgroundColor: "white", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", color: "#334155" }}>Filter Period:</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "5px" }} />
              <span style={{ color: "#64748b" }}>to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "5px" }} />
              <button onClick={fetchAdminData} style={{ padding: "8px 15px", backgroundColor: brandGreen, color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Apply</button>
              {(startDate || endDate) && <button onClick={() => { setStartDate(""); setEndDate(""); setTimeout(fetchAdminData, 100); }} style={{ padding: "8px 15px", backgroundColor: "#e2e8f0", color: "#475569", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Clear</button>}
            </div>
            
            <button onClick={() => window.print()} style={{ padding: "10px 20px", backgroundColor: "#334155", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
              🖨️ Export / Print PDF Report
            </button>
          </div>

          <div id="printable-analytics">
            {/* Revenue Growth Card */}
            <div
              style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            ></div>
            <div>
              <h3 style={{ margin: "0 0 5px 0", color: "#1e293b" }}>
                Monthly Revenue Performance
              </h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                Collected fines comparing this month to last month.
              </p>
            </div>
            <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: "0 0 5px 0",
                    color: "#64748b",
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  Last Month
                </p>
                <h3 style={{ margin: 0, color: "#94a3b8" }}>
                  ₦{stats.last_month_revenue.toLocaleString()}
                </h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: "0 0 5px 0",
                    color: brandGreen,
                    fontSize: "12px",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  This Month
                </p>
                <h2 style={{ margin: 0, color: brandGreen, fontSize: "28px" }}>
                  ₦{stats.this_month_revenue.toLocaleString()}
                </h2>
              </div>
              <div
                style={{
                  backgroundColor:
                    stats.revenue_growth >= 0 ? "#dcfce7" : "#fee2e2",
                  color: stats.revenue_growth >= 0 ? brandGreen : brandRed,
                  padding: "10px 15px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {stats.revenue_growth >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(stats.revenue_growth)}%
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Top Crime Hotspots */}
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
                📍 Top Crime Hotspots
              </h3>
              {stats.top_locations.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No data available.</p>
              ) : (
                stats.top_locations.map((loc, idx) => (
                  <div key={idx} style={{ marginBottom: "15px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                        fontSize: "14px",
                      }}
                    >
                      <span style={{ fontWeight: "bold", color: "#334155" }}>
                        {loc.location}
                      </span>
                      <span style={{ color: "#64748b", fontWeight: "bold" }}>
                        {loc.count} tickets
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "4px",
                        height: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(loc.count / getMaxValue(stats.top_locations)) * 100}%`,
                          backgroundColor: brandRed,
                          height: "100%",
                          borderRadius: "4px",
                          transition: "width 1s ease-in-out",
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Top Performing Officers */}
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
                👮 Top Catch Rates (Officers)
              </h3>
              {stats.top_officers.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No data available.</p>
              ) : (
                stats.top_officers.map((off, idx) => (
                  <div key={idx} style={{ marginBottom: "15px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                        fontSize: "14px",
                      }}
                    >
                      <span style={{ fontWeight: "bold", color: "#334155" }}>
                        {off.officer__first_name} {off.officer__last_name}
                      </span>
                      <span style={{ color: "#64748b", fontWeight: "bold" }}>
                        {off.count} apprehensions
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "4px",
                        height: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(off.count / getMaxValue(stats.top_officers)) * 100}%`,
                          backgroundColor: "#3b82f6",
                          height: "100%",
                          borderRadius: "4px",
                          transition: "width 1s ease-in-out",
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Most Frequent Offences */}
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
                📋 Most Frequent Violations
              </h3>
              {stats.top_offences.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No data available.</p>
              ) : (
                stats.top_offences.map((violation, idx) => (
                  <div key={idx} style={{ marginBottom: "15px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                        fontSize: "14px",
                      }}
                    >
                      <span style={{ fontWeight: "bold", color: "#334155" }}>
                        {violation.offence__name}
                      </span>
                      <span style={{ color: "#64748b", fontWeight: "bold" }}>
                        {violation.count} occurrences
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "4px",
                        height: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(violation.count / getMaxValue(stats.top_offences)) * 100}%`,
                          backgroundColor: "#f59e0b",
                          height: "100%",
                          borderRadius: "4px",
                          transition: "width 1s ease-in-out",
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* --- TAB 3: MANAGE OFFENCES --- */}
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

      {/* --- TAB 4: MANAGE OFFICERS --- */}
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

      {activeTab === "sms_monitoring" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* STATS OVERVIEW CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                borderLeft: "6px solid #475569",
              }}
            >
              <p style={{ margin: "0 0 10px 0", color: "#64748b", fontWeight: "bold", fontSize: "14px" }}>
                Total Messages
              </p>
              <h3 style={{ margin: 0, fontSize: "28px", color: "#1e293b" }}>{smsStats.total}</h3>
            </div>
            
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                borderLeft: `6px solid ${brandGreen}`,
              }}
            >
              <p style={{ margin: "0 0 10px 0", color: "#64748b", fontWeight: "bold", fontSize: "14px" }}>
                Successfully Sent
              </p>
              <h3 style={{ margin: 0, fontSize: "28px", color: brandGreen }}>{smsStats.sent}</h3>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                borderLeft: `6px solid ${brandRed}`,
              }}
            >
              <p style={{ margin: "0 0 10px 0", color: "#64748b", fontWeight: "bold", fontSize: "14px" }}>
                Failed Delivery
              </p>
              <h3 style={{ margin: 0, fontSize: "28px", color: brandRed }}>{smsStats.failed}</h3>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                borderLeft: "6px solid #d97706",
              }}
            >
              <p style={{ margin: "0 0 10px 0", color: "#64748b", fontWeight: "bold", fontSize: "14px" }}>
                Pending Resends
              </p>
              <h3 style={{ margin: 0, fontSize: "28px", color: "#d97706" }}>{smsStats.pending}</h3>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                borderLeft: "6px solid #0284c7",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <p style={{ margin: "0 0 5px 0", color: "#64748b", fontWeight: "bold", fontSize: "14px" }}>
                Success Rate
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                <h3 style={{ margin: 0, fontSize: "28px", color: "#0284c7" }}>{smsStats.success_rate}</h3>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTERS CONTROLS */}
          <div
            style={{
              backgroundColor: "white",
              padding: "15px 20px",
              borderRadius: "10px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search phone, driver, ref..."
                value={smsSearch}
                onChange={(e) => setSmsSearch(e.target.value)}
                style={{
                  padding: "8px 15px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "14px",
                  width: "250px",
                  outline: "none",
                }}
              />
              
              {/* STATUS FILTER PILLS */}
              <div style={{ display: "flex", gap: "5px", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                {["all", "sent", "failed", "pending"].map((statusOption) => (
                  <button
                    key={statusOption}
                    onClick={() => setSmsStatusFilter(statusOption)}
                    style={{
                      padding: "8px 15px",
                      border: "none",
                      backgroundColor: smsStatusFilter === statusOption ? brandGreen : "white",
                      color: smsStatusFilter === statusOption ? "white" : "#475569",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                      textTransform: "capitalize",
                    }}
                  >
                    {statusOption}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchSmsData}
              disabled={smsLogsLoading}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f1f5f9",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              🔄 {smsLogsLoading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          {/* LOGS TABLE CONTAINER */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "16px 20px", fontWeight: "600", fontSize: "14px" }}>Recipient (Phone)</th>
                  <th style={{ padding: "16px 20px", fontWeight: "600", fontSize: "14px" }}>Driver Name</th>
                  <th style={{ padding: "16px 20px", fontWeight: "600", fontSize: "14px" }}>Fine Reference</th>
                  <th style={{ padding: "16px 20px", fontWeight: "600", fontSize: "14px" }}>Message Snippet</th>
                  <th style={{ padding: "16px 20px", fontWeight: "600", fontSize: "14px" }}>Delivery Status</th>
                  <th style={{ padding: "16px 20px", fontWeight: "600", fontSize: "14px" }}>Timestamp</th>
                  <th style={{ padding: "16px 20px", fontWeight: "600", fontSize: "14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {smsLogsLoading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      Loading system SMS logs...
                    </td>
                  </tr>
                ) : smsLogsError ? (
                  <tr>
                    <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: brandRed, fontWeight: "bold" }}>
                      {smsLogsError}
                    </td>
                  </tr>
                ) : displayedSmsLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      No matching SMS logs found.
                    </td>
                  </tr>
                ) : (
                  displayedSmsLogs.map((log) => {
                    const statusColors = {
                      sent: { bg: "#dcfce7", text: brandGreen },
                      failed: { bg: "#fee2e2", text: brandRed },
                      pending: { bg: "#fef3c7", text: "#d97706" }
                    };
                    const color = statusColors[log.status] || { bg: "#f1f5f9", text: "#64748b" };

                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "16px 20px", fontSize: "14px", fontWeight: "500", color: "#334155" }}>
                          {log.phone_number}
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: "14px", color: "#475569" }}>
                          {log.driver_name || "Unknown"}
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: "14px", color: "#475569", fontFamily: "monospace" }}>
                          {log.booking_reference || "N/A"}
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: "13px", color: "#64748b", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {log.message}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span
                            style={{
                              backgroundColor: color.bg,
                              color: color.text,
                              padding: "4px 10px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                            }}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: "13px", color: "#64748b" }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => {
                                setSmsLogModal(log);
                                setIsSmsModalOpen(true);
                              }}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#f1f5f9",
                                color: "#1e293b",
                                border: "1px solid #cbd5e1",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              Details
                            </button>
                            {log.status === "failed" && (
                              <button
                                onClick={() => handleRetrySms(log.id)}
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#fff7ed",
                                  color: brandRed,
                                  border: `1px solid ${brandRed}`,
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                Retry
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* PAGINATION BAR */}
            {totalSmsPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px 20px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Showing {(smsPage - 1) * smsPerPage + 1} to{" "}
                  {Math.min(smsPage * smsPerPage, filteredSmsLogs.length)} of{" "}
                  {filteredSmsLogs.length} logs
                </span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => setSmsPage((p) => Math.max(1, p - 1))}
                    disabled={smsPage === 1}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: smsPage === 1 ? "#f1f5f9" : "white",
                      color: smsPage === 1 ? "#94a3b8" : "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      cursor: smsPage === 1 ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: "13px", color: "#475569", fontWeight: "600" }}>
                    Page {smsPage} of {totalSmsPages}
                  </span>
                  <button
                    onClick={() => setSmsPage((p) => Math.min(totalSmsPages, p + 1))}
                    disabled={smsPage === totalSmsPages}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: smsPage === totalSmsPages ? "#f1f5f9" : "white",
                      color: smsPage === totalSmsPages ? "#94a3b8" : "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      cursor: smsPage === totalSmsPages ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMS DETAILS MODAL */}
      {isSmsModalOpen && smsLogModal && (
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
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "600px",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "85vh",
            }}
          >
            {/* Modal Header */}
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
              <h3 style={{ margin: 0, color: "#333", fontSize: "16px" }}>
                SMS Notification Audit Details
              </h3>
              <button
                onClick={() => {
                  setIsSmsModalOpen(false);
                  setSmsLogModal(null);
                }}
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

            {/* Modal Body */}
            <div style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "bold" }}>
                    Recipient Phone
                  </span>
                  <p style={{ margin: "2px 0 0 0", color: "#1e293b", fontWeight: "600" }}>{smsLogModal.phone_number}</p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "bold" }}>
                    Driver Name
                  </span>
                  <p style={{ margin: "2px 0 0 0", color: "#1e293b", fontWeight: "600" }}>{smsLogModal.driver_name || "Unknown"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "bold" }}>
                    Fine Reference
                  </span>
                  <p style={{ margin: "2px 0 0 0", color: "#1e293b", fontFamily: "monospace", fontWeight: "600" }}>
                    {smsLogModal.booking_reference || "N/A"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "bold" }}>
                    Status
                  </span>
                  <div style={{ margin: "2px 0 0 0" }}>
                    <span
                      style={{
                        backgroundColor: smsLogModal.status === "sent" ? "#dcfce7" : smsLogModal.status === "failed" ? "#fee2e2" : "#fef3c7",
                        color: smsLogModal.status === "sent" ? brandGreen : smsLogModal.status === "failed" ? brandRed : "#d97706",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      {smsLogModal.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "bold" }}>
                  Message Text
                </span>
                <div style={{ marginTop: "4px", padding: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                  {smsLogModal.message}
                </div>
              </div>

              {smsLogModal.error_message && (
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: brandRed, fontWeight: "bold" }}>
                    Error details
                  </span>
                  <div style={{ marginTop: "4px", padding: "12px", backgroundColor: "#fef2f2", border: `1px solid ${brandRed}`, borderRadius: "6px", fontSize: "13px", color: brandRed, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                    {smsLogModal.error_message}
                  </div>
                </div>
              )}

              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "bold" }}>
                  Raw Termii Gateway Response
                </span>
                <pre style={{ marginTop: "4px", padding: "12px", backgroundColor: "#0f172a", color: "#38bdf8", borderRadius: "6px", fontSize: "12px", fontFamily: "monospace", overflowX: "auto", margin: 0 }}>
                  {smsLogModal.termii_response 
                    ? JSON.stringify(smsLogModal.termii_response, null, 2) 
                    : "No payload response stored."}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "15px 20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "10px", backgroundColor: "#f8f9fa" }}>
              <button
                onClick={() => {
                  setIsSmsModalOpen(false);
                  setSmsLogModal(null);
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#cbd5e1",
                  color: "#334155",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Close
              </button>
              {smsLogModal.status === "failed" && (
                <button
                  onClick={() => handleRetrySms(smsLogModal.id)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: brandRed,
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Retry Notification
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- ALL MODALS (HIDDEN BUT ACTIVE) --- */}
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

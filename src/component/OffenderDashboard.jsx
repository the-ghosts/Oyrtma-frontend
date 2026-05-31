import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";
import AddVehicle from "./AddVehicle";

function OffenderDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState("vehicles"); // 'vehicles', 'fines', 'support'

  // Analytics, Disputes, and Profile States
  const [disputes, setDisputes] = useState([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeForm, setDisputeForm] = useState({ booking: "", reason: "Wrong Offence", description: "" });

  const [profileData, setProfileData] = useState({ driver_name: "", driver_license_number: "", phone_number: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Payment States

  const [ticketToPay, setTicketToPay] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paystackPublicKey, setPaystackPublicKey] = useState("");
  const [evidenceData, setEvidenceData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const brandGreen = "#007A33";
  const brandRed = "#DA291C";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/offender-login");
      return;
    }
    fetchPaystackConfig();
    fetchVehicles(); // Default view is vehicles, so fetch initially!
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (activeTab === "vehicles") {
      fetchVehicles();
    } else if (activeTab === "fines") {
      fetchMyTickets();
    } else if (activeTab === "analytics") {
      fetchMyTickets();
    } else if (activeTab === "disputes") {
      fetchDisputes();
      fetchMyTickets(); // Need tickets for dropdown select
    } else if (activeTab === "profile") {
      fetchProfile();
      fetchVehicles();
    }
  }, [activeTab]);

  const fetchDisputes = async () => {
    setDisputesLoading(true);
    setDisputesError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get("http://127.0.0.1:8000/api/disputes/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisputes(res.data);
    } catch (err) {
      console.error("Error fetching disputes:", err);
      setDisputesError("Failed to load your disputes.");
    } finally {
      setDisputesLoading(false);
    }
  };

  const submitDispute = async (e) => {
    e.preventDefault();
    if (!disputeForm.booking) {
      alert("Please select a ticket to dispute.");
      return;
    }
    setIsSubmittingDispute(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post("http://127.0.0.1:8000/api/disputes/", disputeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Dispute submitted successfully and is now pending OYRTMA administrative review.");
      setDisputeForm({ booking: "", reason: "Wrong Offence", description: "" });
      setShowDisputeForm(false);
      fetchDisputes();
    } catch (err) {
      console.error("Error submitting dispute:", err.response?.data || err.message);
      alert("Failed to submit dispute: " + (err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || err.message));
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get("http://127.0.0.1:8000/api/citizen/profile/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setProfileError("Failed to load profile settings.");
    } finally {
      setProfileLoading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.put("http://127.0.0.1:8000/api/citizen/profile/", profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Profile contact information successfully updated and synced with driver registry.");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile information.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      const token = localStorage.getItem("access_token");
      await axios.post("http://127.0.0.1:8000/api/citizen/change-password/", {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasswordSuccess("Password updated successfully.");
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      console.error("Error changing password:", err.response?.data || err.message);
      setPasswordError(err.response?.data?.old_password?.[0] || err.response?.data?.new_password?.[0] || "Failed to update password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fetchPaystackConfig = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return navigate("/offender-login");
      const res = await axios.get(
        "http://127.0.0.1:8000/api/payments/config/",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPaystackPublicKey(res.data.publicKey);
    } catch (err) {
      console.error("Failed to fetch Paystack config:", err.message);
      if (err.response?.status === 401) navigate("/offender-login");
    }
  };

  const fetchMyTickets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return navigate("/offender-login");
      const response = await axios.get("http://127.0.0.1:8000/api/bookings/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
      if (error.response && error.response.status === 401)
        navigate("/offender-login");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const response = await axios.get("http://127.0.0.1:8000/api/vehicles/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const manualVerifyPayment = async (ref, ticket) => {
    console.log(
      `5. SENDING REQUEST TO: /api/bookings/${ticket.id}/verify-payment/ with ref: ${ref}`,
    );
    if (!ref || !ticket) return false;
    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `http://127.0.0.1:8000/api/bookings/${ticket.id}/verify-payment/`,
        { reference: ref },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log("6. ✅ DJANGO RESPONSE SUCCESS:", response.data);

      await fetchMyTickets(); // Reloads the tickets so the UI turns green
      setLastPaymentRef(null);
      setTicketToPay(null);
      return true;
    } catch (error) {
      console.error(
        "6. ❌ DJANGO VERIFICATION FAILED:",
        error.response?.data || error.message,
      );
      if (error.response?.status !== 401)
        alert(
          `Verification failed: ${error.response?.data?.detail || error.message}`,
        );
      return false;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const openPaymentModal = async (ticket) => {
    setIsProcessingPayment(true);
    setTicketToPay(ticket);
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.post(
        `http://127.0.0.1:8000/api/bookings/${ticket.id}/initialize-payment/`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      window.location.href = res.data.data.authorization_url;
      
    } catch (err) {
      console.error("Failed to initialize backend payment", err);
      // NEW: Trigger the custom modal instead of an alert!
      setErrorMessage("Could not connect to the payment server. Please check your connection and try again.");
      setIsProcessingPayment(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/offender-login");
  };

  const totalOwed = tickets.reduce(
    (sum, ticket) =>
      ticket.payment_status !== "Paid" && ticket.payment_status !== "Cancelled"
        ? sum + parseFloat(ticket.amount_due || 0)
        : sum,
    0,
  );

  const Spinner = ({ size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ animation: "spin 1s linear infinite", marginRight: "6px" }}
    >
      <circle cx="12" cy="12" r="1" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f4f4f9",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "white",
          padding: "15px 30px",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img src={oyrtmaLogo} alt="OYRTMA Logo" style={{ width: "60px" }} />
          <h2 style={{ color: "#333", margin: 0 }}>
            Driver Self-Service Portal
          </h2>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 15px",
            backgroundColor: "#555",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Secure Logout
        </button>
      </div>

      {/* OUTSTANDING FINES CARD */}
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          textAlign: "center",
          borderTop: `5px solid ${totalOwed > 0 ? brandRed : brandGreen}`,
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#666" }}>
          Total Outstanding Fines
        </h3>
        <h1
          style={{
            margin: 0,
            fontSize: "48px",
            color: totalOwed > 0 ? brandRed : brandGreen,
          }}
        >
          ₦
          {totalOwed.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h1>
        {totalOwed === 0 && (
          <p
            style={{ color: brandGreen, fontWeight: "bold", marginTop: "10px" }}
          >
            You have no pending traffic violations. Drive safely!
          </p>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setActiveTab("vehicles")}
          style={{
            padding: "12px 20px",
            backgroundColor: activeTab === "vehicles" ? brandGreen : "white",
            color: activeTab === "vehicles" ? "white" : "#475569",
            border: activeTab === "vehicles" ? `1px solid ${brandGreen}` : "1px solid #cbd5e1",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "vehicles" ? "0 4px 6px rgba(0, 122, 51, 0.15)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🚘 My Vehicles
          <span
            style={{
              backgroundColor: activeTab === "vehicles" ? "rgba(255,255,255,0.25)" : "#e2e8f0",
              color: activeTab === "vehicles" ? "white" : "#475569",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "bold",
            }}
          >
            {vehicles.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("fines")}
          style={{
            padding: "12px 20px",
            backgroundColor: activeTab === "fines" ? brandGreen : "white",
            color: activeTab === "fines" ? "white" : "#475569",
            border: activeTab === "fines" ? `1px solid ${brandGreen}` : "1px solid #cbd5e1",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "fines" ? "0 4px 6px rgba(0, 122, 51, 0.15)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          📜 Fines & Offences
          <span
            style={{
              backgroundColor: activeTab === "fines" ? "rgba(255,255,255,0.25)" : "#e2e8f0",
              color: activeTab === "fines" ? "white" : "#475569",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "bold",
            }}
          >
            {tickets.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          style={{
            padding: "12px 20px",
            backgroundColor: activeTab === "analytics" ? brandGreen : "white",
            color: activeTab === "analytics" ? "white" : "#475569",
            border: activeTab === "analytics" ? `1px solid ${brandGreen}` : "1px solid #cbd5e1",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "analytics" ? "0 4px 6px rgba(0, 122, 51, 0.15)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          📈 Reports & Analytics
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          style={{
            padding: "12px 20px",
            backgroundColor: activeTab === "disputes" ? brandGreen : "white",
            color: activeTab === "disputes" ? "white" : "#475569",
            border: activeTab === "disputes" ? `1px solid ${brandGreen}` : "1px solid #cbd5e1",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "disputes" ? "0 4px 6px rgba(0, 122, 51, 0.15)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ⚖️ Ticket Disputes
          <span
            style={{
              backgroundColor: activeTab === "disputes" ? "rgba(255,255,255,0.25)" : "#e2e8f0",
              color: activeTab === "disputes" ? "white" : "#475569",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "bold",
            }}
          >
            {disputes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            padding: "12px 20px",
            backgroundColor: activeTab === "profile" ? brandGreen : "white",
            color: activeTab === "profile" ? "white" : "#475569",
            border: activeTab === "profile" ? `1px solid ${brandGreen}` : "1px solid #cbd5e1",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "profile" ? "0 4px 6px rgba(0, 122, 51, 0.15)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          👤 Profile Settings
        </button>
        <button
          onClick={() => setActiveTab("support")}
          style={{
            padding: "12px 20px",
            backgroundColor: activeTab === "support" ? brandGreen : "white",
            color: activeTab === "support" ? "white" : "#475569",
            border: activeTab === "support" ? `1px solid ${brandGreen}` : "1px solid #cbd5e1",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "support" ? "0 4px 6px rgba(0, 122, 51, 0.15)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ℹ️ Help & Support
        </button>
      </div>

      {/* VEHICLES SECTION */}
      {activeTab === "vehicles" && (
        <div
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ margin: 0, color: "#333" }}>Your Registered Vehicles</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: "10px 15px",
              backgroundColor: brandGreen,
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {showAddForm ? "Cancel" : "+ Add New Vehicle"}
          </button>
        </div>
        {showAddForm && (
          <div
            style={{
              marginBottom: "20px",
              padding: "20px",
              border: `2px solid ${brandGreen}`,
              borderRadius: "10px",
              backgroundColor: "#e6f4ea",
            }}
          >
            <AddVehicle
              onVehicleAdded={() => {
                fetchVehicles();
                setShowAddForm(false);
              }}
            />
          </div>
        )}
        {vehicles.length === 0 ? (
          <p style={{ color: "#666" }}>
            No vehicles registered to this license yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
            }}
          >
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                style={{
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fafafa",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 5px 0",
                    color: "#333",
                    letterSpacing: "2px",
                  }}
                >
                  {vehicle.plate_number}
                </h2>
                <p style={{ margin: 0, color: "#666" }}>
                  {vehicle.vehicle_model || "Unknown Model"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* TRAFFIC RECORDS / TICKETS */}
      {activeTab === "fines" && (
        <div
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <h3 style={{ color: "#333", margin: "0 0 20px 0" }}>Your Traffic Records</h3>
      {isLoading ? (
        <p>Loading your records...</p>
      ) : tickets.length === 0 ? (
        <p style={{ color: "#666" }}>
          No records found linked to your Driver's License.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                borderLeft: `5px solid ${ticket.payment_status === "Paid" ? brandGreen : (ticket.payment_status === "Cancelled" ? "#64748b" : brandRed)}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>
                  Ref: {ticket.reference_id}
                </h4>
                <p
                  style={{
                    margin: "0 0 5px 0",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  Date: {new Date(ticket.date_time).toLocaleDateString()}
                </p>
                <p
                  style={{
                    margin: "0 0 10px 0",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  <strong>Location:</strong> {ticket.location}
                </p>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #e2e8f0",
                    display: "inline-block",
                    minWidth: "80%",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      color: "#333",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    Offence:{" "}
                    {ticket.offence_name || `Violation #${ticket.offence}`}
                  </p>
                  {ticket.offence_description && (
                    <p
                      style={{
                        margin: 0,
                        color: "#64748b",
                        fontSize: "12px",
                        fontStyle: "italic",
                      }}
                    >
                      "{ticket.offence_description}"
                    </p>
                  )}
                </div>

                {(ticket.evidence_image || ticket.evidence_video) && (
                  <div style={{ marginTop: "12px" }}>
                    <button
                      onClick={() => setEvidenceData(ticket)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#e2e8f0",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      📸 View Evidence
                    </button>
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right", marginLeft: "20px" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
                  ₦{parseFloat(ticket.amount_due).toLocaleString()}
                </h3>
                {ticket.payment_status === "Paid" ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#e6f4ea",
                        color: brandGreen,
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      Cleared
                    </span>
                    <button
                      onClick={() =>
                        navigate("/receipt", { state: { ticket } })
                      }
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#334155",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      🖨️ Download Receipt
                    </button>
                  </div>
                ) : ticket.payment_status === "Cancelled" ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#f1f5f9",
                        color: "#64748b",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      Waived (Appeal Approved)
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => openPaymentModal(ticket)}
                    disabled={
                      isProcessingPayment && ticketToPay?.id === ticket.id
                    }
                    style={{
                      padding: "8px 20px",
                      backgroundColor: brandRed,
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor:
                        isProcessingPayment && ticketToPay?.id === ticket.id
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: "bold",
                      opacity:
                        isProcessingPayment && ticketToPay?.id === ticket.id
                          ? 0.6
                          : 1,
                    }}
                  >
                    {isProcessingPayment && ticketToPay?.id === ticket.id ? (
                      <span
                        style={{ display: "inline-flex", alignItems: "center" }}
                      >
                        <Spinner size={14} /> Processing
                      </span>
                    ) : (
                      "Pay Now"
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      )}

      {/* REPORTS & ANALYTICS SECTION */}
      {activeTab === "analytics" && (
        <div
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <div style={{ borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "25px" }}>
            <h3 style={{ margin: 0, color: "#333", fontSize: "20px" }}>My Violation Reports & Analytics</h3>
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              Visual insights into your driving records, settled fines, and historical traffic offences.
            </p>
          </div>

          {tickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: brandGreen, fontWeight: "bold", fontSize: "18px", margin: 0 }}>🎉 Clean Record!</p>
              <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>You have no violations or citations registered. Keep up the excellent driving!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", alignItems: "start" }}>
              {/* Left Column: Settlement Rate & Summary */}
              <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "25px" }}>
                  {/* Progress Circle Mockup using CSS radial-gradient */}
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      background: `conic-gradient(${brandGreen} ${tickets.length ? Math.round((tickets.filter(t => t.payment_status === "Paid" || t.payment_status === "Cancelled").length / tickets.length) * 100) * 3.6 : 0}deg, #e2e8f0 0deg)`,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ width: "95px", height: "95px", borderRadius: "50%", backgroundColor: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                      <span style={{ fontSize: "22px", fontWeight: "bold", color: "#333" }}>
                        {tickets.length ? Math.round((tickets.filter(t => t.payment_status === "Paid" || t.payment_status === "Cancelled").length / tickets.length) * 100) : 0}%
                      </span>
                      <span style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", fontWeight: "bold" }}>Cleared</span>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "16px", fontWeight: "bold" }}>Settlement Rate</h4>
                    <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "13px" }}>
                      Total Citations: <strong>{tickets.length}</strong>
                    </p>
                    <p style={{ margin: "0 0 5px 0", color: brandGreen, fontSize: "13px" }}>
                      Paid & Settled: <strong>{tickets.filter(t => t.payment_status === "Paid").length}</strong>
                    </p>
                    <p style={{ margin: "0 0 5px 0", color: "#64748b", fontSize: "13px" }}>
                      Waived (Disputed): <strong>{tickets.filter(t => t.payment_status === "Cancelled").length}</strong>
                    </p>
                    <p style={{ margin: 0, color: brandRed, fontSize: "13px" }}>
                      Pending Owed: <strong>{tickets.filter(t => t.payment_status !== "Paid" && t.payment_status !== "Cancelled").length}</strong> (₦{totalOwed.toLocaleString()})
                    </p>
                  </div>
                </div>

                {/* Offence breakdown using styled CSS bars */}
                <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 15px 0", color: "#333", fontSize: "15px", fontWeight: "bold" }}>Offence Breakdown</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {Object.keys(tickets.reduce((counts, ticket) => {
                      const name = ticket.offence_name || `Violation #${ticket.offence}`;
                      counts[name] = (counts[name] || 0) + 1;
                      return counts;
                    }, {})).map(name => ({
                      name,
                      count: tickets.reduce((counts, ticket) => {
                        const n = ticket.offence_name || `Violation #${ticket.offence}`;
                        counts[n] = (counts[n] || 0) + 1;
                        return counts;
                      }, {})[name]
                    })).sort((a, b) => b.count - a.count).map((item, idx) => {
                      const percentage = Math.round((item.count / tickets.length) * 100);
                      return (
                        <div key={idx}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "4px" }}>
                            <span style={{ fontWeight: "500", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "80%" }}>{item.name}</span>
                            <span style={{ fontWeight: "bold", color: "#333" }}>{item.count} ({percentage}%)</span>
                          </div>
                          <div style={{ width: "100%", height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${percentage}%`, height: "100%", backgroundColor: brandRed, borderRadius: "4px" }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Settlement Timeline */}
              <div style={{ backgroundColor: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 15px 0", color: "#333", fontSize: "15px", fontWeight: "bold" }}>Settlement Timeline</h4>
                {tickets.filter(t => t.payment_status === "Paid").length === 0 ? (
                  <p style={{ color: "#666", fontSize: "13px", margin: 0, fontStyle: "italic" }}>No payments completed yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px", position: "relative", borderLeft: "2px solid #cbd5e1", paddingLeft: "15px", marginLeft: "10px" }}>
                    {tickets.filter(t => t.payment_status === "Paid").sort((a, b) => new Date(b.date_time) - new Date(a.date_time)).map((t, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        {/* Timeline node */}
                        <div style={{ position: "absolute", left: "-21px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: brandGreen, border: "2px solid white" }}></div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <div>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#333" }}>{t.offence_name}</p>
                            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#666" }}>Ref: {t.reference_id} | Location: {t.location}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "13px", fontWeight: "bold", color: brandGreen }}>₦{parseFloat(t.amount_due).toLocaleString()}</span>
                            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#666" }}>{new Date(t.date_time).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TICKET DISPUTES / APPEALS SECTION */}
      {activeTab === "disputes" && (
        <div
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "25px" }}>
            <div>
              <h3 style={{ margin: 0, color: "#333", fontSize: "20px" }}>Violation Disputes & Appeals</h3>
              <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
                Submit appeals against citation tickets issued in error or view pending administrative reviews.
              </p>
            </div>
            <button
              onClick={() => setShowDisputeForm(!showDisputeForm)}
              style={{
                padding: "10px 20px",
                backgroundColor: showDisputeForm ? "#555" : brandGreen,
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {showDisputeForm ? "Close Form" : "+ File New Dispute"}
            </button>
          </div>

          {/* DISPUTE APPEAL FORM */}
          {showDisputeForm && (
            <form onSubmit={submitDispute} style={{ backgroundColor: "#f8fafc", padding: "25px", borderRadius: "8px", border: `2px solid ${brandGreen}`, marginBottom: "30px" }}>
              <h4 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "16px", fontWeight: "bold" }}>Submit Dispute Appeal Form</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>Select Outstanding Citation</label>
                  <select
                    value={disputeForm.booking}
                    onChange={(e) => setDisputeForm({ ...disputeForm, booking: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "white" }}
                  >
                    <option value="">-- Choose Citation Reference --</option>
                    {tickets.filter(t => t.payment_status !== "Paid" && t.payment_status !== "Cancelled").map(ticket => (
                      <option key={ticket.id} value={ticket.id}>
                        {ticket.reference_id} - {ticket.offence_name} (₦{parseFloat(ticket.amount_due).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>Dispute Reason</label>
                  <select
                    value={disputeForm.reason}
                    onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "white" }}
                  >
                    <option value="Wrong Offence">Wrong Offence Code</option>
                    <option value="Plate Mismatch">Plate Number Mismatch</option>
                    <option value="Medical/Emergency">Medical Emergency Scenario</option>
                    <option value="Officer Issue">Officer Discrepancy</option>
                    <option value="Other">Other Reasons</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>Detailed Case Explanation</label>
                <textarea
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  required
                  placeholder="Provide a clear description of the facts, circumstances, or evidence supporting your appeal..."
                  rows="4"
                  style={{ width: "100%", padding: "12px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "14px", fontFamily: "inherit" }}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmittingDispute}
                style={{
                  padding: "12px 25px",
                  backgroundColor: brandGreen,
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: isSubmittingDispute ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontSize: "14px",
                  opacity: isSubmittingDispute ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                {isSubmittingDispute ? "Submitting Dispute..." : "Submit Case Appeal"}
              </button>
            </form>
          )}

          {/* DISPUTES LIST TABLE */}
          {disputesLoading ? (
            <p>Loading your disputes...</p>
          ) : disputesError ? (
            <p style={{ color: brandRed }}>{disputesError}</p>
          ) : disputes.length === 0 ? (
            <p style={{ color: "#666", fontSize: "14px", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
              No disputes or appeals registered yet.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#475569" }}>Dispute ID</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#475569" }}>Ticket Ref</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#475569" }}>Reason</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#475569" }}>Submission Date</th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "#475569" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#475569" }}>Review Details</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "15px 12px", fontSize: "14px", fontWeight: "bold", color: "#333" }}>#DISP-{dispute.id}</td>
                      <td style={{ padding: "15px 12px", fontSize: "14px", color: "#475569" }}>{dispute.booking_reference}</td>
                      <td style={{ padding: "15px 12px", fontSize: "14px", color: "#333", fontWeight: "500" }}>{dispute.reason}</td>
                      <td style={{ padding: "15px 12px", fontSize: "13px", color: "#666" }}>{new Date(dispute.submitted_at).toLocaleDateString()}</td>
                      <td style={{ padding: "15px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            backgroundColor: dispute.status === 'Approved' ? "#e6f4ea" : dispute.status === 'Rejected' ? "#fce8e6" : "#fef3c7",
                            color: dispute.status === 'Approved' ? brandGreen : dispute.status === 'Rejected' ? brandRed : "#b45309",
                            padding: "4px 10px",
                            borderRadius: "15px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            display: "inline-block"
                          }}
                        >
                          {dispute.status === 'Approved' ? 'Approved' : dispute.status === 'Rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: "15px 12px", fontSize: "13px", color: "#475569", fontStyle: "italic", maxWidth: "250px" }}>
                        {dispute.status === 'Pending' ? (
                          <span style={{ color: "#666" }}>Awaiting administrative review...</span>
                        ) : (
                          <div>
                            <strong>Reviewer Comments:</strong> {dispute.review_comments || "None provided."}<br />
                            <small style={{ color: "#999" }}>Reviewed on: {new Date(dispute.reviewed_at).toLocaleDateString()}</small>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CITIZEN PROFILE & PASSWORD SETTINGS */}
      {activeTab === "profile" && (
        <div
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <div style={{ borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "25px" }}>
            <h3 style={{ margin: 0, color: "#333", fontSize: "20px" }}>Profile & Account Settings</h3>
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              Manage your personal contact details synced from the road safety registry and update your password securely.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", alignItems: "start" }}>
            {/* PROFILE CONTACT UPDATE */}
            <div style={{ backgroundColor: "#fafafa", padding: "25px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 15px 0", color: brandGreen, fontSize: "16px", fontWeight: "bold" }}>Profile Information</h4>
              {profileLoading ? (
                <p>Loading your profile details...</p>
              ) : profileError ? (
                <p style={{ color: brandRed }}>{profileError}</p>
              ) : (
                <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>Citizen / Driver Name</label>
                    <input
                      type="text"
                      value={profileData.driver_name || ""}
                      disabled
                      style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#e2e8f0", color: "#475569", cursor: "not-allowed" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>Driver's License Number</label>
                    <input
                      type="text"
                      value={profileData.driver_license_number || ""}
                      disabled
                      style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#e2e8f0", color: "#475569", cursor: "not-allowed" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>Primary Phone Number</label>
                    <input
                      type="text"
                      value={profileData.phone_number || ""}
                      onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                      required
                      style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "white" }}
                    />
                    <small style={{ color: "#64748b" }}>Must be formatted with prefix (e.g. +23480... or 080...)</small>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>Email Address</label>
                    <input
                      type="email"
                      value={profileData.email || ""}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      required
                      style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "white" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    style={{
                      padding: "12px",
                      backgroundColor: brandGreen,
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: isSavingProfile ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      fontSize: "14px",
                      opacity: isSavingProfile ? 0.6 : 1,
                      marginTop: "10px"
                    }}
                  >
                    {isSavingProfile ? "Saving Profile..." : "Update Profile Contacts"}
                  </button>
                </form>
              )}
            </div>

            {/* PASSWORD UPDATE */}
            <div style={{ backgroundColor: "#fafafa", padding: "25px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 15px 0", color: brandRed, fontSize: "16px", fontWeight: "bold" }}>Update Password</h4>
              <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {passwordSuccess && (
                  <div style={{ padding: "10px", backgroundColor: "#e6f4ea", color: brandGreen, fontSize: "13px", fontWeight: "bold", borderRadius: "5px", border: `1px solid ${brandGreen}` }}>
                    {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div style={{ padding: "10px", backgroundColor: "#fce8e6", color: brandRed, fontSize: "13px", fontWeight: "bold", borderRadius: "5px", border: `1px solid ${brandRed}` }}>
                    {passwordError}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    required
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "white" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    required
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "white" }}
                  />
                  <small style={{ color: "#64748b" }}>Minimum 6 characters</small>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#475569", marginBottom: "6px" }}>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    required
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "white" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  style={{
                    padding: "12px",
                    backgroundColor: brandRed,
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: isChangingPassword ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                    opacity: isChangingPassword ? 0.6 : 1,
                    marginTop: "10px"
                  }}
                >
                  {isChangingPassword ? "Updating..." : "Change Account Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HELP & SUPPORT FAQ SECTION */}
      {activeTab === "support" && (
        <div
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <div style={{ borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "25px" }}>
            <h3 style={{ margin: 0, color: "#333", fontSize: "20px" }}>Support & Citizen Helpdesk</h3>
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              Find quick answers to common questions or contact the Oyo State Road Traffic Management Authority.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", alignItems: "start" }}>
            {/* FAQs */}
            <div>
              <h4 style={{ margin: "0 0 15px 0", color: brandGreen, fontSize: "16px", borderBottom: `2px solid ${brandGreen}`, paddingBottom: "5px", display: "inline-block" }}>
                Frequently Asked Questions
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {[
                  {
                    q: "How do I pay my outstanding traffic fine?",
                    a: "You can pay directly via this self-service portal by clicking 'Pay Now' next to any pending ticket under the 'Traffic Offences & Fines' tab. Payments are securely processed via Paystack using cards, bank transfers, or USSD."
                  },
                  {
                    q: "Can I register multiple vehicles to my account?",
                    a: "Yes. In the 'My Registered Vehicles' tab, click '+ Add New Vehicle' and input the plate number and vehicle model. If the plate already exists in the system, it will automatically connect to your account."
                  },
                  {
                    q: "What should I do if I want to dispute a booking?",
                    a: "If you believe a ticket was issued in error, you can visit the OYRTMA Head Office with your booking reference ID. You can also view photographic or video evidence directly in the portal by clicking 'View Evidence' on the ticket."
                  },
                  {
                    q: "How long do I have to clear a pending violation ticket?",
                    a: "CITATIONS must be cleared within 7 working days from the date of issue to avoid additional vehicle impoundment fees or legal administrative actions."
                  }
                ].map((faq, idx) => (
                  <div key={idx} style={{ padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px", borderLeft: `4px solid ${brandGreen}` }}>
                    <h5 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "14px", fontWeight: "bold" }}>{faq.q}</h5>
                    <p style={{ margin: 0, color: "#475569", fontSize: "13px", lineHeight: "1.5" }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DIRECTORY & HELPLINE */}
            <div style={{ backgroundColor: "#fafafa", padding: "25px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "16px", fontWeight: "bold" }}>
                OYRTMA Official Directory
              </h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h5 style={{ margin: "0 0 5px 0", color: "#475569", fontSize: "13px", fontWeight: "bold", textTransform: "uppercase" }}>Headquarters</h5>
                  <p style={{ margin: 0, color: "#333", fontSize: "14px", lineHeight: "1.4" }}>
                    OYRTMA Administrative Complex,<br />
                    Sango-Olorunsogo Road, Ibadan,<br />
                    Oyo State, Nigeria.
                  </p>
                </div>

                <div>
                  <h5 style={{ margin: "0 0 5px 0", color: "#475569", fontSize: "13px", fontWeight: "bold", textTransform: "uppercase" }}>24/7 Citizen Helplines</h5>
                  <p style={{ margin: "0 0 4px 0", color: brandGreen, fontSize: "15px", fontWeight: "bold" }}>📞 +234 803 123 4567</p>
                  <p style={{ margin: 0, color: brandGreen, fontSize: "15px", fontWeight: "bold" }}>📞 +234 812 987 6543</p>
                </div>

                <div>
                  <h5 style={{ margin: "0 0 5px 0", color: "#475569", fontSize: "13px", fontWeight: "bold", textTransform: "uppercase" }}>Support Email</h5>
                  <p style={{ margin: 0, color: "#333", fontSize: "14px" }}>
                    <a href="mailto:support@oyrtma.oy.gov.ng" style={{ color: brandGreen, textDecoration: "none", fontWeight: "bold" }}>
                      support@oyrtma.oy.gov.ng
                    </a>
                  </p>
                </div>

                <div style={{ backgroundColor: "#e2e8f0", height: "1px", margin: "5px 0" }}></div>

                <div style={{ textAlign: "center", padding: "10px" }}>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "12px", fontStyle: "italic" }}>
                    "Ensuring safety, free flow of traffic and sanity on Oyo State roads."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EVIDENCE MODAL --- */}
      {evidenceData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
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
              padding: "20px",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ margin: 0, color: "#333" }}>Violation Evidence</h3>
              <button
                onClick={() => setEvidenceData(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                &times;
              </button>
            </div>
            <div
              style={{
                textAlign: "center",
                maxHeight: "60vh",
                overflowY: "auto",
                padding: "10px",
              }}
            >
              {evidenceData.evidence_image && (
                <div style={{ marginBottom: "20px" }}>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      color: "#64748b",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    Photographic Evidence
                  </p>
                  <img
                    src={evidenceData.evidence_image}
                    alt="Traffic Violation"
                    style={{
                      width: "100%",
                      maxHeight: "350px",
                      objectFit: "contain",
                      borderRadius: "8px",
                      border: "2px solid #e2e8f0",
                    }}
                  />
                </div>
              )}
              {evidenceData.evidence_video && (
                <div style={{ marginBottom: "15px" }}>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      color: "#64748b",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    Video Evidence
                  </p>
                  <video
                    controls
                    style={{
                      width: "100%",
                      maxHeight: "350px",
                      borderRadius: "8px",
                      border: "2px solid #e2e8f0",
                      backgroundColor: "black",
                    }}
                  >
                    <source
                      src={evidenceData.evidence_video}
                      type="video/mp4"
                    />
                  </video>
                </div>
              )}
            </div>
            <button
              onClick={() => setEvidenceData(null)}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
                marginTop: "15px",
              }}
            >
              Close Evidence Viewer
            </button>
          </div>
        </div>
        
        
      )}
      {errorMessage && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000, backdropFilter: "blur(4px)" }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "400px", textAlign: "center", boxShadow: "0 5px 15px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>⚠️</div>
            <h2 style={{ color: "#333", margin: "0 0 10px 0" }}>Connection Error</h2>
            <p style={{ color: "#666", marginBottom: "25px", lineHeight: "1.5" }}>{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage("")} 
              style={{ padding: "12px", backgroundColor: "#334155", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", width: "100%" }}
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OffenderDashboard;

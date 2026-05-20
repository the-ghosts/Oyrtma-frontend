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
    fetchMyTickets();
    fetchVehicles();
    fetchPaystackConfig();
  }, []);

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
      ticket.payment_status !== "Paid"
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

      {/* VEHICLES SECTION */}
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

      {/* TRAFFIC RECORDS / TICKETS */}
      <h3 style={{ color: "#333" }}>Your Traffic Records</h3>
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
                borderLeft: `5px solid ${ticket.payment_status === "Paid" ? brandGreen : brandRed}`,
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

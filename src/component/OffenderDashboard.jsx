import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";
import AddVehicle from "./AddVehicle";
import { PaystackButton } from "react-paystack";

function OffenderDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [ticketToPay, setTicketToPay] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [lastPaymentRef, setLastPaymentRef] = useState(null);
  const [paystackPublicKey, setPaystackPublicKey] = useState(null);

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
      if (!token) {
        navigate("/offender-login");
        return;
      }
      const res = await axios.get(
        "http://127.0.0.1:8000/api/payments/config/",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPaystackPublicKey(res.data.publicKey);
      setConfig((prev) => ({ ...prev, publicKey: res.data.publicKey }));
    } catch (err) {
      console.error("Failed to fetch Paystack config:", err.message);
      if (err.response?.status === 401) {
        navigate("/offender-login");
      }
    }
  };

  const fetchMyTickets = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/offender-login");
        return;
      }
      const response = await axios.get("http://127.0.0.1:8000/api/bookings/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
      if (error.response && error.response.status === 401) {
        navigate("/offender-login");
      }
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
    console.log("🔐 Starting manual verify with:", {
      ref,
      ticket_id: ticket?.id,
    });
    if (!ref || !ticket) {
      console.log("⚠️ Missing ref or ticket");
      return false;
    }
    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No auth token");
      const endpoint = `http://127.0.0.1:8000/api/bookings/${ticket.id}/verify-payment/`;
      console.log("📤 POST to:", endpoint, "with reference:", ref);
      const verifyRes = await axios.post(
        endpoint,
        { reference: ref },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log("✅ Verify succeeded:", verifyRes.data);
      await fetchMyTickets();
      setLastPaymentRef(null);
      setTicketToPay(null);
      return true;
    } catch (error) {
      console.error("❌ Verify failed:", error.message);
      console.error("   Backend response:", error.response?.data);
      if (error.response?.status !== 401) {
        alert(
          `Verification failed: ${error.response?.data?.detail || error.message}`,
        );
      }
      return false;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaystackSuccess = async (reference) => {
    console.log("🎉 Success callback fired with reference:", reference);
    const refStr = reference.reference || reference;

    // 1. Close our custom confirmation modal ONLY AFTER payment succeeds
    setIsPaymentModalOpen(false);

    // 2. Verify with Django
    if (ticketToPay) {
      console.log("✅ Auto-verifying with Django...");
      await manualVerifyPayment(refStr, ticketToPay);
    } else {
      console.log("⚠️ Missing ticket context");
    }
  };

  const handlePaystackClose = () => {
    console.log("🔴 Paystack payment window closed by user");
    // Close our custom modal if they cancel the payment
    setIsPaymentModalOpen(false);
  };
  const openPaymentModal = (ticket) => {
    // Generate the reference immediately
    const newRef = `OYRTMA-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    setTicketToPay(ticket);
    setLastPaymentRef(newRef);
    setIsPaymentModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/offender-login");
  };

  const totalOwed = tickets.reduce((sum, ticket) => {
    if (ticket.payment_status !== "Paid") {
      return sum + parseFloat(ticket.amount_due || 0);
    }
    return sum;
  }, 0);

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
      {lastPaymentRef && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0b6e4f",
            color: "white",
            padding: "8px 14px",
            borderRadius: 6,
            zIndex: 2000,
          }}
        >
          Payment reference: <strong>{lastPaymentRef}</strong>
        </div>
      )}

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

      <h3 style={{ color: "#333" }}>Your Traffic Records</h3>
      {isLoading ? (
        <p>Loading your records...</p>
      ) : tickets.length === 0 ? (
        <p style={{ color: "#666" }}>
          No records found linked to your Driver''s License.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                borderLeft: `5px solid ${ticket.payment_status === "Paid" ? brandGreen : brandRed}`,
              }}
            >
              <div>
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
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  <strong>Location:</strong> {ticket.location}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>
                  {parseFloat(ticket.amount_due).toLocaleString()}
                </h3>
                {ticket.payment_status === "Paid" ? (
                  <span
                    style={{
                      backgroundColor: "#e6f4ea",
                      color: brandGreen,
                      padding: "5px 10px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    Cleared
                  </span>
                ) : (
                  <button
                    onClick={() => openPaymentModal(ticket)}
                    disabled={
                      isProcessingPayment &&
                      ticketToPay &&
                      ticketToPay.id === ticket.id
                    }
                    style={{
                      padding: "8px 15px",
                      backgroundColor: brandRed,
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor:
                        isProcessingPayment &&
                        ticketToPay &&
                        ticketToPay.id === ticket.id
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: "bold",
                      opacity:
                        isProcessingPayment &&
                        ticketToPay &&
                        ticketToPay.id === ticket.id
                          ? 0.6
                          : 1,
                    }}
                  >
                    {isProcessingPayment &&
                    ticketToPay &&
                    ticketToPay.id === ticket.id ? (
                      <span
                        style={{ display: "inline-flex", alignItems: "center" }}
                      >
                        <Spinner size={14} /> Processing...
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

      {isPaymentModalOpen && ticketToPay && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            <h2 style={{ color: "#333", marginTop: 0 }}>Confirm Payment</h2>
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #eee",
              }}
            >
              <p style={{ margin: "0 0 10px 0", color: "#555" }}>
                You are about to clear ticket:
              </p>
              <h3 style={{ margin: "0 0 10px 0", color: "#007A33" }}>
                {ticketToPay.reference_id || ticketToPay.reference_code}
              </h3>
              <h1 style={{ margin: 0, color: "#DA291C" }}>
                {parseFloat(ticketToPay.amount_due).toLocaleString()}
              </h1>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "15px",
              }}
            >
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#e9ecef",
                  color: "#333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Cancel
              </button>
              {paystackPublicKey && lastPaymentRef && ticketToPay && (
                <PaystackButton
                  email="driver@test.com"
                  amount={Math.round(parseFloat(ticketToPay.amount_due) * 100)}
                  reference={lastPaymentRef}
                  publicKey={paystackPublicKey}
                  text={isProcessingPayment ? "Processing..." : "Pay with Paystack"}
                  onSuccess={(reference) => handlePaystackSuccess(reference)}
                  onClose={handlePaystackClose}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#007A33",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: isProcessingPayment ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                  disabled={isProcessingPayment}
                />
              )}
            </div>
            <div style={{ marginTop: "15px", fontSize: "12px", color: "#888" }}>
              Secured by Paystack
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OffenderDashboard;

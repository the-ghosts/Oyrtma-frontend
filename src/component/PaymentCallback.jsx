import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

function PaymentCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("Verifying payment with OYRTMA servers...");

  useEffect(() => {
    const verifyPayment = async () => {
      // 1. Grab the reference from the URL that Paystack sent us back to
      const queryParams = new URLSearchParams(location.search);
      const reference = queryParams.get("reference");

      if (!reference) {
        setStatus("Invalid payment redirect. No reference found.");
        setTimeout(() => navigate("/offender-dashboard"), 3000);
        return;
      }

      // 2. Extract the ticket ID from the reference (Format: OYRTMA-{ticket_id}-{timestamp})
      const ticketId = reference.split("-")[1];

      try {
        const token = localStorage.getItem("access_token");
        // 3. Tell Django to officially verify and clear the ticket
        await axios.post(
          `http://127.0.0.1:8000/api/bookings/${ticketId}/verify-payment/`,
          { reference: reference },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setStatus("Payment Successful! Ticket Cleared. Redirecting...");
        setTimeout(() => navigate("/offender-dashboard"), 2000);

      } catch (error) {
        setStatus("Payment verification failed. Please contact support.");
        setTimeout(() => navigate("/offender-dashboard"), 4000);
      }
    };

    verifyPayment();
  }, [location, navigate]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f4f9", fontFamily: "Arial" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", textAlign: "center" }}>
        <h2 style={{ color: "#333" }}>{status}</h2>
      </div>
    </div>
  );
}

export default PaymentCallback;
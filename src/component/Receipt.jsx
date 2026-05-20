import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import oyrtmaLogo from "../assets/OYRTMA.png";

function Receipt() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const ticket = state?.ticket;

  useEffect(() => {
    if (!ticket) navigate("/offender-dashboard");
    else setTimeout(() => window.print(), 500); // Auto-open print dialog
  }, [ticket, navigate]);

  if (!ticket) return null;

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "Arial, sans-serif", backgroundColor: "white" }}>
      {/* Hide back button when printing */}
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      
      <button className="no-print" onClick={() => navigate(-1)} style={{ marginBottom: "20px", padding: "10px", cursor: "pointer" }}>&larr; Back to Dashboard</button>

      <div style={{ border: "1px solid #ccc", padding: "40px", borderRadius: "8px", position: "relative" }}>
        {/* Paid Watermark */}
        <div style={{ position: "absolute", top: "30%", left: "20%", fontSize: "120px", color: "rgba(0, 122, 51, 0.1)", transform: "rotate(-30deg)", fontWeight: "bold", zIndex: 0, pointerEvents: "none" }}>PAID</div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #007A33", paddingBottom: "20px", marginBottom: "20px", position: "relative", zIndex: 1 }}>
          <img src={oyrtmaLogo} alt="Logo" style={{ width: "80px" }} />
          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: 0, color: "#333" }}>OFFICIAL RECEIPT</h1>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}>Ref: {ticket.reference_id}</p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", position: "relative", zIndex: 1 }}>
          <div>
            <h4 style={{ margin: "0 0 5px 0", color: "#666" }}>Billed To:</h4>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "18px" }}>Driver License: {ticket.offender_license || "N/A"}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h4 style={{ margin: "0 0 5px 0", color: "#666" }}>Payment Date:</h4>
            <p style={{ margin: 0, fontWeight: "bold" }}>{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", position: "relative", zIndex: 1 }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Offence Description</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Location</th>
              <th style={{ padding: "12px", textAlign: "right" }}>Amount Settled</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "15px 12px", borderBottom: "1px solid #eee" }}>{ticket.offence_name}</td>
              <td style={{ padding: "15px 12px", borderBottom: "1px solid #eee" }}>{ticket.location}</td>
              <td style={{ padding: "15px 12px", borderBottom: "1px solid #eee", textAlign: "right", fontWeight: "bold" }}>₦{parseFloat(ticket.amount_due).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: "center", color: "#007A33", fontWeight: "bold", position: "relative", zIndex: 1 }}>
          This is an electronically generated receipt. No physical signature is required.
        </div>
      </div>
    </div>
  );
}
export default Receipt;
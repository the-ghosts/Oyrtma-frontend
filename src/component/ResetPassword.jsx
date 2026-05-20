import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";

function ResetPassword() {
  const { uidb64, token } = useParams(); // Grabs the secret codes from the URL
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://127.0.0.1:8000/api/password-reset-confirm/${uidb64}/${token}/`, { new_password: newPassword });
      setMessage("Password successfully reset! Redirecting to login...");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password. Link may be expired.");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f4f9" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <img src={oyrtmaLogo} alt="Logo" style={{ width: "80px", marginBottom: "15px" }} />
        <h2 style={{ color: "#333", margin: "0 0 20px 0" }}>Create New Password</h2>
        
        {message && <div style={{ padding: "10px", backgroundColor: "#dcfce7", color: "#007A33", marginBottom: "15px", borderRadius: "5px" }}>{message}</div>}
        {error && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#DA291C", marginBottom: "15px", borderRadius: "5px" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ padding: "12px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "5px", width: "100%", boxSizing: "border-box" }} />
          <button type="submit" style={{ padding: "12px", backgroundColor: "#007A33", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Save New Password</button>
        </form>
      </div>
    </div>
  );
}
export default ResetPassword;
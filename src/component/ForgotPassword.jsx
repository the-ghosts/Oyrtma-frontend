import { useState } from "react";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); setMessage("");
    try {
      await axios.post("http://127.0.0.1:8000/api/password-reset/", { email });
      setMessage("Success! Check your email inbox for the reset link.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f4f9" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <img src={oyrtmaLogo} alt="Logo" style={{ width: "80px", marginBottom: "15px" }} />
        <h2 style={{ color: "#333", margin: "0 0 10px 0" }}>Recover Password</h2>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>Enter your registered email address and we will send you a secure link to reset your password.</p>
        
        {message && <div style={{ padding: "10px", backgroundColor: "#dcfce7", color: "#007A33", marginBottom: "15px", borderRadius: "5px" }}>{message}</div>}
        {error && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#DA291C", marginBottom: "15px", borderRadius: "5px" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "12px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "5px", width: "100%", boxSizing: "border-box" }} />
          <button type="submit" disabled={isLoading} style={{ padding: "12px", backgroundColor: "#007A33", color: "white", border: "none", borderRadius: "5px", cursor: isLoading ? "wait" : "pointer", fontWeight: "bold" }}>
            {isLoading ? "Sending Link..." : "Send Reset Link"}
          </button>
        </form>
        <a href="/" style={{ display: "block", marginTop: "20px", color: "#0056b3", textDecoration: "none", fontSize: "14px" }}>&larr; Back to Login</a>
      </div>
    </div>
  );
}
export default ForgotPassword;
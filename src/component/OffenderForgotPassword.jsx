import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";

function OffenderForgotPassword() {
  const navigate = useNavigate();
  const [driverLicense, setDriverLicense] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/citizen-password-reset/", { 
        driver_license: driverLicense,
        phone_number: phoneNumber
      });

      // If successful, the backend gives us the keys to unlock the reset screen!
      const { uidb64, token } = response.data;
      navigate(`/reset-password/${uidb64}/${token}`); // We reuse your existing ResetPassword screen!

    } catch (err) {
      setError(err.response?.data?.error || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f4f9" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px", textAlign: "center" }}>
        <img src={oyrtmaLogo} alt="Logo" style={{ width: "80px", marginBottom: "15px" }} />
        <h2 style={{ color: "#333", margin: "0 0 10px 0" }}>Driver Account Recovery</h2>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>Enter your registered details to verify your identity and reset your password.</p>
        
        {error && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#DA291C", marginBottom: "15px", borderRadius: "5px" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input 
            type="text" 
            placeholder="Driver's License Number" 
            value={driverLicense} 
            onChange={(e) => setDriverLicense(e.target.value)} 
            required 
            style={{ padding: "12px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "5px", width: "100%", boxSizing: "border-box" }} 
          />
          <input 
            type="text" 
            placeholder="Registered Phone Number" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)} 
            required 
            style={{ padding: "12px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "5px", width: "100%", boxSizing: "border-box" }} 
          />
          <button 
            type="submit" 
            disabled={isLoading} 
            style={{ padding: "12px", backgroundColor: "#007A33", color: "white", border: "none", borderRadius: "5px", cursor: isLoading ? "wait" : "pointer", fontWeight: "bold" }}
          >
            {isLoading ? "Verifying Identity..." : "Verify & Reset Password"}
          </button>
        </form>
        <a href="/offender-login" style={{ display: "block", marginTop: "20px", color: "#0056b3", textDecoration: "none", fontSize: "14px" }}>&larr; Back to Login</a>
      </div>
    </div>
  );
}

export default OffenderForgotPassword;
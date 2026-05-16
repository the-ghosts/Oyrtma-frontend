import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";

function OffenderLogin() {
  const navigate = useNavigate();
  const brandGreen = "#007A33";
  const brandRed = "#DA291C";

  const [driverLicense, setDriverLicense] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/token/", {
        username: driverLicense,
        password: password,
      });

      if (
        response.data.user_role === "Officer" ||
        response.data.user_role === "Admin"
      ) {
        setError(
          "Access Restricted: OYRTMA Personnel must use the Official Portal.",
        );
        setIsLoading(false);
        return;
      }

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      
      console.log("✅ Login successful!");
      console.log("   - access_token saved:", response.data.access.substring(0, 30) + "...");
      console.log("   - refresh_token saved:", response.data.refresh.substring(0, 30) + "...");
      console.log("   - localStorage keys after login:", Object.keys(localStorage));

      // Check if there's a pending Paystack reference from a previous failed verify
      // (stored by OffenderDashboard when session expired during verify)
      const pendingRef = sessionStorage.getItem("pendingPaystackRef");
      if (pendingRef) {
        console.log("Pending Paystack reference found. Will retry verify after dashboard loads.");
      }

      navigate("/offender-dashboard");
    } catch (err) {
      setError("Invalid License Number or Password.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    boxSizing: "border-box",
    width: "100%",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f4f4f9",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <img
          src={oyrtmaLogo}
          alt="OYRTMA Logo"
          style={{ width: "100px", marginBottom: "10px" }}
        />
        <h2 style={{ color: "#333", marginBottom: "5px" }}>Citizen Portal</h2>
        <p style={{ color: "#666", marginBottom: "25px", fontSize: "14px" }}>
          Log in to view and pay your traffic fines
        </p>

        <form
          onSubmit={handleLogin}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            width: "100%",
          }}
        >
          <input
            type="text"
            placeholder="Driver's License Number"
            value={driverLicense}
            onChange={(e) => setDriverLicense(e.target.value)}
            disabled={isLoading}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "12px",
              fontSize: "16px",
              backgroundColor: isLoading ? "#80bd99" : brandGreen,
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: isLoading ? "wait" : "pointer",
              fontWeight: "bold",
              transition: "background-color 0.3s",
              marginTop: "10px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {isLoading ? "Authenticating..." : "Log In Securely"}
          </button>
        </form>

        {error && (
          <p style={{ color: brandRed, fontWeight: "bold", marginTop: "15px" }}>
            {error}
          </p>
        )}

        <p style={{ marginTop: "25px", fontSize: "15px", color: "#444" }}>
          First time here?{" "}
          <span
            onClick={() => navigate("/offender-signup")}
            style={{
              color: brandGreen,
              cursor: "pointer",
              fontWeight: "bold",
              textDecoration: "underline",
            }}
          >
            Register your License
          </span>
        </p>

        <p style={{ marginTop: "15px", fontSize: "12px", color: "#888" }}>
          Return to{" "}
          <span
            onClick={() => navigate("/")}
            style={{
              color: "#0056b3",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Official Officer Portal
          </span>
        </p>
      </div>
    </div>
  );
}

export default OffenderLogin;

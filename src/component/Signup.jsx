import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";

function Signup() {
  const navigate = useNavigate();
  const brandGreen = "#007A33";
  const brandRed = "#DA291C";

  const [staffId, setStaffId] = useState("");
  const [rank, setRank] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await axios.post("http://127.0.0.1:8000/api/register/", {
        username: staffId,
        password: password,
        first_name: firstName,
        last_name: `${rank} ${lastName}`,
      });
      setIsSuccess(true);
    } catch (err) {
      if (err.response && err.response.data.username) {
        setError("This Staff ID Number is already registered in the system.");
      } else {
        setError("Failed to submit registration. Please check your details.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- CLEAN CSS VARIABLES ---
  // Adding boxSizing: 'border-box' fixes the overflow bug!
  const inputStyle = {
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    boxSizing: "border-box",
    width: "100%",
  };

  if (isSuccess) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f4f4f9",
          fontFamily: "Arial, sans-serif",
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
            style={{ width: "100px", marginBottom: "20px" }}
          />
          <h2 style={{ color: brandGreen }}>Registration Received</h2>
          <p style={{ color: "#555", lineHeight: "1.5", marginBottom: "25px" }}>
            {rank} <strong>{lastName}</strong>, your official details have been
            securely transmitted to Headquarters.
            <br />
            <br />
            Your account is currently{" "}
            <strong style={{ color: brandRed }}>Pending Approval</strong>. You
            will not be able to log in until the System Administrator verifies
            your Staff ID. Check back in 2-3 days.
          </p>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "12px 20px",
              backgroundColor: "#0056b3",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

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
        <h2 style={{ color: "#333", marginBottom: "5px" }}>
          Officer Registration
        </h2>
        <p style={{ color: "#666", marginBottom: "25px", fontSize: "14px" }}>
          Official Staff Verification System
        </p>

        <form
          onSubmit={handleSignup}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            {/* Using our clean inputStyle here! */}
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
              required
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
              required
              style={inputStyle}
            />
          </div>

          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            disabled={isLoading}
            required
            style={{ ...inputStyle, backgroundColor: "white" }}
          >
            <option value="">-- Select Official Rank --</option>
            <option value="Commander">Commander</option>
            <option value="Route Commander">Route Commander</option>
            <option value="Traffic Officer">Traffic Officer</option>
            <option value="Marshal">Marshal</option>
          </select>

          <input
            type="text"
            placeholder="Official Staff ID Number"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            disabled={isLoading}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Create Secure Password"
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
            {isLoading ? "Verifying..." : "Submit for Verification"}
          </button>
        </form>

        {error && (
          <p style={{ color: brandRed, fontWeight: "bold", marginTop: "15px" }}>
            {error}
          </p>
        )}

        <p style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
          Already verified?{" "}
          <span
            onClick={() => navigate("/")}
            style={{
              color: "#0056b3",
              cursor: "pointer",
              fontWeight: "bold",
              textDecoration: "underline",
            }}
          >
            Log in here
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;

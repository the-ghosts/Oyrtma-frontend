import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";

function OffenderSignup() {
  const navigate = useNavigate();
  const brandGreen = "#007A33";
  const brandRed = "#DA291C";

  // --- UPDATED STATES ---
  const [driverLicense, setDriverLicense] = useState(""); // This is now our username!
  const [plateNumber, setPlateNumber] = useState(""); // New field!
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await axios.post("http://127.0.0.1:8000/api/citizen-register/", {
        username: driverLicense, // Driver License becomes the login username
        plate_number: plateNumber, // Send the plate number to Django
        phone_number: phoneNumber,
        password: password,
        first_name: firstName,
        last_name: lastName,
      });

      setIsSuccess(true);
    } catch (err) {
      if (err.response && err.response.data.username) {
        setError("This Driver License is already registered in the system.");
      } else {
        setError("Failed to create account. Please check your details.");
      }
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
          <h2 style={{ color: brandGreen }}>Account Created!</h2>
          <p style={{ color: "#555", lineHeight: "1.5", marginBottom: "25px" }}>
            Welcome to the portal, <strong>{firstName}</strong>. Your driver
            profile has been successfully registered and is active immediately.
          </p>
          <button
            onClick={() => navigate("/offender-login")}
            style={{
              padding: "12px 20px",
              backgroundColor: brandGreen,
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            Proceed to Login
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
        <h2 style={{ color: "#333", marginBottom: "5px" }}>Citizen Portal</h2>
        <p style={{ color: "#666", marginBottom: "25px", fontSize: "14px" }}>
          Public Driver Registration
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

          {/* DRIVER LICENSE (USERNAME) */}
          <input
            type="text"
            placeholder="Driver's License Number"
            value={driverLicense}
            onChange={(e) => setDriverLicense(e.target.value)}
            disabled={isLoading}
            required
            style={inputStyle}
          />

          {/* VEHICLE PLATE NUMBER */}
          <input
            type="text"
            placeholder="Vehicle Plate Number (e.g. OY-123-AB)"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            disabled={isLoading}
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Phone Number (Required)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            style={{
              padding: "12px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              marginBottom: "15px",
              width: "100%",
              boxSizing: "border-box",
            }}
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
            {isLoading ? "Registering..." : "Create Citizen Account"}
          </button>
        </form>

        {error && (
          <p style={{ color: brandRed, fontWeight: "bold", marginTop: "15px" }}>
            {error}
          </p>
        )}

        <p style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
          Already registered?{" "}
          <span
            onClick={() => navigate("/offender-login")}
            style={{
              color: brandGreen,
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

export default OffenderSignup;

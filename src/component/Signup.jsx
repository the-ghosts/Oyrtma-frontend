import { useNavigate } from "react-router-dom";
import oyrtmaLogo from "../assets/OYRTMA.png";

function Signup() {
  const navigate = useNavigate();
  const brandGreen = "#007A33";
  const brandRed = "#DA291C";

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
          maxWidth: "450px",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <img
          src={oyrtmaLogo}
          alt="OYRTMA Logo"
          style={{ width: "100px", marginBottom: "20px" }}
        />
        <h2 style={{ color: "#333", marginBottom: "15px" }}>
          Self-Registration Disabled
        </h2>
        <div style={{ height: "4px", backgroundColor: brandRed, width: "60px", margin: "0 auto 20px" }}></div>
        <p style={{ color: "#555", lineHeight: "1.6", marginBottom: "25px", fontSize: "15px", textAlign: "justify" }}>
          In accordance with updated OYRTMA security directives, self-registration for Field Officers is disabled. 
          <br /><br />
          All official officer profiles must be registered directly by the <strong>System Administrator</strong> at Headquarters. Once registered, you will automatically receive an email containing your official login credentials.
          <br /><br />
          If you do not have your login details, please contact the IT administration desk at Headquarters.
        </p>

        <button
          onClick={() => navigate("/")}
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
            transition: "opacity 0.2s"
          }}
          onMouseOver={(e) => e.target.style.opacity = 0.9}
          onMouseOut={(e) => e.target.style.opacity = 1}
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}

export default Signup;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";

function CreateTicket() {
  const navigate = useNavigate();
  const brandGreen = "#007A33";
  const brandRed = "#DA291C";

  const [location, setLocation] = useState("");
  const [selectedOffence, setSelectedOffence] = useState("");

  const [isNewOffender, setIsNewOffender] = useState(false);

  const [selectedOffender, setSelectedOffender] = useState("");

  const [plateNumber, setPlateNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [offences, setOffences] = useState([]);
  const [offenders, setOffenders] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [evidenceImage, setEvidenceImage] = useState(null);
  const [evidenceVideo, setEvidenceVideo] = useState(null);

  useEffect(() => {
    const fetchDropdownData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return navigate("/");

      try {
        const [offencesRes, offendersRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/offences/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/api/offenders/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setOffences(offencesRes.data);
        setOffenders(offendersRes.data);
      } catch (err) {
        setError("Failed to load database records. Token may be expired.");
      }
    };
    fetchDropdownData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const token = localStorage.getItem("access_token");

    try {
      let finalOffenderId = selectedOffender;

      if (isNewOffender) {
        const offenderPayload = {
          plate_number: plateNumber,
        };

        if (driverName.trim() !== "") offenderPayload.driver_name = driverName;
        if (driverLicense.trim() !== "")
          offenderPayload.driver_license_number = driverLicense;
        if (phoneNumber.trim() !== "")
          offenderPayload.phone_number = phoneNumber;

        const offenderRes = await axios.post(
          "http://127.0.0.1:8000/api/offenders/",
          offenderPayload,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        finalOffenderId = offenderRes.data.id;
      }

      // 4. Create the actual ticket
      const formData = new FormData();
      formData.append("location", location);
      formData.append("offence", selectedOffence);
      formData.append("offender", finalOffenderId);

      if (evidenceImage) {
        formData.append("evidence_image", evidenceImage);
      }
      if (evidenceVideo) {
        formData.append("evidence_video", evidenceVideo);
      }

      await axios.post("http://127.0.0.1:8000/api/bookings/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/dashboard");
    } catch (err) {
      console.error(err.response?.data);
      // Prefer server-provided error messages when available
      const respData = err.response?.data;
      if (respData) {
        // If the server returned a dict of field errors, join them
        if (typeof respData === "object") {
          try {
            const messages = Object.entries(respData).map(
              ([k, v]) => `${k}: ${Array.isArray(v) ? v.join("; ") : v}`,
            );
            setError(messages.join(" | "));
          } catch (e) {
            setError(JSON.stringify(respData));
          }
        } else {
          setError(String(respData));
        }
      } else {
        setError(
          "Failed to issue ticket. Ensure the Plate Number is unique and not already in the system.",
        );
      }
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f4f4f9",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "white",
          padding: "15px 30px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "30px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img src={oyrtmaLogo} alt="OYRTMA Logo" style={{ height: "50px" }} />
          <h2 style={{ color: brandGreen, margin: 0 }}>Issue New Ticket</h2>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Cancel
        </button>
      </div>

      {/* Form Container */}
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: "bold" }}>Incident Location</label>
            <input
              type="text"
              placeholder="e.g. Challenge Roundabout"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              style={{
                padding: "10px",
                fontSize: "16px",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontWeight: "bold" }}>Select Offence</label>
            <select
              value={selectedOffence}
              onChange={(e) => setSelectedOffence(e.target.value)}
              required
              style={{
                padding: "10px",
                fontSize: "16px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                backgroundColor: "white",
              }}
            >
              <option value="">-- Choose an Offence --</option>
              {offences.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} (₦{off.fine_amount})
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              marginTop: "10px",
              borderTop: "2px solid #eee",
              paddingTop: "20px",
            }}
          >
            <label
              style={{
                fontWeight: "bold",
                display: "block",
                marginBottom: "10px",
              }}
            >
              {/* Photo Evidence Input */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <label style={{ fontWeight: "bold" }}>Photo Evidence</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEvidenceImage(e.target.files[0])}
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    backgroundColor: "white",
                  }}
                />
              </div>
              {/* Video Evidence Input */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <label style={{ fontWeight: "bold" }}>Video Evidence</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setEvidenceVideo(e.target.files[0])}
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    backgroundColor: "white",
                  }}
                />
              </div>
              Offender Details
            </label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <button
                type="button"
                onClick={() => setIsNewOffender(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: !isNewOffender ? brandGreen : "#e9ecef",
                  color: !isNewOffender ? "white" : "#333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => setIsNewOffender(true)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: isNewOffender ? brandGreen : "#e9ecef",
                  color: isNewOffender ? "white" : "#333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                + Register New
              </button>
            </div>

            {!isNewOffender ? (
              <select
                value={selectedOffender}
                onChange={(e) => setSelectedOffender(e.target.value)}
                required={!isNewOffender}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "16px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                }}
              >
                <option value="">-- Choose an Offender --</option>
                {offenders.map((person) => {
                  //  Use License Number. If none, use their first Plate Number.
                  const displayId =
                    person.driver_license_number ||
                    (person.registered_vehicles &&
                    person.registered_vehicles.length > 0
                      ? person.registered_vehicles[0]
                      : "No ID");

                  // Use Driver Name. If none, say 'Unknown Name'.
                  const displayName = person.driver_name
                    ? person.driver_name
                    : "Unknown Name";

                  return (
                    <option key={person.id} value={person.id}>
                      {displayId} - {displayName}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  backgroundColor: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "5px",
                  border: "1px dashed #ccc",
                }}
              >
                <input
                  type="text"
                  placeholder="License Plate Number (Required)"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  required={isNewOffender}
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "5px",
                    border: "2px solid #333",
                  }}
                />

                <input
                  type="text"
                  placeholder="Driver Full Name (Optional)"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                />

                <input
                  type="text"
                  placeholder="Driver's License ID (Optional)"
                  value={driverLicense}
                  onChange={(e) => setDriverLicense(e.target.value)}
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                />

                <input
                  type="text"
                  placeholder="Phone Number (Optional)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
            )}
          </div>

          {error && (
            <p style={{ color: brandRed, fontWeight: "bold" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "15px",
              fontSize: "16px",
              backgroundColor: isLoading ? "#80bd99" : brandGreen,
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: isLoading ? "wait" : "pointer",
              fontWeight: "bold",
              marginTop: "20px",
            }}
          >
            {isLoading ? "Processing..." : "Issue Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateTicket;

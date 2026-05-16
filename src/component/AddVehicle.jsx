import React, { useState } from "react";
import axios from "axios";

const AddVehicle = ({ onVehicleAdded }) => {
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const brandGreen = "#007A33";
  const brandRed = "#DA291C";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      await axios.post(
        "http://127.0.0.1:8000/api/vehicles/add/",
        {
          plate_number: plateNumber,
          vehicle_model: vehicleModel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMessage(`Success! Vehicle ${plateNumber} has been added.`);
      setPlateNumber("");
      setVehicleModel("");

      if (onVehicleAdded) {
        onVehicleAdded();
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Your session has expired. Please log out and log back in.");
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.plate_number
      ) {
        setError("This plate number is already registered in the system.");
      } else {
        setError("Failed to add vehicle. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <h3 style={{ margin: "0 0 15px 0", color: brandGreen, fontSize: "20px" }}>
        Register a New Vehicle
      </h3>

      {/* Success & Error Messages */}
      {message && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            backgroundColor: "#e6f4ea",
            color: brandGreen,
            borderRadius: "5px",
            border: `1px solid ${brandGreen}`,
            fontWeight: "bold",
          }}
        >
          {message}
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            backgroundColor: "#fde8e8",
            color: brandRed,
            borderRadius: "5px",
            border: `1px solid ${brandRed}`,
            fontWeight: "bold",
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        {/* Plate Number Input */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            Plate Number <span style={{ color: brandRed }}>*</span>
          </label>
          <input
            type="text"
            required
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
            placeholder="e.g. LAG-123-ABC"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Vehicle Model Input */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            Vehicle Model (Optional)
          </label>
          <input
            type="text"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            placeholder="e.g. Toyota Camry"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "14px",
            backgroundColor: brandGreen,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
            transition: "background-color 0.3s",
          }}
        >
          {isLoading ? "Registering..." : "Add Vehicle to Profile"}
        </button>
      </form>
    </div>
  );
};

export default AddVehicle;

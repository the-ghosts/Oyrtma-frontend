import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import oyrtmaLogo from "../assets/OYRTMA.png";

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketToPay, setTicketToPay] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [currentEvidence, setCurrentEvidence] = useState({
    type: null,
    url: null,
  });

  const navigate = useNavigate();
  const brandGreen = "#007A33";
  const brandRed = "#DA291C";

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState("tickets"); // 'tickets', 'drivers'

  // Driver Registry States
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState("");
  const [driverSearch, setDriverSearch] = useState("");

  // Create/Edit Driver Form State
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverForm, setDriverForm] = useState({
    plate_number: "",
    phone_number: "",
    driver_name: "",
    state: "",
    license_number: "",
    email: "",
    vehicle_type: "",
  });
  const [isSavingDriver, setIsSavingDriver] = useState(false);
  const [driverFormError, setDriverFormError] = useState("");

  // CSV Bulk Import States
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Driver Delete Confirmation States
  const [isDeleteDriverOpen, setIsDeleteDriverOpen] = useState(false);
  const [deleteDriverId, setDeleteDriverId] = useState(null);
  const [isDeletingDriver, setIsDeletingDriver] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return navigate("/");

      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/bookings/",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setBookings(response.data);
        setDashboardLoading(false);
      } catch (err) {
        setDashboardError("Session expired. Please log in again.");
        setDashboardLoading(false);
        localStorage.removeItem("access_token");
        navigate("/");
      }
    };
    fetchTickets();
  }, [navigate]);

  const openEvidenceModal = (type, url) => {
    setCurrentEvidence({ type, url });
    setIsEvidenceModalOpen(true);
  };

  const closeEvidenceModal = () => {
    setIsEvidenceModalOpen(false);
    setCurrentEvidence({ type: null, url: null });
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  const openModal = (ticketId) => {
    setTicketToPay(ticketId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTicketToPay(null);
  };

  const confirmPayment = async () => {
    setIsUpdating(true);
    const token = localStorage.getItem("access_token");

    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/bookings/${ticketToPay}/`,
        {
          payment_status: "Paid",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setBookings(
        bookings.map((ticket) =>
          ticket.id === ticketToPay
            ? { ...ticket, payment_status: "Paid" }
            : ticket,
        ),
      );

      closeModal();
    } catch (err) {
      alert(
        "Failed to update payment status. Ensure you have the right permissions.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredBookings = bookings.filter(
    (ticket) =>
      ticket.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const fetchDrivers = async () => {
    setDriversLoading(true);
    setDriversError("");
    const token = localStorage.getItem("access_token");
    if (!token) return navigate("/");
    try {
      let url = "http://127.0.0.1:8000/api/drivers/";
      if (driverSearch) {
        url = `http://127.0.0.1:8000/api/drivers/search/?plate=${encodeURIComponent(driverSearch)}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (driverSearch) {
        setDrivers([response.data]);
      } else {
        setDrivers(response.data);
      }
    } catch (err) {
      if (driverSearch && err.response && err.response.status === 404) {
        setDrivers([]);
      } else {
        setDriversError(err.response?.data?.error || "Failed to fetch drivers. Ensure you have the right permissions.");
      }
    } finally {
      setDriversLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "drivers") {
      fetchDrivers();
    }
  }, [activeTab, driverSearch]);

  const handleOpenDriverModal = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      setDriverForm({
        plate_number: driver.plate_number,
        phone_number: driver.phone_number,
        driver_name: driver.driver_name,
        state: driver.state,
        license_number: driver.license_number || "",
        email: driver.email || "",
        vehicle_type: driver.vehicle_type || "",
      });
    } else {
      setEditingDriver(null);
      setDriverForm({
        plate_number: "",
        phone_number: "",
        driver_name: "",
        state: "",
        license_number: "",
        email: "",
        vehicle_type: "",
      });
    }
    setDriverFormError("");
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    setIsSavingDriver(true);
    setDriverFormError("");
    const token = localStorage.getItem("access_token");

    try {
      if (editingDriver) {
        const response = await axios.put(
          `http://127.0.0.1:8000/api/drivers/${editingDriver.id}/`,
          driverForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDrivers(drivers.map(d => d.id === editingDriver.id ? response.data : d));
      } else {
        const response = await axios.post(
          "http://127.0.0.1:8000/api/drivers/",
          driverForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDrivers([response.data, ...drivers]);
      }
      setIsDriverModalOpen(false);
    } catch (err) {
      const errorMsg = err.response?.data
        ? Object.entries(err.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
            .join(" | ")
        : "Failed to save driver.";
      setDriverFormError(errorMsg);
    } finally {
      setIsSavingDriver(false);
    }
  };

  const handleDeleteDriverClick = (id) => {
    setDeleteDriverId(id);
    setIsDeleteDriverOpen(true);
  };

  const confirmDeleteDriver = async () => {
    setIsDeletingDriver(true);
    const token = localStorage.getItem("access_token");
    try {
      await axios.delete(`http://127.0.0.1:8000/api/drivers/${deleteDriverId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrivers(drivers.filter(d => d.id !== deleteDriverId));
      setIsDeleteDriverOpen(false);
    } catch (err) {
      alert("Failed to delete driver.");
    } finally {
      setIsDeletingDriver(false);
    }
  };

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setIsImporting(true);
    setImportResult(null);
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/drivers/bulk-import/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setImportResult({
        success: true,
        message: response.data.message,
        count: response.data.created_or_updated,
        errors: response.data.errors,
        details: response.data.error_details,
      });
      fetchDrivers(); // Refresh drivers list
    } catch (err) {
      setImportResult({
        success: false,
        message: err.response?.data?.error || "Bulk import failed.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f4f4f9",
        minHeight: "100vh",
        position: "relative",
      }}
    >
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
          <h2 style={{ color: brandGreen, margin: 0 }}>
            Active Patrol Dashboard
          </h2>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: brandRed,
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
        <button
          onClick={() => setActiveTab("tickets")}
          style={{
            padding: "12px 24px",
            backgroundColor: activeTab === "tickets" ? brandGreen : "white",
            color: activeTab === "tickets" ? "white" : "#475569",
            border: activeTab === "tickets" ? `1px solid ${brandGreen}` : "1px solid #cbd5e1",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "tickets" ? "0 4px 6px rgba(0, 122, 51, 0.2)" : "none",
          }}
        >
          🎫 Ticket Log
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          style={{
            padding: "12px 24px",
            backgroundColor: activeTab === "drivers" ? brandGreen : "white",
            color: activeTab === "drivers" ? "white" : "#475569",
            border: activeTab === "drivers" ? `1px solid ${brandGreen}` : "1px solid #cbd5e1",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "drivers" ? "0 4px 6px rgba(0, 122, 51, 0.2)" : "none",
          }}
        >
          🚗 Driver Registry
        </button>
      </div>

      {activeTab === "tickets" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search Reference ID or Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "12px",
                fontSize: "16px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                width: "350px",
              }}
            />

            <button
              onClick={() => navigate("/create-ticket")}
              style={{
                padding: "12px 20px",
                backgroundColor: brandGreen,
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              + Issue New Ticket
            </button>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                borderBottom: `2px solid ${brandGreen}`,
                paddingBottom: "10px",
                marginBottom: "20px",
              }}
            >
              Recent Traffic Bookings
            </h3>

            {dashboardLoading ? (
              <p>Fetching secure data from server...</p>
            ) : dashboardError ? (
              <p style={{ color: brandRed }}>{dashboardError}</p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>
                      Reference ID
                    </th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>
                      Location
                    </th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>
                      Amount Due (₦)
                    </th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>
                      Issued By
                    </th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>
                      Evidence
                    </th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>
                      Status
                    </th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((ticket) => (
                    <tr key={ticket.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td
                        style={{
                          padding: "12px",
                          fontWeight: "bold",
                          color: brandGreen,
                        }}
                      >
                        {ticket.reference_id}
                      </td>
                      <td style={{ padding: "12px" }}>{ticket.location}</td>
                      <td style={{ padding: "12px" }}>{ticket.amount_due}</td>
                      <td style={{ padding: "12px" }}>
                        {ticket.officer?.full_name || ticket.officer_name}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div
                          style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}
                        >
                          {ticket.evidence_image ? (
                            <button
                              onClick={() =>
                                openEvidenceModal("image", ticket.evidence_image)
                              }
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "#e2e8f0",
                                border: "1px solid #cbd5e1",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              📷 Photo
                            </button>
                          ) : null}

                          {ticket.evidence_video ? (
                            <button
                              onClick={() =>
                                openEvidenceModal("video", ticket.evidence_video)
                              }
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "#e2e8f0",
                                border: "1px solid #cbd5e1",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              🎥 Video
                            </button>
                          ) : null}

                          {!ticket.evidence_image && !ticket.evidence_video && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#94a3b8",
                                fontStyle: "italic",
                              }}
                            >
                              None
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            backgroundColor:
                              ticket.payment_status === "Paid"
                                ? "#d4edda"
                                : "#f8d7da",
                            color:
                              ticket.payment_status === "Paid"
                                ? "#155724"
                                : "#721c24",
                            padding: "5px 10px",
                            borderRadius: "15px",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                        >
                          {ticket.payment_status}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {ticket.payment_status !== "Paid" ? (
                          <button
                            onClick={() => openModal(ticket.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#0056b3",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              fontStyle: "italic",
                            }}
                          >
                            Cleared
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!dashboardLoading && filteredBookings.length === 0 && (
              <p style={{ textAlign: "center", marginTop: "20px", color: "#666" }}>
                {bookings.length === 0
                  ? "No tickets have been issued yet."
                  : "No tickets match your search."}
              </p>
            )}
          </div>
        </>
      )}

      {activeTab === "drivers" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px"
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search Plate Number..."
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
              style={{
                padding: "12px",
                fontSize: "16px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                width: "350px",
              }}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setIsBulkImportOpen(true)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#475569",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                📥 Bulk Import (CSV)
              </button>
              <button
                onClick={() => handleOpenDriverModal(null)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: brandGreen,
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                + Register New Driver
              </button>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                borderBottom: `2px solid ${brandGreen}`,
                paddingBottom: "10px",
                marginBottom: "20px",
              }}
            >
              Driver Registry
            </h3>

            {driversLoading ? (
              <p>Fetching driver registry from server...</p>
            ) : driversError ? (
              <p style={{ color: brandRed }}>{driversError}</p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>Driver Name</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>Plate Number</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>Phone Number</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>State</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>License Number</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>Vehicle Model</th>
                    <th style={{ padding: "12px", borderBottom: "1px solid #ccc" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>{driver.driver_name}</td>
                      <td style={{ padding: "12px", color: brandGreen, fontWeight: "bold" }}>{driver.plate_number}</td>
                      <td style={{ padding: "12px" }}>{driver.phone_number}</td>
                      <td style={{ padding: "12px" }}>{driver.state}</td>
                      <td style={{ padding: "12px" }}>{driver.license_number || "N/A"}</td>
                      <td style={{ padding: "12px" }}>{driver.vehicle_type || "N/A"}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => handleOpenDriverModal(driver)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDriverClick(driver.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: brandRed,
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!driversLoading && drivers.length === 0 && (
              <p style={{ textAlign: "center", marginTop: "20px", color: "#666" }}>
                No driver records found.
              </p>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            <h2 style={{ color: "#333", marginTop: 0 }}>Confirm Payment</h2>
            <p
              style={{ color: "#555", marginBottom: "25px", lineHeight: "1.5" }}
            >
              Are you sure you want to mark this ticket as Paid? <br />
              <strong style={{ color: brandRed }}>
                This action cannot be undone.
              </strong>
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "15px",
              }}
            >
              <button
                onClick={closeModal}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#e9ecef",
                  color: "#333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: isUpdating ? "#80bd99" : brandGreen,
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: isUpdating ? "wait" : "pointer",
                  fontWeight: "bold",
                }}
              >
                {isUpdating ? "Updating..." : "Yes, Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCE VIEWING MODAL */}
      {isEvidenceModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "700px",
              position: "relative",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeEvidenceModal}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "35px",
                height: "35px",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "bold",
                color: "#334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            <h3 style={{ margin: "0 0 15px 0", color: brandGreen }}>
              Violation Evidence
            </h3>

            {/* Media Container */}
            <div
              style={{
                width: "100%",
                backgroundColor: "#0f172a",
                borderRadius: "8px",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "300px",
                padding: "10px",
              }}
            >
              {currentEvidence.type === "image" ? (
                <img
                  src={currentEvidence.url}
                  alt="Traffic Violation Evidence"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "60vh",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <video
                  src={currentEvidence.url}
                  controls
                  autoPlay
                  style={{ maxWidth: "100%", maxHeight: "60vh" }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRIVER CREATE/EDIT FORM MODAL */}
      {isDriverModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            <h2 style={{ color: brandGreen, marginTop: 0, borderBottom: `2px solid ${brandGreen}`, paddingBottom: "10px" }}>
              {editingDriver ? "Edit Driver Record" : "Register New Driver"}
            </h2>
            <form onSubmit={handleSaveDriver} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", textAlign: "left" }}>
                <label style={{ fontWeight: "bold", fontSize: "14px", color: "#475569" }}>Driver Name *</label>
                <input
                  type="text"
                  required
                  value={driverForm.driver_name}
                  onChange={(e) => setDriverForm({ ...driverForm, driver_name: e.target.value })}
                  style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1" }}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", textAlign: "left" }}>
                  <label style={{ fontWeight: "bold", fontSize: "14px", color: "#475569" }}>Plate Number *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.plate_number}
                    onChange={(e) => setDriverForm({ ...driverForm, plate_number: e.target.value })}
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1" }}
                    placeholder="e.g. ABC-123-XYZ"
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", textAlign: "left" }}>
                  <label style={{ fontWeight: "bold", fontSize: "14px", color: "#475569" }}>Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.phone_number}
                    onChange={(e) => setDriverForm({ ...driverForm, phone_number: e.target.value })}
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1" }}
                    placeholder="e.g. +2348012345678"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", textAlign: "left" }}>
                  <label style={{ fontWeight: "bold", fontSize: "14px", color: "#475569" }}>State *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.state}
                    onChange={(e) => setDriverForm({ ...driverForm, state: e.target.value })}
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1" }}
                    placeholder="e.g. Oyo"
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", textAlign: "left" }}>
                  <label style={{ fontWeight: "bold", fontSize: "14px", color: "#475569" }}>License Number</label>
                  <input
                    type="text"
                    value={driverForm.license_number}
                    onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1" }}
                    placeholder="e.g. DL-98273"
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", textAlign: "left" }}>
                <label style={{ fontWeight: "bold", fontSize: "14px", color: "#475569" }}>Email Address</label>
                <input
                  type="email"
                  value={driverForm.email}
                  onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                  style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1" }}
                  placeholder="e.g. driver@domain.com"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", textAlign: "left" }}>
                <label style={{ fontWeight: "bold", fontSize: "14px", color: "#475569" }}>Vehicle Type / Model</label>
                <input
                  type="text"
                  value={driverForm.vehicle_type}
                  onChange={(e) => setDriverForm({ ...driverForm, vehicle_type: e.target.value })}
                  style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1" }}
                  placeholder="e.g. Toyota Corolla 2018"
                />
              </div>

              {driverFormError && (
                <div style={{ color: brandRed, fontSize: "14px", marginTop: "5px", textAlign: "left" }}>
                  ⚠️ {driverFormError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  disabled={isSavingDriver}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#e2e8f0",
                    color: "#334155",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDriver}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: isSavingDriver ? "#80bd99" : brandGreen,
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: isSavingDriver ? "wait" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {isSavingDriver ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {isBulkImportOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            <h2 style={{ color: brandGreen, marginTop: 0, borderBottom: `2px solid ${brandGreen}`, paddingBottom: "10px" }}>
              Bulk Import Driver CSV
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.5", textAlign: "left", marginTop: "15px" }}>
              Upload a CSV file containing driver registry data. The CSV should have a header row with the following column names:
              <br />
              <code style={{ backgroundColor: "#f1f5f9", padding: "2px 4px", borderRadius: "3px", fontSize: "12px", display: "block", marginTop: "5px" }}>
                plate_number,phone_number,driver_name,state,license_number,email,vehicle_type
              </code>
            </p>
            <form onSubmit={handleBulkImportSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", textAlign: "left" }}>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setImportFile(e.target.files[0])}
                  style={{ padding: "10px", borderRadius: "5px", border: "1px solid #cbd5e1" }}
                />
              </div>

              {importResult && (
                <div
                  style={{
                    padding: "15px",
                    borderRadius: "6px",
                    backgroundColor: importResult.success ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${importResult.success ? "#bbf7d0" : "#fecaca"}`,
                    color: importResult.success ? "#166534" : "#991b1b",
                    fontSize: "14px",
                    textAlign: "left"
                  }}
                >
                  <strong>{importResult.message}</strong>
                  {importResult.success && importResult.count !== undefined && (
                    <div style={{ marginTop: "5px" }}>
                      Successfully updated/created: {importResult.count} record(s).
                      {importResult.errors > 0 && (
                        <span style={{ color: brandRed, marginLeft: "10px" }}>
                          Errors: {importResult.errors}
                        </span>
                      )}
                    </div>
                  )}
                  {importResult.details && importResult.details.length > 0 && (
                    <div style={{ marginTop: "10px", maxHeight: "150px", overflowY: "auto" }}>
                      <span style={{ fontWeight: "bold" }}>Error Details (first 10):</span>
                      <ul style={{ margin: "5px 0 0 0", paddingLeft: "20px", fontSize: "12px" }}>
                        {importResult.details.map((err, idx) => (
                          <li key={idx}>Row {err.row}: {err.error} ({err.data?.plate_number})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkImportOpen(false);
                    setImportFile(null);
                    setImportResult(null);
                  }}
                  disabled={isImporting}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#e2e8f0",
                    color: "#334155",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !importFile}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: isImporting ? "#80bd99" : brandGreen,
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: isImporting ? "wait" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {isImporting ? "Importing..." : "Upload & Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DRIVER CONFIRMATION MODAL */}
      {isDeleteDriverOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            <h2 style={{ color: "#333", marginTop: 0 }}>Delete Driver Record</h2>
            <p style={{ color: "#555", marginBottom: "25px", lineHeight: "1.5" }}>
              Are you sure you want to delete this driver from the registry? <br />
              <strong style={{ color: brandRed }}>This action cannot be undone.</strong>
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <button
                onClick={() => setIsDeleteDriverOpen(false)}
                disabled={isDeletingDriver}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#e9ecef",
                  color: "#333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDriver}
                disabled={isDeletingDriver}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: brandRed,
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: isDeletingDriver ? "wait" : "pointer",
                  fontWeight: "bold",
                }}
              >
                {isDeletingDriver ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

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
    </div>
  );
}

export default Dashboard;

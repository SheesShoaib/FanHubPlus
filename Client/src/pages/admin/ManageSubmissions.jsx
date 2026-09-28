import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Search,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import StatCard from "../../components/admin/StatCard";
import RichText from "../../components/common/RichText";
import api, { assetUrl } from "../../services/api";
import "../../styles/admin/dashboard.css";
import "../../styles/admin/manager-shared.css";
import "../../styles/admin/manage-submissions.css";

const statusConfig = {
  pending: { label: "Pending", icon: Clock3, badge: "yellow" },
  approved: { label: "Approved", icon: CheckCircle2, badge: "green" },
  rejected: { label: "Rejected", icon: XCircle, badge: "red" },
};

function ManageSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await api.get("/submissions");
        setSubmissions(data);
      } catch (err) {
        console.error("Failed to load submissions:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const filtered = useMemo(() => {
    return submissions.filter((item) => {
      const matchesStatus = activeStatus === "all" || item.status === activeStatus;
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.user?.name?.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [submissions, search, activeStatus]);

  const [reviewing, setReviewing] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  const updateStatus = async (id, status, adminNote) => {
    try {
      const updated = await api.put(`/submissions/${id}`, { status, ...(adminNote !== undefined ? { adminNote } : {}) });
      setSubmissions((current) => current.map((item) => (item._id === id ? updated : item)));
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const openReview = (item) => {
    setReviewing(item);
    setReviewNote(item.adminNote || "");
  };

  const reviewAndClose = async (status) => {
    if (await updateStatus(reviewing._id, status, reviewNote)) setReviewing(null);
  };

  const counts = {
    total: submissions.length,
    pending: submissions.filter((item) => item.status === "pending").length,
    approved: submissions.filter((item) => item.status === "approved").length,
    rejected: submissions.filter((item) => item.status === "rejected").length,
  };

  if (loading) return <div className="manager-page">Loading...</div>;

  return (
    <div className="manager-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">community</p>
          <h1>Submissions</h1>
          <p className="manager-subtitle">
            Review fan-submitted content and articles before they go live.
          </p>
        </div>
      </div>

      <div className="manager-stats">
        <StatCard icon={Upload} color="purple" label="total submissions" value={counts.total} />
        <StatCard icon={Clock3} color="orange" label="pending" value={counts.pending} />
        <StatCard icon={CheckCircle2} color="green" label="approved" value={counts.approved} />
        <StatCard icon={XCircle} color="pink" label="rejected" value={counts.rejected} />
      </div>

      <div className="manager-toolbar">
        <div className="manager-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search submissions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="manager-filters">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              type="button"
              className={activeStatus === status ? "manager-filter-chip active" : "manager-filter-chip"}
              onClick={() => setActiveStatus(status)}
            >
              {status === "all" ? "All" : statusConfig[status].label}
            </button>
          ))}
        </div>
      </div>

      <div className="manager-table-wrap">
        {filtered.length === 0 ? (
          <div className="manager-empty">
            <Upload size={26} />
            <h3>No submissions found</h3>
            <p>Try a different search or filter.</p>
          </div>
        ) : (
          <>
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const status = statusConfig[item.status];
                  const StatusIcon = status.icon;
                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="manager-title-cell submission-title-cell">
                          {item.imageUrl && (
                            <img className="submission-thumb" src={assetUrl(item.imageUrl)} alt="" loading="lazy" />
                          )}
                          <strong>{item.title}</strong>
                        </div>
                      </td>
                      <td>{item.user?.name || "Unknown"}</td>
                      <td>{item.category}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`manager-badge ${status.badge}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="manager-row-actions">
                          <button type="button" className="manager-icon-btn" aria-label="Review" onClick={() => openReview(item)}>
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="manager-icon-btn"
                            onClick={() => updateStatus(item._id, "approved")}
                            aria-label="Approve"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="manager-icon-btn danger"
                            onClick={() => updateStatus(item._id, "rejected")}
                            aria-label="Reject"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="manager-table-footer">
              <span>{filtered.length} of {submissions.length} submissions</span>
            </div>
          </>
        )}
      </div>

      {reviewing && (
        <div className="manager-modal-backdrop" onClick={() => setReviewing(null)}>
          <div className="manager-modal wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="manager-modal-head">
              <h2>{reviewing.title}</h2>
              <button type="button" onClick={() => setReviewing(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <p className="fh-muted">
              {reviewing.user?.name} ({reviewing.user?.email}) · {reviewing.category} ·{" "}
              {new Date(reviewing.createdAt).toLocaleString()} · currently {reviewing.status}
            </p>

            {reviewing.imageUrl && (
              <div className="submission-review-image">
                <img src={assetUrl(reviewing.imageUrl)} alt={reviewing.title} />
              </div>
            )}

            <div className="fh-review-body">
              <RichText text={reviewing.content} />
            </div>

            {reviewing.publishedContent && (
              <p>
                <Link to={`/stories/${reviewing.publishedContent}`} target="_blank" className="fh-text-link">
                  Open published article
                </Link>
              </p>
            )}

            <div className="manager-form-group">
              <label htmlFor="review-note">Note to the author (shown in their dashboard)</label>
              <textarea id="review-note" rows={2} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
            </div>

            <div className="manager-modal-actions">
              <button type="button" className="manager-cancel-btn" onClick={() => reviewAndClose("rejected")}>
                <XCircle size={15} /> Reject
              </button>
              <button type="button" className="manager-save-btn" onClick={() => reviewAndClose("approved")}>
                <CheckCircle2 size={15} /> Approve & publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageSubmissions;
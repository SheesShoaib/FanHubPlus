import { useEffect, useMemo, useState } from "react";
import { Bug, HelpCircle, Lightbulb, MessageSquare, Search, Trash2, X, Eye } from "lucide-react";

import StatCard from "../../components/admin/StatCard";
import Loader from "../../components/common/Loader";
import api from "../../services/api";
import "../../styles/admin/dashboard.css";
import "../../styles/admin/manager-shared.css";
import "../../styles/admin/manage-feedback.css";

const typeConfig = {
  bug: { label: "Bug", icon: Bug, badge: "red" },
  suggestion: { label: "Suggestion", icon: Lightbulb, badge: "yellow" },
  query: { label: "Query", icon: HelpCircle, badge: "blue" },
};

const STATUS_BADGE = { open: "yellow", "in-progress": "blue", resolved: "green" };
const DETAIL_LABELS = { severity: "Severity", page: "Page", steps: "Steps", browser: "Browser", area: "Area", impact: "Why it helps", topic: "Topic" };

function Feedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("open");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/feedback")
      .then(setFeedback)
      .catch((err) => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return feedback.filter((item) => {
      const matchesType = activeType === "all" || item.type === activeType;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [feedback, search, activeType, statusFilter]);

  const update = async (id, patch) => {
    try {
      const updated = await api.put(`/feedback/${id}`, patch);
      setFeedback((current) => current.map((item) => (item._id === id ? updated : item)));
      setSelected((current) => (current?._id === id ? updated : current));
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await api.delete(`/feedback/${id}`);
      setFeedback((current) => current.filter((item) => item._id !== id));
      setSelected(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openItem = (item) => {
    setSelected(item);
    setNote(item.adminNote || "");
    setStatus(item.status);
  };

  const saveSelected = async () => {
    setSaving(true);
    if (await update(selected._id, { adminNote: note, status })) setSelected(null);
    setSaving(false);
  };

  const counts = {
    total: feedback.length,
    bug: feedback.filter((item) => item.type === "bug").length,
    suggestion: feedback.filter((item) => item.type === "suggestion").length,
    query: feedback.filter((item) => item.type === "query").length,
  };

  if (loading) return <Loader label="Loading feedback..." />;

  return (
    <div className="manager-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">community</p>
          <h1>Feedback</h1>
          <p className="manager-subtitle">Bug reports, suggestions and queries submitted from the Contact page.</p>
        </div>
      </div>

      <div className="manager-stats">
        <StatCard icon={MessageSquare} color="purple" label="total feedback" value={counts.total} />
        <StatCard icon={Bug} color="pink" label="bugs" value={counts.bug} />
        <StatCard icon={Lightbulb} color="blue" label="suggestions" value={counts.suggestion} />
        <StatCard icon={HelpCircle} color="green" label="queries" value={counts.query} />
      </div>

      <div className="manager-toolbar">
        <div className="manager-search">
          <Search size={16} />
          <input type="text" placeholder="Search feedback..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        <div className="manager-filters">
          {["all", "bug", "suggestion", "query"].map((type) => (
            <button
              key={type}
              type="button"
              className={activeType === type ? "manager-filter-chip active" : "manager-filter-chip"}
              onClick={() => setActiveType(type)}
            >
              {type === "all" ? "All types" : typeConfig[type].label}
            </button>
          ))}
          <select className="manager-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
            <option value="all">Any status</option>
            <option value="open">Open</option>
            <option value="in-progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="manager-table-wrap">
        {filtered.length === 0 ? (
          <div className="manager-empty">
            <MessageSquare size={26} />
            <h3>No feedback found</h3>
            <p>Try a different search or filter.</p>
          </div>
        ) : (
          <>
            <table className="manager-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const type = typeConfig[item.type];
                  const TypeIcon = type.icon;
                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="manager-title-cell">
                          <strong>{item.name}</strong>
                          <span>{item.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`manager-badge ${type.badge}`}>
                          <TypeIcon size={12} />
                          {type.label}
                        </span>
                      </td>
                      <td>
                        {item.subject && <strong>{item.subject}: </strong>}
                        {item.message.length > 90 ? `${item.message.slice(0, 90)}...` : item.message}
                      </td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <select
                          className={`manager-select badge-${STATUS_BADGE[item.status]}`}
                          value={item.status}
                          onChange={(e) => update(item._id, { status: e.target.value })}
                          aria-label="Status"
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                      <td>
                        <div className="manager-row-actions">
                          <button type="button" className="manager-icon-btn" onClick={() => openItem(item)} aria-label="View details">
                            <Eye size={15} />
                          </button>
                          <button type="button" className="manager-icon-btn danger" onClick={() => handleDelete(item._id)} aria-label="Delete feedback">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="manager-table-footer">
              <span>
                {filtered.length} of {feedback.length} entries
              </span>
            </div>
          </>
        )}
      </div>

      {selected && (
        <div className="manager-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="manager-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="manager-modal-head">
              <h2>{selected.subject || `${typeConfig[selected.type].label} from ${selected.name}`}</h2>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <p className="fh-muted">
              {selected.name} · {selected.email} · {new Date(selected.createdAt).toLocaleString()}
              {selected.user ? " · registered member" : " · visitor"}
            </p>
            <p style={{ whiteSpace: "pre-line" }}>{selected.message}</p>

            {Object.keys(selected.details || {}).length > 0 && (
              <dl className="fh-detail-list">
                {Object.entries(selected.details).map(([key, value]) => (
                  <div key={key}>
                    <dt>{DETAIL_LABELS[key] || key}</dt>
                    <dd style={{ whiteSpace: "pre-line" }}>{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="manager-form-group">
              <label htmlFor="fb-status">Status</label>
              <select id="fb-status" className="manager-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="open">Open</option>
                <option value="in-progress">In progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="manager-form-group">
              <label htmlFor="fb-note">Internal note</label>
              <textarea id="fb-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {status === "resolved" && selected.status !== "resolved" && selected.user && (
              <p className="fh-muted">The member will get a "Feedback resolved" notification.</p>
            )}

            <div className="manager-modal-actions">
              <button type="button" className="manager-cancel-btn" onClick={() => setSelected(null)}>
                Cancel
              </button>
              <button type="button" className="manager-save-btn" onClick={saveSelected} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Feedback;

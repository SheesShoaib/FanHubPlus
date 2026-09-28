import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCircle2 } from "lucide-react";

import api from "../../services/api";

const POLL_MS = 30000;

function timeAgo(date) {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const load = () =>
    api
      .get("/notifications")
      .then((data) => {
        setItems(data.items);
        setUnread(data.unread);
      })
      .catch(() => {});

  useEffect(() => {
    load();
    const timer = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      api.put("/notifications/read-all").catch(() => {});
    }
    if (!next) setItems((current) => current.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="nav-notify-wrap" ref={wrapRef}>
      <button
        type="button"
        className="nav-icon-btn nav-notify-btn"
        onClick={toggle}
        aria-label={unread ? `Notifications: ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell size={19} />
        {unread > 0 && <span className="nav-notify-count">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="nav-notify-panel">
          <div className="nav-notify-head">Notifications</div>

          {items.length === 0 ? (
            <p className="nav-notify-empty">No notifications yet.</p>
          ) : (
            <ul className="nav-notify-list">
              {items.map((n) => (
                <li key={n._id} className={n.read ? "" : "unread"}>
                  <Link to={n.link || "#"} onClick={() => setOpen(false)}>
                    <CheckCircle2 size={16} className="nav-notify-icon" />
                    <span>
                      <strong>{n.title}</strong>
                      {n.message && <em>{n.message}</em>}
                      <small>{timeAgo(n.createdAt)}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

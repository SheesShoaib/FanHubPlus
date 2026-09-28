import { useEffect, useState } from "react";
import {
  Search,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Eye,
  Ban,
  CheckCircle,
  X,
  Mail,
  CalendarDays,
  Shield,
  Trash2,
  BadgeCheck,
  Clock,
} from "lucide-react";

import Loader from "../../components/common/Loader";
import api, { assetUrl, toQuery } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/admin/users.css";

function initials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Users() {
  const { user: me } = useAuth();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ users: [], total: 0, pages: 1 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [blockReason, setBlockReason] = useState("");

  const loadStats = () => api.get("/users/stats").then(setStats).catch(() => {});

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get(`/users${toQuery({ search, role, status, page, limit: 10 })}`)
        .then(setData)
        .catch((err) => alert(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, role, status, page]);

  const openUser = async (id) => {
    setBlockReason("");
    try {
      setSelected(await api.get(`/users/${id}`));
    } catch (err) {
      alert(err.message);
    }
  };

  const updateUser = async (id, patch) => {
    try {
      const updated = await api.put(`/users/${id}`, patch);
      setData((current) => ({ ...current, users: current.users.map((u) => (u._id === id ? updated : u)) }));
      setSelected((current) => (current && current._id === id ? { ...current, ...updated } : current));
      loadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Permanently delete this user and their bookmarks, notes, ratings and chats?")) return;
    try {
      await api.delete(`/users/${id}`);
      setSelected(null);
      setData((current) => ({ ...current, users: current.users.filter((u) => u._id !== id), total: current.total - 1 }));
      loadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const setFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div className="users-page">
      <div className="users-page-top">
        <div>
          <p className="users-page-label">community management</p>
          <h1>users</h1>
          <p className="users-page-subtitle">Search members, change roles, and block or remove accounts.</p>
        </div>
      </div>

      <div className="user-stats">
        <div className="user-stat-card">
          <span className="user-stat-icon purple">
            <UsersIcon size={19} />
          </span>
          <div>
            <p>total users</p>
            <h3>{stats?.total ?? "-"}</h3>
          </div>
        </div>

        <div className="user-stat-card">
          <span className="user-stat-icon green">
            <UserCheck size={19} />
          </span>
          <div>
            <p>active this week</p>
            <h3>{stats?.activeWeek ?? "-"}</h3>
          </div>
        </div>

        <div className="user-stat-card">
          <span className="user-stat-icon blue">
            <Shield size={19} />
          </span>
          <div>
            <p>admins</p>
            <h3>{stats?.admins ?? "-"}</h3>
          </div>
        </div>

        <div className="user-stat-card">
          <span className="user-stat-icon red">
            <UserX size={19} />
          </span>
          <div>
            <p>blocked</p>
            <h3>{stats?.blocked ?? "-"}</h3>
          </div>
        </div>
      </div>

      <div className="users-box">
        <div className="users-toolbar">
          <div className="users-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="search by name or email..."
              value={search}
              onChange={setFilter(setSearch)}
              aria-label="Search users"
            />
          </div>

          <div className="users-filters">
            <select value={role} onChange={setFilter(setRole)} aria-label="Role">
              <option value="all">all roles</option>
              <option value="user">users</option>
              <option value="admin">admins</option>
            </select>

            <select value={status} onChange={setFilter(setStatus)} aria-label="Status">
              <option value="all">all status</option>
              <option value="active">active</option>
              <option value="blocked">blocked</option>
            </select>
          </div>
        </div>

        <div className="users-table-wrap">
          {loading ? (
            <Loader label="Loading users..." />
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>user</th>
                  <th>role</th>
                  <th>fandoms</th>
                  <th>joined</th>
                  <th>last active</th>
                  <th>status</th>
                  <th>action</th>
                </tr>
              </thead>

              <tbody>
                {data.users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="table-user">
                        <span className="table-avatar">
                          {user.profilePicture ? <img src={assetUrl(user.profilePicture)} alt="" /> : initials(user.name)}
                        </span>
                        <div>
                          <strong>{user.name}</strong>
                          <small>{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`user-role ${user.role === "admin" ? "creator" : "user"}`}>{user.role}</span>
                    </td>
                    <td>
                      <span className="user-fandom">{user.favoriteFandoms?.join(", ") || user.favoriteFandom || "-"}</span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : "-"}</td>
                    <td>
                      <span className={`user-status ${user.isBlocked ? "inactive" : "active"}`}>
                        <i></i>
                        {user.isBlocked ? "blocked" : "active"}
                      </span>
                    </td>
                    <td>
                      <div className="user-actions">
                        <button type="button" title="view user" aria-label={`View ${user.name}`} onClick={() => openUser(user._id)}>
                          <Eye size={16} />
                        </button>
                        {user._id !== me?.id && (
                          <button
                            type="button"
                            title={user.isBlocked ? "unblock" : "block"}
                            aria-label={user.isBlocked ? `Unblock ${user.name}` : `Block ${user.name}`}
                            onClick={() => updateUser(user._id, { isBlocked: !user.isBlocked })}
                          >
                            {user.isBlocked ? <CheckCircle size={16} /> : <Ban size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && data.users.length === 0 && (
            <div className="no-users">
              <UsersIcon size={30} />
              <h3>no user found</h3>
              <p>Try a different search or filter.</p>
            </div>
          )}
        </div>

        <div className="users-table-footer">
          <p>
            showing <strong>{data.users.length}</strong> of <strong>{data.total}</strong> users
          </p>

          <div className="pagination">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              previous
            </button>
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" className={p === page ? "active" : ""} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
              next
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="user-modal-bg" onClick={() => setSelected(null)}>
          <div className="user-modal" role="dialog" aria-modal="true" aria-label="User details" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-head">
              <div>
                <p>user details</p>
                <h3>community profile</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="modal-user-profile">
              <span className="modal-avatar">
                {selected.profilePicture ? <img src={assetUrl(selected.profilePicture)} alt="" /> : initials(selected.name)}
              </span>
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.bio || "No bio yet"}</p>
              </div>
            </div>

            <div className="user-detail-list">
              <div>
                <span>
                  <Mail size={15} />
                  email
                </span>
                <strong>
                  {selected.email} {selected.isVerified && <BadgeCheck size={13} />}
                </strong>
              </div>
              <div>
                <span>
                  <Shield size={15} />
                  role
                </span>
                <strong>{selected.role}</strong>
              </div>
              <div>
                <span>
                  <CalendarDays size={15} />
                  joined
                </span>
                <strong>{new Date(selected.createdAt).toLocaleDateString()}</strong>
              </div>
              <div>
                <span>
                  <Clock size={15} />
                  last active
                </span>
                <strong>{selected.lastActiveAt ? new Date(selected.lastActiveAt).toLocaleString() : "-"}</strong>
              </div>
              <div>
                <span>
                  <UsersIcon size={15} />
                  activity
                </span>
                <strong>
                  {selected.stats?.bookmarks} bookmarks · {selected.stats?.submissions} submissions · {selected.stats?.chats} chats
                </strong>
              </div>
              {selected.isBlocked && selected.blockedReason && (
                <div>
                  <span>
                    <Ban size={15} />
                    block reason
                  </span>
                  <strong>{selected.blockedReason}</strong>
                </div>
              )}
            </div>

            {selected._id !== me?.id ? (
              <>
                {!selected.isBlocked && (
                  <input
                    className="fh-modal-input"
                    type="text"
                    placeholder="Reason for blocking (optional)"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                )}
                <div className="user-modal-actions">
                  {selected.isBlocked ? (
                    <button type="button" className="activate-user-btn" onClick={() => updateUser(selected._id, { isBlocked: false })}>
                      <CheckCircle size={15} />
                      unblock user
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="disable-user-btn"
                      onClick={() => updateUser(selected._id, { isBlocked: true, blockedReason: blockReason })}
                    >
                      <Ban size={15} />
                      block user
                    </button>
                  )}

                  <button
                    type="button"
                    className="close-modal-btn"
                    onClick={() => updateUser(selected._id, { role: selected.role === "admin" ? "user" : "admin" })}
                  >
                    <Shield size={15} />
                    {selected.role === "admin" ? "make regular user" : "make admin"}
                  </button>

                  <button type="button" className="disable-user-btn" onClick={() => deleteUser(selected._id)}>
                    <Trash2 size={15} />
                    delete
                  </button>
                </div>
              </>
            ) : (
              <p className="fh-muted">This is your own account.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;

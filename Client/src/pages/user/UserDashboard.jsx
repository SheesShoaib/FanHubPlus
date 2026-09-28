import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  MailWarning,
  MessageSquare,
  NotebookPen,
  Sparkles,
  Star,
  StickyNote,
  Upload,
  Send,
} from "lucide-react";

import Loader from "../../components/common/Loader";
import { CATEGORY_ICONS } from "../../components/home/CategoriesSection";
import api, { assetUrl } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const ACTIVITY_ICONS = {
  bookmark: Bookmark,
  note: NotebookPen,
  submission: Upload,
  rating: Star,
  chat: MessageSquare,
  feedback: Send,
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(date) {
  const seconds = Math.round((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(date).toLocaleDateString();
}

function UserDashboard() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyLink, setVerifyLink] = useState(location.state?.devVerifyLink || "");
  const [verifyMsg, setVerifyMsg] = useState("");

  useEffect(() => {
    api
      .get("/users/me/dashboard")
      .then((res) => {
        setData(res);
        updateUser(res.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [updateUser]);

  const resendVerification = async () => {
    try {
      const res = await api.post("/auth/resend-verification", {});
      setVerifyMsg(res.msg);
      if (res.devVerifyLink) setVerifyLink(res.devVerifyLink);
    } catch (err) {
      setVerifyMsg(err.message);
    }
  };

  if (loading) return <Loader label="Loading your universe..." />;

  const firstName = (user?.name || "Fan").split(" ")[0];
  const counts = data?.counts || {};

  const quickLinks = [
    { to: "/dashboard/bookmarks", label: "Bookmarks", icon: Bookmark, count: counts.bookmarks },
    { to: "/dashboard/notes", label: "Notes", icon: StickyNote, count: counts.notes },
    { to: "/dashboard/submissions", label: "Submissions", icon: Upload, count: counts.submissions },
    { to: "/dashboard/chat-history", label: "Chat History", icon: MessageSquare, count: counts.chats },
  ];

  return (
    <div className="user-dash-overview">
      <motion.div
        className="user-dash-greeting"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>
          {greeting()}, {firstName} 👋
        </h1>
        <p>Here's what's happening in your universe.</p>
      </motion.div>

      {user && !user.isVerified && (
        <div className="fh-banner warn" role="status">
          <MailWarning size={18} />
          <div>
            <strong>Please verify your email address.</strong>
            <span>{verifyMsg || `We sent a link to ${user.email}.`}</span>
            {verifyLink && (
              <span className="fh-dev-note">
                No email server is configured locally, so here's the link: <a href={verifyLink}>Verify now</a>
              </span>
            )}
          </div>
          <button type="button" onClick={resendVerification}>
            Resend link
          </button>
        </div>
      )}

      <div className="user-dash-grid">
        {quickLinks.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <Link to={item.to} className="user-dash-card">
                <div className="user-dash-card-icon">
                  <Icon size={20} />
                </div>

                <div className="user-dash-card-body">
                  <strong>{item.count ?? 0}</strong>
                  <span>{item.label}</span>
                </div>

                <ArrowRight size={16} className="user-dash-card-arrow" />
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="fh-dash-columns">
        <section className="dash-card">
          <div className="fh-row-head">
            <h3>Your favourite fandoms</h3>
            <Link to="/dashboard/profile" className="fh-text-link">
              Edit
            </Link>
          </div>
          {data?.favoriteCategories?.length ? (
            <div className="fh-fav-grid">
              {data.favoriteCategories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.slug] || Sparkles;
                return (
                  <Link key={cat._id} to={`/category/${cat.slug}`} className="fh-fav-chip">
                    <Icon size={16} />
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="fh-muted">
              You haven't picked any yet. <Link to="/dashboard/profile">Choose your fandoms</Link> to get personalised picks.
            </p>
          )}

          <h3 className="fh-subhead">Recently bookmarked</h3>
          {data?.recentBookmarks?.length ? (
            <div className="fh-mini-list">
              {data.recentBookmarks.map((b) => (
                <Link key={b._id} to={b.link} className="fh-mini-row">
                  {b.imageUrl ? <img src={assetUrl(b.imageUrl)} alt="" /> : <span className="fh-img-fallback" />}
                  <span>
                    <strong>{b.title}</strong>
                    <small>{b.itemType === "Content" ? "Article / media" : b.itemType}</small>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="fh-muted">Nothing saved yet. Tap the bookmark icon on any article, character, video or product.</p>
          )}
        </section>

        <section className="dash-card">
          <h3>Recent activity</h3>
          {data?.activity?.length ? (
            <ul className="fh-activity">
              {data.activity.map((item, index) => {
                const Icon = ACTIVITY_ICONS[item.type] || Sparkles;
                return (
                  <li key={index}>
                    <span className="fh-activity-icon">
                      <Icon size={14} />
                    </span>
                    <span>
                      {item.link ? <Link to={item.link}>{item.text}</Link> : item.text}
                      <small>{timeAgo(item.date)}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="fh-muted">
              Nothing here yet. Start bookmarking, rating and chatting with the assistant to see your activity.
            </p>
          )}
        </section>
      </div>

      {data?.recommendations?.length > 0 && (
        <section className="dash-card">
          <div className="fh-row-head">
            <h3>Picked for you</h3>
            <Link to="/explore" className="fh-text-link">
              Explore more <ArrowRight size={13} />
            </Link>
          </div>
          <div className="fh-card-grid four">
            {data.recommendations.map((item) => (
              <Link
                key={item._id}
                to={item.type === "article" ? `/stories/${item._id}` : `/multimedia?item=${item._id}`}
                className="fh-mini-card"
              >
                {item.imageUrl ? <img src={assetUrl(item.imageUrl)} alt="" loading="lazy" /> : <span className="fh-img-fallback" />}
                <div>
                  <small>
                    {item.category?.name} · {item.type}
                  </small>
                  <strong>{item.title}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default UserDashboard;

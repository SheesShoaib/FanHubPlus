import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  CalendarDays,
  Bot,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
  Plus,
  Upload,
  MessageSquare,
  Video,
  UserPlus,
} from "lucide-react";

import Loader from "../../components/common/Loader";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/admin/dashboard.css";

const ACTIVITY_ICONS = {
  user: UserPlus,
  submission: Upload,
  feedback: MessageSquare,
  content: FileText,
  chat: Bot,
};
const ACTIVITY_COLORS = { user: "blue-icon", submission: "", feedback: "pink-icon", content: "green-icon", chat: "blue-icon" };
const FANDOM_CLASSES = ["anime", "gaming", "manga", "movies", "kpop"];

function timeAgo(date) {
  const minutes = Math.round((Date.now() - new Date(date)) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

function Trend({ value, label }) {
  const down = value < 0;
  return (
    <div className="stat-bottom">
      <span className={down ? "down" : ""}>
        {down ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
        {Math.abs(value)}%
      </span>
      <small>{label}</small>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/analytics/overview?days=30"), api.get("/analytics/activity?limit=6")])
      .then(([ov, act]) => {
        setOverview(ov);
        setActivity(act);
      })
      .catch((err) => console.error("Failed to load dashboard:", err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading dashboard..." />;
  if (!overview) return <div className="dashboard-page">Couldn't load the dashboard. Is the API running?</div>;

  const { users, pageViews, counts, chatbot, popularCategories, topContent } = overview;

  const weeks = [];
  for (let i = 0; i < overview.series.length; i += 5) {
    const slice = overview.series.slice(i, i + 5);
    weeks.push({ label: slice[0].date.slice(5), views: slice.reduce((s, d) => s + d.views, 0) });
  }
  const maxWeek = Math.max(1, ...weeks.map((w) => w.views));
  const maxCategory = Math.max(1, ...popularCategories.map((c) => c.views));

  return (
    <div className="dashboard-page">
      <div className="dashboard-top">
        <div>
          <p className="dashboard-label">admin dashboard</p>
          <h1>
            welcome back, <span>{(user?.name || "admin").split(" ")[0]}</span>
          </h1>
          <p className="dashboard-subtitle">Live overview of FanHub+ activity over the last 30 days.</p>
        </div>

        <Link to="/admin/content" className="add-content-btn">
          <Plus size={17} />
          add content
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-head">
            <div className="stat-icon purple">
              <Users size={20} />
            </div>
          </div>
          <p>total users</p>
          <h2>{users.total.toLocaleString()}</h2>
          <Trend value={users.newChange} label={`${users.new} new · ${users.active} active`} />
        </div>

        <div className="stat-card">
          <div className="stat-card-head">
            <div className="stat-icon blue">
              <FileText size={20} />
            </div>
          </div>
          <p>published content</p>
          <h2>{(counts.articles + counts.media).toLocaleString()}</h2>
          <div className="stat-bottom">
            <small>
              {counts.articles} articles · {counts.media} media · {counts.characters} characters
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-head">
            <div className="stat-icon pink">
              <CalendarDays size={20} />
            </div>
          </div>
          <p>upcoming events</p>
          <h2>{counts.upcomingEvents}</h2>
          <div className="stat-bottom">
            <small>
              <Link to="/admin/events">manage events</Link>
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-head">
            <div className="stat-icon green">
              <Bot size={20} />
            </div>
          </div>
          <p>chatbot messages</p>
          <h2>{chatbot.messages.toLocaleString()}</h2>
          <div className="stat-bottom">
            <small>{chatbot.sessions} conversations</small>
          </div>
        </div>
      </div>

      <div className="dashboard-middle">
        <div className="dashboard-box growth-box">
          <div className="box-heading">
            <div>
              <p>traffic</p>
              <h3>page views ({pageViews.total.toLocaleString()})</h3>
            </div>

            <div className="growth-rate">
              <TrendingUp size={16} />
              {pageViews.change > 0 ? "+" : ""}
              {pageViews.change}%
            </div>
          </div>

          <div className="fh-bar-chart" role="img" aria-label="Page views per five-day period">
            {weeks.map((w) => (
              <div key={w.label} className="fh-bar-col">
                <span className="fh-bar-value">{w.views}</span>
                <div className="fh-bar" style={{ height: `${(w.views / maxWeek) * 100}%` }} />
                <small>{w.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-box fandom-box">
          <div className="box-heading">
            <div>
              <p>community</p>
              <h3>popular categories</h3>
            </div>
          </div>

          {popularCategories.slice(0, 5).map((cat, index) => (
            <div className="fandom-stat" key={cat._id}>
              <div className="fandom-name">
                <span>{cat.name}</span>
                <small>
                  {cat.views.toLocaleString()} views · {cat.fans} fans
                </small>
              </div>
              <div className="progress">
                <div
                  className={`progress-value ${FANDOM_CLASSES[index % FANDOM_CLASSES.length]}`}
                  style={{ width: `${Math.max(4, (cat.views / maxCategory) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-bottom">
        <div className="dashboard-box">
          <div className="box-heading">
            <div>
              <p>latest updates</p>
              <h3>recent activity</h3>
            </div>
            <Link to="/admin/analytics" className="view-btn">
              analytics
            </Link>
          </div>

          {activity.length === 0 && <p className="fh-muted">No activity yet.</p>}
          {activity.map((item, index) => {
            const Icon = ACTIVITY_ICONS[item.type] || FileText;
            return (
              <Link to={item.link} className="activity-item" key={index}>
                <div className={`activity-icon ${ACTIVITY_COLORS[item.type] || ""}`}>
                  <Icon size={17} />
                </div>
                <div className="activity-info">
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
                <span className="activity-time">
                  <Clock size={12} />
                  {timeAgo(item.date)}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="dashboard-box">
          <div className="box-heading">
            <div>
              <p>engagement</p>
              <h3>most viewed content</h3>
            </div>
            <Link to="/admin/articles" className="view-btn">
              manage
            </Link>
          </div>

          {topContent.map((item, index) => (
            <div className="popular-item" key={item._id}>
              <span className="rank">{String(index + 1).padStart(2, "0")}</span>
              <div className="popular-info">
                <h4>{item.title}</h4>
                <p>
                  {item.category?.name} · {item.type}
                  {item.ratingAverage > 0 ? ` · ★ ${item.ratingAverage}` : ""}
                </p>
              </div>
              <span className="views">
                {item.type === "article" ? <Eye size={14} /> : <Video size={14} />}
                {item.views.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-box">
        <div className="box-heading">
          <div>
            <p>needs attention</p>
            <h3>review queue</h3>
          </div>
        </div>
        <div className="fh-queue">
          <Link to="/admin/submissions">
            <Upload size={18} />
            <strong>{counts.pendingSubmissions}</strong>
            <span>submissions pending approval</span>
          </Link>
          <Link to="/admin/feedback">
            <MessageSquare size={18} />
            <strong>{counts.openFeedback}</strong>
            <span>feedback items not resolved</span>
          </Link>
          <Link to="/admin/users">
            <Users size={18} />
            <strong>{users.activeToday}</strong>
            <span>members active in the last 24 h</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

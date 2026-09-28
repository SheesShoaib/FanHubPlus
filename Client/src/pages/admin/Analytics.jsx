import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Eye,
  LogIn,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import Loader from "../../components/common/Loader";
import api from "../../services/api";
import "../../styles/admin/analytics.css";

const DEVICE_ICONS = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };
const FANDOM_CLASSES = ["anime", "gaming", "manga", "movies", "kpop"];

function Change({ value }) {
  const down = value < 0;
  return (
    <span className={`analytics-change ${down ? "negative" : "positive"}`}>
      {down ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
      {Math.abs(value)}%
    </span>
  );
}

function bucketSeries(series) {
  const size = Math.max(1, Math.ceil(series.length / 12));
  const buckets = [];
  for (let i = 0; i < series.length; i += size) {
    const slice = series.slice(i, i + size);
    buckets.push({
      label: slice[0].date.slice(5),
      views: slice.reduce((s, d) => s + d.views, 0),
      visitors: slice.reduce((s, d) => s + d.visitors, 0),
      chats: slice.reduce((s, d) => s + d.chats, 0),
    });
  }
  return buckets;
}

function Analytics() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState(null);
  const [chatStats, setChatStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/analytics/overview?days=${period}`), api.get("/chat/stats")])
      .then(([overview, chat]) => {
        setData(overview);
        setChatStats(chat);
      })
      .catch((err) => console.error("Failed to load analytics:", err.message))
      .finally(() => setLoading(false));
  }, [period]);

  const buckets = useMemo(() => (data ? bucketSeries(data.series) : []), [data]);

  if (loading && !data) return <Loader label="Crunching numbers..." />;
  if (!data) return <div className="analytics-page">Couldn't load analytics.</div>;

  const maxBar = Math.max(1, ...buckets.map((b) => Math.max(b.views, b.visitors)));
  const maxChat = Math.max(1, ...buckets.map((b) => b.chats));
  const maxCategory = Math.max(1, ...data.popularCategories.map((c) => c.views));
  const totalLogins = data.logins.success + data.logins.failed;

  return (
    <div className="analytics-page">
      <div className="analytics-top">
        <div>
          <p className="analytics-label">platform overview</p>
          <h1>analytics</h1>
          <p className="analytics-subtitle">Usage statistics: active users, traffic, popular categories and chatbot interaction volume.</p>
        </div>

        <select className="analytics-period" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
          <option value="7">last 7 days</option>
          <option value="30">last 30 days</option>
          <option value="90">last 90 days</option>
          <option value="365">last year</option>
        </select>
      </div>

      <div className="analytics-stats">
        <div className="analytics-stat-card">
          <div className="analytics-stat-head">
            <span className="analytics-stat-icon purple">
              <Users size={19} />
            </span>
            <Change value={data.users.newChange} />
          </div>
          <p>total users</p>
          <h2>{data.users.total.toLocaleString()}</h2>
          <small>{data.users.new} joined in this period</small>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-head">
            <span className="analytics-stat-icon green">
              <UserCheck size={19} />
            </span>
          </div>
          <p>active users</p>
          <h2>{data.users.active.toLocaleString()}</h2>
          <small>{data.users.activeToday} active in the last 24 hours</small>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-head">
            <span className="analytics-stat-icon blue">
              <Eye size={19} />
            </span>
            <Change value={data.pageViews.change} />
          </div>
          <p>page views</p>
          <h2>{data.pageViews.total.toLocaleString()}</h2>
          <small>vs previous {period} days</small>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-head">
            <span className="analytics-stat-icon orange">
              <Bot size={19} />
            </span>
          </div>
          <p>chatbot messages</p>
          <h2>{data.chatbot.messages.toLocaleString()}</h2>
          <small>{data.chatbot.sessions} conversations in this period</small>
        </div>
      </div>

      <div className="analytics-main-grid">
        <section className="analytics-box traffic-box">
          <div className="analytics-box-head">
            <div>
              <p>traffic</p>
              <h3>page views & unique visitors</h3>
            </div>

            <div className="chart-legend">
              <span>
                <i className="users-dot"></i>
                visitors
              </span>
              <span>
                <i className="views-dot"></i>
                views
              </span>
            </div>
          </div>

          <div className="traffic-chart">
            <div className="chart-scale">
              {[1, 0.75, 0.5, 0.25, 0].map((f) => (
                <span key={f}>{Math.round(maxBar * f)}</span>
              ))}
            </div>

            <div className="chart-area">
              <div className="chart-grid-lines">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="analytics-bars">
                {buckets.map((item) => (
                  <div className="analytics-bar-item" key={item.label} title={`${item.label}: ${item.views} views, ${item.visitors} visitors`}>
                    <div className="bar-pair">
                      <div className="traffic-bar users-bar" style={{ height: `${(item.visitors / maxBar) * 100}%` }}></div>
                      <div className="traffic-bar views-bar" style={{ height: `${(item.views / maxBar) * 100}%` }}></div>
                    </div>
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="analytics-box fandom-analytics">
          <div className="analytics-box-head">
            <div>
              <p>community</p>
              <h3>popular categories</h3>
            </div>
            <BarChart3 size={18} />
          </div>

          <div className="fandom-analytics-list">
            {data.popularCategories.map((cat, index) => (
              <div className="analytics-fandom" key={cat._id}>
                <div className="analytics-fandom-info">
                  <span>{cat.name}</span>
                  <small>
                    {cat.views.toLocaleString()} views · {cat.items} items · {cat.fans} fans
                  </small>
                </div>
                <div className="analytics-progress">
                  <span className={FANDOM_CLASSES[index % FANDOM_CLASSES.length]} style={{ width: `${Math.max(3, (cat.views / maxCategory) * 100)}%` }}></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="analytics-second-grid">
        <section className="analytics-box">
          <div className="analytics-box-head">
            <div>
              <p>traffic source</p>
              <h3>devices</h3>
            </div>
          </div>

          <div className="device-list">
            {data.devices.map((device) => {
              const Icon = DEVICE_ICONS[device.name];
              return (
                <div className="device-item" key={device.name}>
                  <span className={`device-icon ${device.name === "desktop" ? "" : device.name}`}>
                    <Icon size={18} />
                  </span>
                  <div className="device-info">
                    <div>
                      <strong>{device.name}</strong>
                      <span>
                        {device.percent}% ({device.count})
                      </span>
                    </div>
                    <div className="device-progress">
                      <span style={{ width: `${device.percent}%` }}></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="analytics-box">
          <div className="analytics-box-head">
            <div>
              <p>assistant</p>
              <h3>chatbot interaction volume</h3>
            </div>
            <Bot size={18} />
          </div>

          <div className="fh-spark" role="img" aria-label="Chatbot messages over time">
            {buckets.map((b) => (
              <span key={b.label} style={{ height: `${Math.max(3, (b.chats / maxChat) * 100)}%` }} title={`${b.label}: ${b.chats} messages`} />
            ))}
          </div>

          <div className="growth-details">
            <div>
              <span>all-time conversations</span>
              <strong>{chatStats?.sessions ?? "-"}</strong>
            </div>
            <div>
              <span>messages this week</span>
              <strong>{chatStats?.messagesThisWeek ?? "-"}</strong>
            </div>
            {chatStats?.intents?.slice(0, 3).map((intent) => (
              <div key={intent._id}>
                <span>{intent._id} replies</span>
                <strong>{intent.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-box">
          <div className="analytics-box-head">
            <div>
              <p>security</p>
              <h3>sign-ins</h3>
            </div>
            <LogIn size={18} />
          </div>

          <div className="growth-overview">
            <div className="growth-number">
              <span className="growth-icon">
                <UserPlus size={21} />
              </span>
              <div>
                <p>successful logins</p>
                <h2>{data.logins.success}</h2>
              </div>
            </div>
            <div className="growth-percentage">
              <TrendingUp size={15} />
              {totalLogins ? Math.round((data.logins.success / totalLogins) * 100) : 0}%
            </div>
          </div>

          <div className="growth-details">
            <div>
              <span>failed attempts</span>
              <strong>{data.logins.failed}</strong>
            </div>
            <div>
              <span>bookmarks saved (all time)</span>
              <strong>{data.counts.bookmarks}</strong>
            </div>
            <div>
              <span>pending submissions</span>
              <strong>{data.counts.pendingSubmissions}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="analytics-box popular-pages">
        <div className="analytics-box-head">
          <div>
            <p>content performance</p>
            <h3>top pages</h3>
          </div>
        </div>

        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>page</th>
                <th>views</th>
                <th>unique visitors</th>
                <th>share of traffic</th>
              </tr>
            </thead>

            <tbody>
              {data.topPages.length === 0 && (
                <tr>
                  <td colSpan={4}>No page views recorded in this period yet.</td>
                </tr>
              )}
              {data.topPages.map((page) => (
                <tr key={page._id}>
                  <td>{page._id}</td>
                  <td>{page.views.toLocaleString()}</td>
                  <td>{page.visitors.toLocaleString()}</td>
                  <td>{data.pageViews.total ? Math.round((page.views / data.pageViews.total) * 1000) / 10 : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Analytics;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";

import api from "../../services/api";
import Loader from "../common/Loader";

function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/events?upcoming=true"), api.get("/releases")])
      .then(([eventData, releaseData]) => {
        setEvents(eventData.slice(0, 4));
        setReleases(releaseData.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading what's next..." />;

  return (
    <div className="fh-upcoming">
      <div className="fh-upcoming-col">
        <h3>
          <CalendarDays size={16} /> Upcoming events
        </h3>
        {events.length === 0 && <p className="fh-muted">No upcoming events yet.</p>}
        {events.map((event) => {
          const d = new Date(event.date);
          return (
            <Link key={event._id} to={`/events/${event._id}`} className="fh-upcoming-row">
              <span className="fh-date-chip">
                <strong>{isNaN(d) ? "--" : d.getDate()}</strong>
                <small>{isNaN(d) ? "" : d.toLocaleString("en-US", { month: "short" })}</small>
              </span>
              <span>
                <strong>{event.name}</strong>
                <small>
                  <MapPin size={11} /> {[event.city, event.country].filter(Boolean).join(", ") || event.venue}
                </small>
              </span>
            </Link>
          );
        })}
        <Link to="/events" className="fh-text-link">
          Map & calendar
        </Link>
      </div>

      <div className="fh-upcoming-col">
        <h3>Anticipated releases</h3>
        {releases.length === 0 && <p className="fh-muted">No upcoming releases yet.</p>}
        {releases.map((release) => (
          <div key={release._id} className="fh-upcoming-row static">
            <span className="fh-type-chip">{release.releaseType}</span>
            <span>
              <strong>{release.title}</strong>
              <small>
                {new Date(release.releaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {release.platform ? ` · ${release.platform}` : ""}
              </small>
            </span>
          </div>
        ))}
        <Link to="/shop#releases" className="fh-text-link">
          All releases
        </Link>
      </div>
    </div>
  );
}

export default UpcomingEvents;

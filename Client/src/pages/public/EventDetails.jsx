import { useEffect, useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Users, Ticket, Navigation, Sparkles } from "lucide-react";

import Loader from "../../components/common/Loader";
import BookmarkButton from "../../components/common/BookmarkButton";
import ShareButton from "../../components/common/ShareButton";
const EventsMap = lazy(() => import("../../components/events/EventsMap"));
import api, { assetUrl } from "../../services/api";
import { useBreadcrumb } from "../../context/BreadcrumbContext";
import "../../styles/pages/event-details.css";

function formatFullDate(dateString) {
  const d = new Date(`${dateString}T00:00:00`);
  if (isNaN(d)) return dateString;
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useBreadcrumb(event?.name);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/events/${id}`)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Loader label="Loading event..." fullPage />;
  }

  if (!event) {
    return (
      <div className="event-details-page">
        <div className="event-not-found">
          <h2>Event not found</h2>
          <p>This event doesn't exist or may have already ended.</p>
          <Link to="/events" className="event-back-link">
            <ArrowLeft size={16} />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const isPast = event.date < new Date().toISOString().slice(0, 10);
  const hasLocation = Number.isFinite(event.latitude) && Number.isFinite(event.longitude);
  const location = [event.venue, event.address, event.city, event.country].filter(Boolean).join(", ");

  return (
    <div className="event-details-page">
      <section
        className="event-banner fh-keep-colors"
        style={{ backgroundImage: event.imageUrl ? `url(${assetUrl(event.imageUrl)})` : "none" }}
      >
        <div className="event-banner-overlay" />

        <Link to="/events" className="event-back-link">
          <ArrowLeft size={16} />
          All Events
        </Link>

        <motion.div
          className="event-banner-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="event-category-badge accent-purple">
            {[event.eventType, event.category?.name].filter(Boolean).join(" · ") || "Event"}
          </span>
          <h1>{event.name}</h1>
        </motion.div>
      </section>

      <section className="event-details-body">
        <div className="event-main">
          <h3>About this event</h3>
          <p>{event.description || "No description added yet."}</p>

          {event.highlight && (
            <div className="fh-highlight-box">
              <h3>
                <Sparkles size={16} /> {isPast ? "How it went" : "What to expect"}
              </h3>
              <p>{event.highlight}</p>
            </div>
          )}

          {hasLocation && (
            <>
              <h3>Location</h3>
              <Suspense fallback={<Loader label="Loading map..." />}>
                <EventsMap events={[event]} height={300} />
              </Suspense>
            </>
          )}
        </div>

        <div className="event-sidebar">
          <div className="event-info-row">
            <CalendarDays size={18} />
            <div>
              <small>Date</small>
              <p>{formatFullDate(event.date)}</p>
            </div>
          </div>

          <div className="event-info-row">
            <Clock3 size={18} />
            <div>
              <small>Time</small>
              <p>{event.time || "TBA"}</p>
            </div>
          </div>

          <div className="event-info-row">
            <MapPin size={18} />
            <div>
              <small>Location</small>
              <p>{location || "TBA"}</p>
            </div>
          </div>

          <div className="event-info-row">
            <Users size={18} />
            <div>
              <small>Expected Attendees</small>
              <p>{event.capacity || "-"}</p>
            </div>
          </div>

          {isPast ? (
            <p className="fh-muted">This event has ended.</p>
          ) : event.ticketUrl ? (
            <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="event-ticket-btn">
              <Ticket size={16} />
              Get Tickets
            </a>
          ) : (
            <p className="fh-muted">Free entry or tickets not announced yet.</p>
          )}

          {hasLocation && (
            <a
              className="fh-action-btn"
              href={`https://www.openstreetmap.org/directions?to=${event.latitude}%2C${event.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation size={16} /> Directions
            </a>
          )}

          <div className="fh-action-row">
            <BookmarkButton itemType="Event" itemId={event._id} />
            <ShareButton title={event.name} text={`${event.name} on ${event.date}`} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default EventDetails;

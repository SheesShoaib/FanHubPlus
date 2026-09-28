import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  LayoutGrid,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";

import Loader from "../../components/common/Loader";
import BookmarkButton from "../../components/common/BookmarkButton";
const EventsMap = lazy(() => import("../../components/events/EventsMap"));
import EventCalendar from "../../components/events/EventCalendar";
import api, { assetUrl, toQuery } from "../../services/api";
import useSavedIds from "../../hooks/useSavedIds";
import "../../styles/pages/events.css";

const HERO_FALLBACK = "/images/events/anime-convention.png";

const VIEWS = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

function formatShortDate(dateString) {
  const d = new Date(`${dateString}T00:00:00`);
  if (isNaN(d)) return { day: "--", month: "---" };
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
  };
}

function formatFullDate(dateString) {
  const d = new Date(`${dateString}T00:00:00`);
  if (isNaN(d)) return dateString;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function toKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

const todayKey = () => toKey(new Date());

const DATE_FILTERS = [
  { id: "any", label: "Any date" },
  { id: "today", label: "Today" },
  { id: "week", label: "Next 7 days" },
  { id: "weekend", label: "This weekend" },
  { id: "month", label: "This month" },
  { id: "next-month", label: "Next month" },
  { id: "custom", label: "Pick dates" },
];

function dateRange(when, from, to) {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const shift = (days) => new Date(y, m, today.getDate() + days);

  switch (when) {
    case "today":
      return [toKey(today), toKey(today)];
    case "week":
      return [toKey(today), toKey(shift(6))];
    case "weekend": {
      const day = today.getDay();
      if (day === 0) return [toKey(today), toKey(today)];
      return [toKey(day === 6 ? today : shift(6 - day)), toKey(shift(7 - day))];
    }
    case "month":
      return [toKey(today), toKey(new Date(y, m + 1, 0))];
    case "next-month":
      return [toKey(new Date(y, m + 1, 1)), toKey(new Date(y, m + 2, 0))];
    case "custom":
      return from && to && from > to ? [to, from] : [from || null, to || null];
    default:
      return [null, null];
  }
}

function Events() {
  const isSaved = useSavedIds("Event");

  const [events, setEvents] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("All");
  const [city, setCity] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [when, setWhen] = useState("any");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(500);
  const [nearby, setNearby] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/events"), api.get("/events/cities")])
      .then(([eventData, cityData]) => {
        setEvents(eventData);
        setCities(cityData);
      })
      .catch((err) => console.error("Failed to load events:", err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    api
      .get(`/events/nearby${toQuery({ lat: userLocation.lat, lng: userLocation.lng, radius })}`)
      .then(setNearby)
      .catch((err) => setLocationError(err.message));
  }, [userLocation, radius]);

  const scrollToResults = () =>
    document.getElementById("discover-events")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const locateMe = (fromHero = false) => {
    if (fromHero) setView("grid");
    if (fromHero && userLocation) {
      scrollToResults();
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location services.");
      if (fromHero) scrollToResults();
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        if (fromHero) scrollToResults();
        else if (view === "calendar") setView("map");
      },
      (err) => {
        setLocating(false);
        if (fromHero) scrollToResults();
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was blocked. Allow it in your browser to find nearby events, or filter by city instead."
            : "We couldn't get your location. Try again or filter by city."
        );
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const clearLocation = () => {
    setUserLocation(null);
    setNearby(null);
  };

  const categories = useMemo(() => {
    const names = events.map((event) => event.category?.name).filter(Boolean);
    return ["All", ...new Set(names)];
  }, [events]);

  const upcoming = useMemo(() => events.filter((e) => e.date >= todayKey()), [events]);
  const highlights = useMemo(
    () => events.filter((e) => e.date < todayKey() && e.highlight).sort((a, b) => b.date.localeCompare(a.date)),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const source = nearby ? nearby.filter((e) => e.date >= todayKey()) : upcoming;
    const [from, to] = dateRange(when, fromDate, toDate);

    return source.filter((event) => {
      const categoryMatch = activeCategory === "All" || event.category?.name === activeCategory;
      const cityMatch = city === "all" || event.city?.toLowerCase() === city.toLowerCase();
      const dateMatch = (!from || event.date >= from) && (!to || event.date <= to);
      const searchMatch =
        !query ||
        event.name.toLowerCase().includes(query) ||
        event.venue?.toLowerCase().includes(query) ||
        event.city?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query);

      return categoryMatch && cityMatch && dateMatch && searchMatch;
    });
  }, [upcoming, nearby, activeCategory, city, search, when, fromDate, toDate]);

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setCity("all");
    setWhen("any");
    setFromDate("");
    setToDate("");
    clearLocation();
  };

  const featured = upcoming[0] || events[0];

  if (loading) {
    return (
      <main className="events-page">
        <Loader label="Loading events..." fullPage />
      </main>
    );
  }

  return (
    <main className="events-page">
      <section className="events-hero">
        <img
          className="events-hero-image"
          src={featured?.imageUrl ? assetUrl(featured.imageUrl) : HERO_FALLBACK}
          alt=""
          draggable="false"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(HERO_FALLBACK)) e.currentTarget.src = HERO_FALLBACK;
          }}
        />

        <div className="events-hero-overlay" />
        <div className="events-hero-grid" />
        <div className="events-hero-glow" />

        <div className="site-container events-hero-inner">
          <motion.div
            className="events-hero-copy"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="events-featured-badge">
              <Sparkles size={14} />
              Next up
            </div>

            <h1>
              WHERE FANDOM
              <span>COMES ALIVE.</span>
            </h1>

            <p>
              Conventions, cosplay meetups, screenings and concerts. Find what's on near you, browse the
              calendar and grab tickets.
            </p>

            {featured && (
              <div className="events-featured-details">
                <span>
                  <CalendarDays size={15} />
                  {formatFullDate(featured.date)}
                </span>
                <span>
                  <Clock3 size={15} />
                  {featured.time || "TBA"}
                </span>
                <span>
                  <MapPin size={15} />
                  {[featured.venue, featured.city].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            <div className="events-hero-actions">
              {featured && (
                <Link to={`/events/${featured._id}`} className="events-primary-btn">
                  <Ticket size={17} />
                  {featured.name}
                  <ArrowRight size={16} />
                </Link>
              )}

              <button className="events-secondary-btn" type="button" onClick={() => locateMe(true)} disabled={locating}>
                <LocateFixed size={17} />
                {locating ? "Locating..." : userLocation ? "Show events near me" : "Events near me"}
              </button>
            </div>
          </motion.div>
        </div>

        <div className="events-hero-bottom">
          <span>UPCOMING EXPERIENCES</span>
          <div />
        </div>
      </section>

      <section className="events-discovery" id="discover-events">
        <div className="site-container">
          <div className="events-section-heading">
            <div>
              <span className="events-kicker">FIND YOUR NEXT EXPERIENCE</span>

              <h2>
                Upcoming across the
                <span className="gradient-text"> universe.</span>
              </h2>

              <p>Filter by city or fandom, see everything on a map, or plan ahead with the calendar.</p>
            </div>

            <span className="events-result-count" aria-live="polite">
              {filteredEvents.length} events found
            </span>
          </div>

          <div className="events-search">
            <Search size={19} />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search events, venues, cities..."
              aria-label="Search events"
            />

            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear event search">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="fh-filter-bar">
            <label>
              <span>City</span>
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="all">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>When</span>
              <select value={when} onChange={(e) => setWhen(e.target.value)}>
                {DATE_FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>

            {when === "custom" && (
              <div className="events-date-range">
                <input
                  type="date"
                  value={fromDate}
                  min={todayKey()}
                  onChange={(e) => setFromDate(e.target.value)}
                  aria-label="From date"
                />
                <span>to</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || todayKey()}
                  onChange={(e) => setToDate(e.target.value)}
                  aria-label="To date"
                />
              </div>
            )}

            {userLocation ? (
              <>
                <label>
                  <span>Within</span>
                  <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                    {[25, 100, 500, 2000, 20000].map((r) => (
                      <option key={r} value={r}>
                        {r >= 20000 ? "Anywhere" : `${r} km`}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="fh-filter-reset" onClick={clearLocation}>
                  Clear location
                </button>
              </>
            ) : (
              <button type="button" className="fh-filter-toggle" onClick={() => locateMe()} disabled={locating}>
                <LocateFixed size={15} />
                {locating ? "Locating..." : "Use my location"}
              </button>
            )}

            <div className="fh-view-toggle" role="tablist" aria-label="Event view">
              {VIEWS.map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="tab"
                    aria-selected={view === v.id}
                    className={view === v.id ? "active" : ""}
                    onClick={() => setView(v.id)}
                  >
                    <Icon size={15} />
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          {locationError && <p className="fh-inline-error">{locationError}</p>}
          {userLocation && !locationError && (
            <p className="fh-inline-note">
              <LocateFixed size={13} /> Showing events within {radius >= 20000 ? "any distance" : `${radius} km`} of you, nearest first.
            </p>
          )}

          <div className="events-filters">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? "event-filter active" : "event-filter"}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {view === "map" && (
            <Suspense fallback={<Loader label="Loading map..." />}>
              <EventsMap events={filteredEvents} userLocation={userLocation} />
            </Suspense>
          )}

          {view === "calendar" && <EventCalendar events={filteredEvents} />}

          {view === "grid" && (
            <motion.div layout className="events-grid">
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event, index) => {
                  const shortDate = formatShortDate(event.date);

                  return (
                    <motion.article
                      layout
                      key={event._id}
                      className="event-card"
                      initial={{ opacity: 0, y: 35, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.45, delay: index * 0.05 }}
                    >
                      <div className="event-image">
                        {event.imageUrl ? (
                          <img
                            src={assetUrl(event.imageUrl)}
                            alt=""
                            draggable="false"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.visibility = "hidden";
                            }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "var(--bg-soft)" }} />
                        )}

                        <div className="event-image-overlay" />

                        <div className="event-card-top">
                          <span>{event.eventType || event.category?.name || "Event"}</span>

                          <BookmarkButton
                            itemType="Event"
                            itemId={event._id}
                            className="event-save"
                            showLabel={false}
                            initialSaved={isSaved(event._id)}
                          />
                        </div>

                        <div className="event-date">
                          <strong>{shortDate.day}</strong>
                          <span>{shortDate.month}</span>
                        </div>
                      </div>

                      <div className="event-content">
                        <div className="event-small-meta">
                          <span>
                            <Clock3 size={12} />
                            {event.time || "TBA"}
                          </span>

                          <i />

                          <span>
                            <Users size={12} />
                            {event.capacity || "-"}
                          </span>

                          {Number.isFinite(event.distanceKm) && (
                            <>
                              <i />
                              <span title={event.approximate ? "Approximate - based on the event's city" : undefined}>
                                <LocateFixed size={12} />
                                {event.approximate ? "~" : ""}
                                {event.distanceKm} km
                              </span>
                            </>
                          )}
                        </div>

                        <h3>{event.name}</h3>

                        <div className="event-location">
                          <MapPin size={13} />
                          {[event.venue, event.city].filter(Boolean).join(", ")}
                        </div>

                        <p>{event.description}</p>

                        <div className="event-card-footer">
                          {event.ticketUrl ? (
                            <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                              <Ticket size={14} /> Tickets
                            </a>
                          ) : (
                            <span>{formatFullDate(event.date)}</span>
                          )}

                          <Link to={`/events/${event._id}`}>
                            View details
                            <ArrowUpRight size={15} />
                          </Link>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {filteredEvents.length === 0 && view === "grid" && (
            <motion.div className="events-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div>
                <CalendarDays size={26} />
              </div>

              <h3>No events found.</h3>

              <p>
                {events.length === 0
                  ? "No events yet - add some from the admin panel."
                  : userLocation
                    ? "Nothing matches near you - try a bigger distance, another date or clear your location."
                    : "Try another category, city, date or search term."}
              </p>

              <button type="button" onClick={resetFilters}>
                Reset events
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {highlights.length > 0 && (
        <section className="fh-highlights site-container" aria-labelledby="highlights-heading">
          <span className="events-kicker">EVENT HIGHLIGHTS</span>
          <h2 id="highlights-heading">
            Stories from <span className="gradient-text">past events.</span>
          </h2>

          <ol className="fh-story-timeline">
            {highlights.map((event, index) => (
              <motion.li
                key={event._id}
                className={index % 2 ? "right" : "left"}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <span className="fh-story-dot" aria-hidden="true" />
                <div className="fh-story-card">
                  {event.imageUrl && <img src={assetUrl(event.imageUrl)} alt="" loading="lazy" />}
                  <div>
                    <small>
                      {formatFullDate(event.date)} · {event.eventType} · {event.city}
                    </small>
                    <h3>{event.name}</h3>
                    <p>{event.highlight}</p>
                    <Link to={`/events/${event._id}`} className="fh-text-link">
                      Read more <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>
      )}

      <section className="events-community">
        <div className="events-community-glow" />

        <motion.div
          className="site-container events-community-inner"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <Users size={23} />

          <span>MEET YOUR PEOPLE</span>

          <h2>
            Online fandom.
            <br />
            <span className="gradient-text">Real-world memories.</span>
          </h2>

          <p>
            Find communities, attend unforgettable events and meet fans who understand exactly why these
            worlds matter.
          </p>

          <a href="#discover-events" className="fh-btn">
            Browse all events
            <ArrowRight size={16} />
          </a>
        </motion.div>
      </section>
    </main>
  );
}

export default Events;

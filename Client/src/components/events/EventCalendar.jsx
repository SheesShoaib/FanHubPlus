import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Ticket } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function EventCalendar({ events }) {
  const firstUpcoming = events.find((e) => e.date >= toKey(new Date()));
  const [cursor, setCursor] = useState(() => {
    const start = firstUpcoming ? new Date(`${firstUpcoming.date}T00:00:00`) : new Date();
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });
  const [selected, setSelected] = useState(null);

  const byDay = useMemo(() => {
    const map = {};
    events.forEach((event) => {
      const key = String(event.date).slice(0, 10);
      (map[key] = map[key] || []).push(event);
    });
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const leading = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) list.push(new Date(year, month, day));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [cursor]);

  const shiftMonth = (delta) => {
    setSelected(null);
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const monthEvents = events.filter((e) => String(e.date).startsWith(toKey(cursor).slice(0, 7)));
  const listed = selected ? byDay[selected] || [] : monthEvents;
  const todayKey = toKey(new Date());

  return (
    <div className="fh-calendar">
      <div className="fh-calendar-head">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <h3>{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="fh-calendar-grid" role="grid">
        {WEEKDAYS.map((day) => (
          <span key={day} className="fh-calendar-weekday" role="columnheader">
            {day}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} className="fh-calendar-cell blank" />;
          const key = toKey(date);
          const dayEvents = byDay[key] || [];
          const classes = ["fh-calendar-cell"];
          if (dayEvents.length) classes.push("has-events");
          if (key === selected) classes.push("selected");
          if (key === todayKey) classes.push("today");

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              className={classes.join(" ")}
              onClick={() => setSelected(key === selected ? null : key)}
              aria-label={`${date.toDateString()}${dayEvents.length ? `, ${dayEvents.length} event(s)` : ""}`}
            >
              <span>{date.getDate()}</span>
              {dayEvents.slice(0, 2).map((e) => (
                <small key={e._id}>{e.name}</small>
              ))}
              {dayEvents.length > 2 && <small>+{dayEvents.length - 2} more</small>}
            </button>
          );
        })}
      </div>

      <div className="fh-calendar-list">
        <h4>
          {selected
            ? new Date(`${selected}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
            : "This month"}
        </h4>
        {listed.length === 0 && <p className="fh-muted">No events {selected ? "on this day" : "this month"}.</p>}
        {listed.map((event) => (
          <div key={event._id} className="fh-calendar-item">
            <div>
              <Link to={`/events/${event._id}`}>{event.name}</Link>
              <small>
                {event.date} · {event.time || "TBA"} · {[event.venue, event.city].filter(Boolean).join(", ")}
              </small>
            </div>
            {event.ticketUrl && (
              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="fh-ticket-link">
                <Ticket size={14} /> Tickets
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventCalendar;

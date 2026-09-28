import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Edit3,
  ImagePlus,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import StatCard from "../../components/admin/StatCard";
import api, { assetUrl } from "../../services/api";
import "../../styles/admin/dashboard.css";
import "../../styles/admin/manager-shared.css";
import "../../styles/admin/manage-events.css";

const EVENT_TYPES = ["Convention", "Meetup", "Screening", "Premiere", "Release", "Concert", "Tournament", "Other"];

const emptyForm = {
  name: "",
  category: "",
  eventType: "Convention",
  date: "",
  time: "",
  venue: "",
  address: "",
  city: "",
  country: "",
  latitude: "",
  longitude: "",
  ticketUrl: "",
  capacity: "",
  description: "",
  highlight: "",
};

function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, catData] = await Promise.all([
          api.get("/events"),
          api.get("/categories"),
        ]);
        setEvents(eventData);
        setCategories(catData);
      } catch (err) {
        console.error("Failed to load events:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return events.filter(
      (item) =>
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.venue?.toLowerCase().includes(search.toLowerCase())
    );
  }, [events, search]);

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, category: categories[0]?._id || "" });
    resetImageState();
    setModalOpen(true);
  };

  const openEdit = (event) => {
    setEditingId(event._id);
    setForm({
      name: event.name,
      category: event.category?._id || "",
      eventType: event.eventType || "Convention",
      date: event.date || "",
      time: event.time || "",
      venue: event.venue || "",
      address: event.address || "",
      city: event.city || "",
      country: event.country || "",
      latitude: event.latitude ?? "",
      longitude: event.longitude ?? "",
      ticketUrl: event.ticketUrl || "",
      capacity: event.capacity || "",
      description: event.description || "",
      highlight: event.highlight || "",
    });
    setImageFile(null);
    setImagePreview(event.imageUrl || "");
    setModalOpen(true);
  };

  const handleChange = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
  };

  const [geoStatus, setGeoStatus] = useState("");

  const lookupCoordinates = async () => {
    const query = [form.venue, form.address, form.city, form.country].filter(Boolean).join(", ");
    if (!query) {
      setGeoStatus("Enter a venue, city or address first.");
      return;
    }
    setGeoStatus("Looking up...");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      const [hit] = await res.json();
      if (!hit) {
        setGeoStatus("No match found. Try adding the city and country.");
        return;
      }
      setForm((current) => ({ ...current, latitude: Number(hit.lat).toFixed(5), longitude: Number(hit.lon).toFixed(5) }));
      setGeoStatus(`Found: ${hit.display_name.slice(0, 80)}`);
    } catch {
      setGeoStatus("Lookup failed. You can type the coordinates manually.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (imageFile) formData.append("image", imageFile);

    try {
      if (editingId) {
        const updated = await api.putForm(`/events/${editingId}`, formData);
        setEvents((current) => current.map((item) => (item._id === editingId ? updated : item)));
      } else {
        const created = await api.postForm("/events", formData);
        setEvents((current) => [created, ...current]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="manager-page">Loading...</div>;

  return (
    <div className="manager-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">store & events</p>
          <h1>Events</h1>
          <p className="manager-subtitle">Manage fandom conventions, meetups, and screenings.</p>
        </div>

        <button type="button" className="manager-add-btn" onClick={openAdd}>
          <Plus size={16} />
          Add event
        </button>
      </div>

      <div className="manager-stats">
        <StatCard icon={CalendarDays} color="purple" label="total events" value={events.length} />
        <StatCard icon={Users} color="blue" label="upcoming" value={events.length} />
      </div>

      <div className="manager-toolbar">
        <div className="manager-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="manager-table-wrap">
        {filtered.length === 0 ? (
          <div className="manager-empty">
            <CalendarDays size={26} />
            <h3>No events found</h3>
            <p>Try a different search, or add a new event.</p>
          </div>
        ) : (
          <>
            <table className="manager-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr key={event._id}>
                    <td>
                      {event.imageUrl ? (
                        <img
                          src={assetUrl(event.imageUrl)}
                          alt={event.name}
                          style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1c2740" }} />
                      )}
                    </td>
                    <td>
                      <div className="manager-title-cell">
                        <strong>{event.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="manager-badge purple">{event.category?.name || "-"}</span>
                    </td>
                    <td>{event.date}</td>
                    <td>
                      <span className="events-location">
                        <MapPin size={12} />
                        {event.venue || "-"}
                      </span>
                    </td>
                    <td>
                      <div className="manager-row-actions">
                        <button type="button" className="manager-icon-btn" onClick={() => openEdit(event)} aria-label="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button type="button" className="manager-icon-btn danger" onClick={() => handleDelete(event._id)} aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="manager-table-footer">
              <span>{filtered.length} of {events.length} events</span>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="manager-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="manager-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manager-modal-head">
              <h2>{editingId ? "Edit event" : "Add event"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="manager-form-group">
                <label>Event image</label>
                <label
                  htmlFor="event-image"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px",
                    border: "1px dashed rgba(255,255,255,0.15)",
                    borderRadius: "10px",
                    cursor: "pointer",
                  }}
                >
                  {imagePreview ? (
                    <img
                      src={assetUrl(imagePreview)}
                      alt="Preview"
                      style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: "#0e0e16", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ImagePlus size={22} color="#6b6b80" />
                    </div>
                  )}
                  <span style={{ color: "#9494a8", fontSize: "0.85rem" }}>
                    {imagePreview ? "Click to change image" : "Click to upload an image"}
                  </span>
                </label>
                <input id="event-image" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </div>

              <div className="manager-form-group">
                <label htmlFor="event-name">Event name</label>
                <input id="event-name" type="text" value={form.name} onChange={handleChange("name")} required />
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="event-category">Category</label>
                  <select id="event-category" value={form.category} onChange={handleChange("category")}>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="manager-form-group">
                  <label htmlFor="event-date">Date</label>
                  <input id="event-date" type="date" value={form.date} onChange={handleChange("date")} required />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="event-time">Time</label>
                  <input id="event-time" type="text" value={form.time} onChange={handleChange("time")} placeholder="10:00 AM" />
                </div>

                <div className="manager-form-group">
                  <label htmlFor="event-venue">Venue</label>
                  <input id="event-venue" type="text" value={form.venue} onChange={handleChange("venue")} required />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="event-type">Event type</label>
                  <select id="event-type" value={form.eventType} onChange={handleChange("eventType")}>
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="manager-form-group">
                  <label htmlFor="event-capacity">Expected attendees</label>
                  <input id="event-capacity" type="text" value={form.capacity} onChange={handleChange("capacity")} placeholder="e.g. 4.8K" />
                </div>
              </div>

              <div className="manager-form-group">
                <label htmlFor="event-address">Address</label>
                <input id="event-address" type="text" value={form.address} onChange={handleChange("address")} />
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="event-city">City</label>
                  <input id="event-city" type="text" value={form.city} onChange={handleChange("city")} placeholder="Used for the city filter" />
                </div>

                <div className="manager-form-group">
                  <label htmlFor="event-country">Country</label>
                  <input id="event-country" type="text" value={form.country} onChange={handleChange("country")} />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="event-lat">Latitude</label>
                  <input id="event-lat" type="number" step="any" value={form.latitude} onChange={handleChange("latitude")} />
                </div>

                <div className="manager-form-group">
                  <label htmlFor="event-lng">Longitude</label>
                  <input id="event-lng" type="number" step="any" value={form.longitude} onChange={handleChange("longitude")} />
                </div>
              </div>

              <div className="fh-geo-row">
                <button type="button" className="manager-cancel-btn" onClick={lookupCoordinates}>
                  <MapPin size={14} /> Look up coordinates
                </button>
                {geoStatus && <small className="fh-muted">{geoStatus}</small>}
              </div>

              <div className="manager-form-group">
                <label htmlFor="event-ticket">Ticket link</label>
                <input id="event-ticket" type="url" value={form.ticketUrl} onChange={handleChange("ticketUrl")} placeholder="https://..." />
              </div>

              <div className="manager-form-group">
                <label htmlFor="event-desc">Description</label>
                <textarea id="event-desc" rows={3} value={form.description} onChange={handleChange("description")} />
              </div>

              <div className="manager-form-group">
                <label htmlFor="event-highlight">Highlight story (shown in "Event highlights" once the event has passed)</label>
                <textarea id="event-highlight" rows={3} value={form.highlight} onChange={handleChange("highlight")} placeholder="What made this event memorable?" />
              </div>

              <div className="manager-modal-actions">
                <button type="button" className="manager-cancel-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="manager-save-btn">
                  {editingId ? "Save changes" : "Add event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventsManagement;
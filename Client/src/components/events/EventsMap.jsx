import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

const eventIcon = L.divIcon({ className: "fh-map-pin", html: "<span></span>", iconSize: [22, 22], iconAnchor: [11, 22] });
const userIcon = L.divIcon({ className: "fh-map-user", html: "<span></span>", iconSize: [18, 18], iconAnchor: [9, 9] });

function FitBounds({ points }) {
  const map = useMap();
  const signature = points.map((p) => p.join(",")).join("|");

  useEffect(() => {
    if (!signature) return;
    const latLngs = signature.split("|").map((p) => p.split(",").map(Number));
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 11);
      return;
    }
    map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 12 });
  }, [map, signature]);

  return null;
}

function EventsMap({ events, userLocation, height = 420 }) {
  const located = events.filter((e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude));
  const points = located.map((e) => [e.latitude, e.longitude]);
  if (userLocation) points.push([userLocation.lat, userLocation.lng]);

  return (
    <div className="fh-map" style={{ height }}>
      <MapContainer center={[25, 60]} zoom={3} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {located.map((event) => (
          <Marker key={event._id} position={[event.latitude, event.longitude]} icon={eventIcon}>
            <Popup>
              <strong>{event.name}</strong>
              <br />
              {event.date} · {event.venue}
              {event.city ? `, ${event.city}` : ""}
              {Number.isFinite(event.distanceKm) && (
                <>
                  <br />
                  {event.distanceKm} km away
                </>
              )}
              <br />
              <Link to={`/events/${event._id}`}>View event</Link>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        <FitBounds points={points} />
      </MapContainer>

      {located.length === 0 && <p className="fh-map-empty">No events with a map location match these filters.</p>}
    </div>
  );
}

export default EventsMap;

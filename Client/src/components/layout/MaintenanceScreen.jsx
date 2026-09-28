import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";

function MaintenanceScreen({ message, siteName, maintenanceUntil }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!maintenanceUntil) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [maintenanceUntil]);

  const remainingSeconds = maintenanceUntil
    ? Math.max(0, Math.ceil((new Date(maintenanceUntil).getTime() - now) / 1000))
    : null;
  const countdown = remainingSeconds === null
    ? null
    : [
        Math.floor(remainingSeconds / 3600),
        Math.floor((remainingSeconds % 3600) / 60),
        remainingSeconds % 60,
      ]
        .map((part) => String(part).padStart(2, "0"))
        .join(":");

  return (
    <main className="fh-maintenance">
      <div className="fh-maintenance-card">
        <Wrench size={34} />
        <h1>{siteName} is getting an upgrade</h1>
        <p>{message || "We'll be back soon!"}</p>
        {countdown !== null && <p className="fh-maintenance-countdown">Estimated time remaining: <strong>{countdown}</strong></p>}
        <Link to="/login">Admin login</Link>
      </div>
    </main>
  );
}

export default MaintenanceScreen;

import { Link } from "react-router-dom";
import { Compass, Home, Sparkles } from "lucide-react";

import "../../styles/pages/not-found.css";

function NotFound() {
  return (
    <section className="notfound-page">
      <div className="notfound-glow" />

      <div className="notfound-content">
        <span className="notfound-badge">
          <Sparkles size={14} />
          Lost in the multiverse
        </span>

        <h1 className="notfound-code">404</h1>

        <h2 className="notfound-title">This universe doesn't exist... yet</h2>
        <p className="notfound-text">
          The page you're looking for may have been moved, renamed, or
          maybe it's from a fandom we haven't added. Let's get you back
          somewhere familiar.
        </p>

        <div className="notfound-actions">
          <Link to="/" className="notfound-btn notfound-btn-primary">
            <Home size={18} />
            Back to Home
          </Link>

          <Link to="/explore" className="notfound-btn notfound-btn-outline">
            <Compass size={18} />
            Explore Fandoms
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NotFound;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function StarRating({ contentId, compact = false }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [summary, setSummary] = useState({ ratingAverage: 0, ratingCount: 0, myRating: 0 });
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!contentId) return;
    api
      .get(`/ratings/${contentId}`)
      .then(setSummary)
      .catch(() => {});
  }, [contentId, isAuthenticated]);

  const rate = async (value) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: window.location.pathname, search: window.location.search } } });
      return;
    }
    setSaving(true);
    try {
      const data =
        value === summary.myRating
          ? await api.delete(`/ratings/${contentId}`)
          : await api.post("/ratings", { content: contentId, value });
      setSummary((current) => ({ ...current, ...data }));
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const shown = hover || summary.myRating;

  return (
    <div className={compact ? "fh-rating compact" : "fh-rating"}>
      <div
        className="fh-rating-stars"
        role="radiogroup"
        aria-label="Rate this"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={summary.myRating === value}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            disabled={saving}
            className={value <= shown ? "on" : ""}
            onMouseEnter={() => setHover(value)}
            onFocus={() => setHover(value)}
            onBlur={() => setHover(0)}
            onClick={() => rate(value)}
          >
            <Star size={compact ? 16 : 20} fill={value <= shown ? "currentColor" : "none"} />
          </button>
        ))}
      </div>

      <span className="fh-rating-summary">
        {summary.ratingCount > 0
          ? `${summary.ratingAverage.toFixed(1)} / 5 · ${summary.ratingCount} rating${summary.ratingCount > 1 ? "s" : ""}`
          : "No ratings yet"}
        {!isAuthenticated && <em> · log in to rate</em>}
        {summary.myRating > 0 && <em> · you rated {summary.myRating}</em>}
      </span>
    </div>
  );
}

export default StarRating;

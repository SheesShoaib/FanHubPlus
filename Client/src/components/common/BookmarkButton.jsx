import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark } from "lucide-react";

import api, { toQuery } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function BookmarkButton({ itemType, itemId, className = "fh-action-btn", showLabel = true, initialSaved }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(Boolean(initialSaved));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !itemId) {
      setSaved(false);
      return;
    }
    if (initialSaved === null) return;
    if (initialSaved !== undefined) {
      setSaved(initialSaved);
      return;
    }
    api
      .get(`/bookmarks/check${toQuery({ itemType, item: itemId })}`)
      .then((data) => setSaved(data.bookmarked))
      .catch(() => {});
  }, [isAuthenticated, itemType, itemId, initialSaved]);

  const toggle = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setBusy(true);
    try {
      if (saved) {
        await api.delete("/bookmarks", { itemType, item: itemId });
      } else {
        await api.post("/bookmarks", { itemType, item: itemId });
      }
      setSaved((current) => !current);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={saved ? `${className} active` : className}
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Bookmark"}
    >
      <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
      {showLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}

export default BookmarkButton;

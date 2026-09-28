import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookMarked, UserRound, ShoppingBag, CalendarDays, Trash2, Bookmark, NotebookPen, Check, X } from "lucide-react";

import api, { assetUrl } from "../../services/api";
import Loader from "../../components/common/Loader";

const typeTabs = [
  { value: "All", icon: Bookmark },
  { value: "Content", icon: BookMarked, label: "Articles & media" },
  { value: "Character", icon: UserRound, label: "Characters" },
  { value: "Merchandise", icon: ShoppingBag, label: "Merchandise" },
  { value: "Event", icon: CalendarDays, label: "Events" },
];

function getItemTitle(bookmark) {
  const item = bookmark.item;
  if (!item) return "Deleted item";
  return item.title || item.name || "Untitled";
}

function getItemMeta(bookmark) {
  const item = bookmark.item;
  if (!item) return "This item was removed by an admin";
  if (bookmark.itemType === "Content") return item.type === "article" ? `Article · ${item.author || "FanHub+"}` : `${item.type} · ${item.duration || ""}`;
  if (bookmark.itemType === "Character") return [item.fandom, item.role].filter(Boolean).join(" · ");
  if (bookmark.itemType === "Event") return `${item.date} · ${[item.venue, item.city].filter(Boolean).join(", ")}`;
  if (bookmark.itemType === "Merchandise") return [item.productType, item.fandom].filter(Boolean).join(" · ");
  return "";
}

function getItemLink(bookmark) {
  const item = bookmark.item;
  if (!item) return null;
  if (bookmark.itemType === "Character") return `/characters/${item._id}`;
  if (bookmark.itemType === "Event") return `/events/${item._id}`;
  if (bookmark.itemType === "Merchandise") return `/shop?item=${item._id}`;
  return item.type === "article" ? `/stories/${item._id}` : `/multimedia?item=${item._id}`;
}

function Bookmarks() {
  const [activeType, setActiveType] = useState("All");
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    api
      .get("/bookmarks")
      .then(setBookmarks)
      .catch((err) => console.error("Failed to load bookmarks:", err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (activeType === "All") return bookmarks;
    return bookmarks.filter((item) => item.itemType === activeType);
  }, [activeType, bookmarks]);

  const handleRemove = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const startEdit = (bookmark) => {
    setEditingId(bookmark._id);
    setNoteDraft(bookmark.note || "");
  };

  const saveNote = async (id) => {
    try {
      const updated = await api.put(`/bookmarks/${id}`, { note: noteDraft });
      setBookmarks((current) => current.map((b) => (b._id === id ? updated : b)));
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const iconFor = (type) => typeTabs.find((tab) => tab.value === type)?.icon || Bookmark;

  if (loading) return <Loader label="Loading your saved items..." />;

  return (
    <motion.div className="bookmarks-page" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="dash-page-header">
        <h1>Bookmarks</h1>
        <p>Everything you've saved across FanHub+, with your own notes.</p>
      </div>

      <div className="dash-tabs">
        {typeTabs.map((tab) => {
          const Icon = tab.icon;
          const count = tab.value === "All" ? bookmarks.length : bookmarks.filter((b) => b.itemType === tab.value).length;
          return (
            <button
              key={tab.value}
              type="button"
              className={activeType === tab.value ? "dash-tab active" : "dash-tab"}
              onClick={() => setActiveType(tab.value)}
            >
              <Icon size={15} />
              {tab.label || tab.value} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="dash-empty-state">
          <Bookmark size={26} />
          <h3>No bookmarks here yet</h3>
          <p>Save articles, videos, characters, merchandise or events to see them here.</p>
        </div>
      ) : (
        <div className="dash-list">
          {filtered.map((bookmark, index) => {
            const Icon = iconFor(bookmark.itemType);
            const link = getItemLink(bookmark);
            const isEditing = editingId === bookmark._id;

            return (
              <motion.div
                key={bookmark._id}
                className="dash-list-row fh-bookmark-row"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
              >
                <div className="dash-list-icon">
                  {bookmark.item?.imageUrl ? <img src={assetUrl(bookmark.item.imageUrl)} alt="" /> : <Icon size={17} />}
                </div>

                <div className="dash-list-body">
                  {link ? (
                    <Link to={link}>
                      <strong>{getItemTitle(bookmark)}</strong>
                    </Link>
                  ) : (
                    <strong>{getItemTitle(bookmark)}</strong>
                  )}
                  <span>{getItemMeta(bookmark)}</span>

                  {isEditing ? (
                    <div className="fh-note-editor">
                      <textarea
                        rows={2}
                        maxLength={1000}
                        value={noteDraft}
                        autoFocus
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Why did you save this?"
                        aria-label="Bookmark note"
                      />
                      <button type="button" onClick={() => saveNote(bookmark._id)} aria-label="Save note">
                        <Check size={15} />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} aria-label="Cancel">
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    bookmark.note && <em className="fh-bookmark-note">"{bookmark.note}"</em>
                  )}
                </div>

                <span className="dash-list-badge">{bookmark.itemType === "Content" ? bookmark.item?.type || "Content" : bookmark.itemType}</span>

                <button type="button" className="dash-list-remove" onClick={() => startEdit(bookmark)} aria-label="Edit note" title="Add a note">
                  <NotebookPen size={16} />
                </button>

                <button type="button" className="dash-list-remove" onClick={() => handleRemove(bookmark._id)} aria-label="Remove bookmark">
                  <Trash2 size={16} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default Bookmarks;

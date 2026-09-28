import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Plus, Trash2, X, Pencil } from "lucide-react";

import api from "../../services/api";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);

  const openForm = (note = null) => {
    setEditingId(note?._id || null);
    setTitle(note?.title || "");
    setText(note?.text || "");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setText("");
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await api.get("/notes");
        setNotes(data);
      } catch (err) {
        console.error("Failed to load notes:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!title.trim() || !text.trim()) return;

    try {
      const body = { title: title.trim(), text: text.trim() };
      if (editingId) {
        const updated = await api.put(`/notes/${editingId}`, body);
        setNotes((current) => [updated, ...current.filter((note) => note._id !== editingId)]);
      } else {
        const newNote = await api.post("/notes", body);
        setNotes((current) => [newNote, ...current]);
      }
      closeForm();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes((current) => current.filter((note) => note._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="dash-page-header">
        <h1>Notes</h1>
        <p>Loading your notes...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="notes-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="dash-page-header dash-page-header-row">
        <div>
          <h1>Notes</h1>
          <p>Personal notes tied to your fandom research and plans.</p>
        </div>

        <button
          type="button"
          className="dash-add-btn"
          onClick={() => (showForm ? closeForm() : openForm())}
        >
          <Plus size={16} />
          New note
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            className="dash-card notes-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
          >
            <button
              type="button"
              className="notes-form-close"
              onClick={closeForm}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="dash-field">
              <label htmlFor="note-title">Title</label>
              <input
                id="note-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Give your note a title"
                required
              />
            </div>

            <div className="dash-field">
              <label htmlFor="note-text">Note</label>
              <textarea
                id="note-text"
                rows={4}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Write your note here..."
                required
              />
            </div>

            <button type="submit" className="dash-save-btn">
              {editingId ? "Update note" : "Save note"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {notes.length === 0 ? (
        <div className="dash-empty-state">
          <StickyNote size={26} />
          <h3>No notes yet</h3>
          <p>Jot down theories, plans, or anything worth remembering.</p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note, index) => (
            <motion.div
              key={note._id}
              className="note-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="note-card-head">
                <StickyNote size={15} />
                <h3>{note.title}</h3>

                <button type="button" onClick={() => openForm(note)} aria-label="Edit note">
                  <Pencil size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(note._id)}
                  aria-label="Delete note"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <p style={{ whiteSpace: "pre-line" }}>{note.text}</p>
              <small className="fh-muted">Updated {new Date(note.updatedAt).toLocaleDateString()}</small>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Notes;
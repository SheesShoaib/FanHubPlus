import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, Music2, Plus, Search, Star, Trash2, Video, X } from "lucide-react";

import StatCard from "../../components/admin/StatCard";
import ImagePicker from "../../components/admin/ImagePicker";
import Loader from "../../components/common/Loader";
import api, { assetUrl } from "../../services/api";
import "../../styles/admin/dashboard.css";
import "../../styles/admin/manager-shared.css";
import "../../styles/admin/manage-multimedia.css";

const types = ["video", "trailer", "audio", "explainer", "image"];
const statuses = ["published", "draft"];

const emptyForm = {
  title: "",
  type: "video",
  category: "",
  fandom: "",
  genre: "",
  tags: "",
  duration: "",
  description: "",
  mediaUrl: "",
  status: "published",
  releaseDate: "",
  popularityScore: "",
};

function ManageMultimedia() {
  const [media, setMedia] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/multimedia?all=true"), api.get("/categories")])
      .then(([items, cats]) => {
        setMedia(items);
        setCategories(cats);
      })
      .catch((err) => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return media.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.tags?.some((t) => t.includes(search.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [media, search, typeFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, category: categories[0]?._id || "" });
    setImageFile(null);
    setImagePreview("");
    setMediaFile(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      type: item.type,
      category: item.category?._id || "",
      fandom: item.fandom || "",
      genre: item.genre || "",
      tags: (item.tags || []).join(", "),
      duration: item.duration || "",
      description: item.description || "",
      mediaUrl: item.mediaUrl || "",
      status: item.status,
      releaseDate: item.releaseDate ? item.releaseDate.slice(0, 10) : "",
      popularityScore: item.popularityScore ?? "",
    });
    setImageFile(null);
    setImagePreview(item.imageUrl || "");
    setMediaFile(null);
    setModalOpen(true);
  };

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.category) return;
    if (!form.mediaUrl.trim() && !mediaFile) {
      alert("Add a media URL or upload an audio/video file.");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (imageFile) formData.append("image", imageFile);
    if (mediaFile) formData.append("media", mediaFile);

    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.putForm(`/multimedia/${editingId}`, formData);
        setMedia((current) => current.map((item) => (item._id === editingId ? updated : item)));
      } else {
        const created = await api.postForm("/multimedia", formData);
        setMedia((current) => [created, ...current]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this media item?")) return;
    try {
      await api.delete(`/multimedia/${id}`);
      setMedia((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const typeBadge = (type) => ({ audio: "blue", trailer: "purple", explainer: "yellow" })[type] || "green";

  if (loading) return <Loader label="Loading media..." />;

  return (
    <div className="manager-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">content</p>
          <h1>Multimedia</h1>
          <p className="manager-subtitle">Videos, trailers, audio clips and explainers. Paste a YouTube/Vimeo/MP4/MP3 link or upload a file.</p>
        </div>

        <button type="button" className="manager-add-btn" onClick={openAdd}>
          <Plus size={16} />
          Add media
        </button>
      </div>

      <div className="manager-stats">
        <StatCard icon={Video} color="purple" label="total media" value={media.length} />
        <StatCard icon={Music2} color="blue" label="audio clips" value={media.filter((m) => m.type === "audio").length} />
        <StatCard icon={Eye} color="green" label="total views" value={media.reduce((s, m) => s + (m.views || 0), 0)} />
        <StatCard icon={Star} color="pink" label="ratings" value={media.reduce((s, m) => s + (m.ratingCount || 0), 0)} />
      </div>

      <div className="manager-toolbar">
        <div className="manager-search">
          <Search size={16} />
          <input type="text" placeholder="Search by title or tag..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        <div className="manager-filters">
          {["all", ...types].map((type) => (
            <button
              key={type}
              type="button"
              className={typeFilter === type ? "manager-filter-chip active" : "manager-filter-chip"}
              onClick={() => setTypeFilter(type)}
            >
              {type === "all" ? "All" : type}
            </button>
          ))}
        </div>
      </div>

      <div className="manager-table-wrap">
        {filtered.length === 0 ? (
          <div className="manager-empty">
            <Video size={26} />
            <h3>No media found</h3>
            <p>Try a different search or filter, or add new media.</p>
          </div>
        ) : (
          <>
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Category / tags</th>
                  <th>Views</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="manager-title-cell fh-with-thumb">
                        {item.imageUrl && <img src={assetUrl(item.imageUrl)} alt="" />}
                        <div>
                          <strong>{item.title}</strong>
                          <span>{[item.fandom, item.duration].filter(Boolean).join(" · ")}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`manager-badge ${typeBadge(item.type)}`}>{item.type}</span>
                    </td>
                    <td>
                      {item.category?.name}
                      {item.tags?.length > 0 && <div className="fh-tags small">{item.tags.map((t) => <span key={t}>{t}</span>)}</div>}
                    </td>
                    <td>{item.views}</td>
                    <td>{item.ratingCount ? `${item.ratingAverage} (${item.ratingCount})` : "-"}</td>
                    <td>
                      <span className={`manager-badge ${item.status === "published" ? "green" : "yellow"}`}>{item.status}</span>
                    </td>
                    <td>
                      <div className="manager-row-actions">
                        <button type="button" className="manager-icon-btn" onClick={() => openEdit(item)} aria-label="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button type="button" className="manager-icon-btn danger" onClick={() => handleDelete(item._id)} aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="manager-table-footer">
              <span>
                {filtered.length} of {media.length} items
              </span>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="manager-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="manager-modal wide" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="manager-modal-head">
              <h2>{editingId ? "Edit media" : "Add media"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <ImagePicker
                id="media-thumb"
                label="Thumbnail"
                preview={imagePreview}
                onChange={(file, url) => {
                  setImageFile(file);
                  setImagePreview(url);
                }}
              />

              <div className="manager-form-group">
                <label htmlFor="media-title">Title</label>
                <input id="media-title" type="text" value={form.title} onChange={handleChange("title")} required />
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="media-type">Type</label>
                  <select id="media-type" value={form.type} onChange={handleChange("type")}>
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="manager-form-group">
                  <label htmlFor="media-category">Category</label>
                  <select id="media-category" value={form.category} onChange={handleChange("category")} required>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="manager-form-group">
                <label htmlFor="media-url">Media URL</label>
                <input
                  id="media-url"
                  type="text"
                  value={form.mediaUrl}
                  onChange={handleChange("mediaUrl")}
                  placeholder="https://www.youtube.com/watch?v=... or a direct .mp4 / .mp3 link"
                />
              </div>

              <div className="manager-form-group">
                <label htmlFor="media-file">...or upload a file (MP4, WebM, MP3, WAV, OGG, max 50 MB)</label>
                <input
                  id="media-file"
                  type="file"
                  accept="video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="media-fandom">Fandom</label>
                  <input id="media-fandom" type="text" value={form.fandom} onChange={handleChange("fandom")} placeholder="e.g. Neon Drift" />
                </div>
                <div className="manager-form-group">
                  <label htmlFor="media-genre">Genre</label>
                  <input id="media-genre" type="text" value={form.genre} onChange={handleChange("genre")} placeholder="e.g. Fantasy" />
                </div>
              </div>

              <div className="manager-form-group">
                <label htmlFor="media-tags">Tags (comma separated)</label>
                <input id="media-tags" type="text" value={form.tags} onChange={handleChange("tags")} placeholder="trailer, soundtrack, behind-the-scenes" />
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="media-duration">Duration</label>
                  <input id="media-duration" type="text" value={form.duration} onChange={handleChange("duration")} placeholder="3:24" />
                </div>
                <div className="manager-form-group">
                  <label htmlFor="media-release">Release date</label>
                  <input id="media-release" type="date" value={form.releaseDate} onChange={handleChange("releaseDate")} />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="media-status">Status</label>
                  <select id="media-status" value={form.status} onChange={handleChange("status")}>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="manager-form-group">
                  <label htmlFor="media-pop">Popularity score (0-100)</label>
                  <input id="media-pop" type="number" min="0" max="100" value={form.popularityScore} onChange={handleChange("popularityScore")} />
                </div>
              </div>

              <div className="manager-form-group">
                <label htmlFor="media-desc">Description</label>
                <textarea id="media-desc" rows={3} value={form.description} onChange={handleChange("description")} />
              </div>

              <div className="manager-modal-actions">
                <button type="button" className="manager-cancel-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="manager-save-btn" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save changes" : "Add media"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageMultimedia;

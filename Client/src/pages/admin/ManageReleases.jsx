import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Edit3, History, Plus, Rocket, Search, Trash2, X } from "lucide-react";

import StatCard from "../../components/admin/StatCard";
import ImagePicker from "../../components/admin/ImagePicker";
import Loader from "../../components/common/Loader";
import api, { assetUrl } from "../../services/api";
import "../../styles/admin/dashboard.css";
import "../../styles/admin/manager-shared.css";

const RELEASE_TYPES = ["Anime", "Game", "Movie", "TV Show", "Comic", "Manga", "K-Pop", "Merchandise"];
const TAGS = ["Announced", "Confirmed", "Pre-Order", "Limited Edition", "Collectible", "Delayed"];

const emptyForm = { title: "", releaseType: "Anime", category: "", fandom: "", releaseDate: "", platform: "", tag: "Announced", description: "" };

function ManageReleases() {
  const [releases, setReleases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    Promise.all([api.get("/releases?include=all"), api.get("/categories")])
      .then(([rel, cats]) => {
        setReleases(rel);
        setCategories(cats);
      })
      .catch((err) => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date(new Date().toDateString());

  const filtered = useMemo(
    () =>
      releases.filter(
        (r) =>
          (typeFilter === "all" || r.releaseType === typeFilter) &&
          (!search || r.title.toLowerCase().includes(search.toLowerCase()) || r.fandom?.toLowerCase().includes(search.toLowerCase()))
      ),
    [releases, search, typeFilter]
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditingId(r._id);
    setForm({
      title: r.title,
      releaseType: r.releaseType,
      category: r.category?._id || "",
      fandom: r.fandom || "",
      releaseDate: r.releaseDate.slice(0, 10),
      platform: r.platform || "",
      tag: r.tag || "",
      description: r.description || "",
    });
    setImageFile(null);
    setImagePreview(r.imageUrl || "");
    setModalOpen(true);
  };

  const handleChange = (field) => (e) => setForm((current) => ({ ...current, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (imageFile) formData.append("image", imageFile);

    try {
      const saved = editingId ? await api.putForm(`/releases/${editingId}`, formData) : await api.postForm("/releases", formData);
      setReleases((current) =>
        [saved, ...current.filter((r) => r._id !== saved._id)].sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate))
      );
      setModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this release?")) return;
    try {
      await api.delete(`/releases/${id}`);
      setReleases((current) => current.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Loader label="Loading releases..." />;

  const upcomingCount = releases.filter((r) => new Date(r.releaseDate) >= today).length;

  return (
    <div className="manager-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">store & events</p>
          <h1>Upcoming Releases</h1>
          <p className="manager-subtitle">Anticipated anime, games, movies, shows, comics and merchandise drops shown on the showcase page.</p>
        </div>

        <button type="button" className="manager-add-btn" onClick={openAdd}>
          <Plus size={16} />
          Add release
        </button>
      </div>

      <div className="manager-stats">
        <StatCard icon={Rocket} color="purple" label="total releases" value={releases.length} />
        <StatCard icon={CalendarClock} color="green" label="upcoming" value={upcomingCount} />
        <StatCard icon={History} color="blue" label="already released" value={releases.length - upcomingCount} />
      </div>

      <div className="manager-toolbar">
        <div className="manager-search">
          <Search size={16} />
          <input type="text" placeholder="Search releases..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="manager-filters">
          {["all", ...RELEASE_TYPES].map((t) => (
            <button key={t} type="button" className={typeFilter === t ? "manager-filter-chip active" : "manager-filter-chip"} onClick={() => setTypeFilter(t)}>
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="manager-table-wrap">
        {filtered.length === 0 ? (
          <div className="manager-empty">
            <Rocket size={26} />
            <h3>No releases found</h3>
            <p>Add one to show it on the merchandise showcase page.</p>
          </div>
        ) : (
          <table className="manager-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Release date</th>
                <th>Tag</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const past = new Date(r.releaseDate) < today;
                return (
                  <tr key={r._id}>
                    <td>
                      <div className="manager-title-cell fh-with-thumb">
                        {r.imageUrl && <img src={assetUrl(r.imageUrl)} alt="" />}
                        <div>
                          <strong>{r.title}</strong>
                          <span>{[r.fandom, r.platform].filter(Boolean).join(" · ")}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="manager-badge purple">{r.releaseType}</span>
                    </td>
                    <td>
                      {new Date(r.releaseDate).toLocaleDateString()} {past && <span className="manager-badge yellow">released</span>}
                    </td>
                    <td>{r.tag || "-"}</td>
                    <td>
                      <div className="manager-row-actions">
                        <button type="button" className="manager-icon-btn" onClick={() => openEdit(r)} aria-label="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button type="button" className="manager-icon-btn danger" onClick={() => handleDelete(r._id)} aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="manager-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="manager-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="manager-modal-head">
              <h2>{editingId ? "Edit release" : "Add release"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <ImagePicker
                id="release-image"
                label="Cover image"
                preview={imagePreview}
                onChange={(file, url) => {
                  setImageFile(file);
                  setImagePreview(url);
                }}
              />

              <div className="manager-form-group">
                <label htmlFor="rel-title">Title</label>
                <input id="rel-title" type="text" required value={form.title} onChange={handleChange("title")} />
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="rel-type">Release type</label>
                  <select id="rel-type" value={form.releaseType} onChange={handleChange("releaseType")}>
                    {RELEASE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="manager-form-group">
                  <label htmlFor="rel-date">Release date</label>
                  <input id="rel-date" type="date" required value={form.releaseDate} onChange={handleChange("releaseDate")} />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="rel-cat">Category</label>
                  <select id="rel-cat" value={form.category} onChange={handleChange("category")}>
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="manager-form-group">
                  <label htmlFor="rel-fandom">Fandom</label>
                  <input id="rel-fandom" type="text" value={form.fandom} onChange={handleChange("fandom")} />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="rel-platform">Platform / where</label>
                  <input id="rel-platform" type="text" value={form.platform} onChange={handleChange("platform")} placeholder="Cinemas, PS5, Streaming..." />
                </div>
                <div className="manager-form-group">
                  <label htmlFor="rel-tag">Tag</label>
                  <select id="rel-tag" value={form.tag} onChange={handleChange("tag")}>
                    <option value="">None</option>
                    {TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="manager-form-group">
                <label htmlFor="rel-desc">Description</label>
                <textarea id="rel-desc" rows={3} value={form.description} onChange={handleChange("description")} />
              </div>

              <div className="manager-modal-actions">
                <button type="button" className="manager-cancel-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="manager-save-btn">
                  {editingId ? "Save changes" : "Add release"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageReleases;

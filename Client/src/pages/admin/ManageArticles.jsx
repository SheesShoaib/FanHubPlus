import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  FileText,
  ImagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import StatCard from "../../components/admin/StatCard";
import api, { assetUrl } from "../../services/api";
import "../../styles/admin/dashboard.css";
import "../../styles/admin/manager-shared.css";
import "../../styles/admin/manage-articles.css";

const statuses = ["draft", "review", "published"];
const emptyForm = {
  title: "",
  category: "",
  author: "",
  status: "draft",
  description: "",
  body: "",
  fandom: "",
  genre: "",
  tags: "",
  releaseDate: "",
  popularityScore: "",
  featured: false,
  timeline: "",
};

function timelineToText(timeline = []) {
  return timeline.map((t) => [t.date, t.title, t.description].filter((v, i) => i < 2 || v).join(" | ")).join("\n");
}

function textToTimeline(text) {
  return text
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts[1])
    .map(([date, title, description = ""]) => ({ date, title, description }));
}

function ManageArticles() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articleData, catData] = await Promise.all([
          api.get("/articles?all=true"),
          api.get("/categories"),
        ]);
        setArticles(articleData);
        setCategories(catData);
      } catch (err) {
        console.error("Failed to load articles:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return articles.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [articles, search, statusFilter]);

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

  const openEdit = (article) => {
    setEditingId(article._id);
    setForm({
      title: article.title,
      category: article.category?._id || "",
      author: article.author || "",
      status: article.status || "draft",
      description: article.description || "",
      body: article.body || "",
      fandom: article.fandom || "",
      genre: article.genre || "",
      tags: (article.tags || []).join(", "),
      releaseDate: article.releaseDate ? article.releaseDate.slice(0, 10) : "",
      popularityScore: article.popularityScore ?? "",
      featured: Boolean(article.featured),
      timeline: timelineToText(article.timeline),
    });
    setImageFile(null);
    setImagePreview(article.imageUrl || "");
    setModalOpen(true);
  };

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.category) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, key === "timeline" ? JSON.stringify(textToTimeline(value)) : value);
    });
    if (imageFile) formData.append("image", imageFile);

    try {
      if (editingId) {
        const updated = await api.putForm(`/articles/${editingId}`, formData);
        setArticles((current) => current.map((item) => (item._id === editingId ? updated : item)));
      } else {
        const created = await api.postForm("/articles", formData);
        setArticles((current) => [created, ...current]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this article?")) return;
    try {
      await api.delete(`/articles/${id}`);
      setArticles((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const statusBadge = (status) => {
    if (status === "published") return "green";
    if (status === "review") return "yellow";
    return "gray";
  };

  if (loading) return <div className="manager-page">Loading...</div>;

  return (
    <div className="manager-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">content</p>
          <h1>Articles</h1>
          <p className="manager-subtitle">Featured articles, theories, lore, and news.</p>
        </div>

        <button type="button" className="manager-add-btn" onClick={openAdd} disabled={categories.length === 0}>
          <Plus size={16} />
          Add article
        </button>
      </div>

      {categories.length === 0 && (
        <p style={{ color: "#f87171", marginBottom: "16px" }}>
          Create at least one category first (Admin → Categories) before adding articles.
        </p>
      )}

      <div className="manager-stats">
        <StatCard icon={FileText} color="purple" label="total articles" value={articles.length} />
        <StatCard icon={FileText} color="green" label="published" value={articles.filter((a) => a.status === "published").length} />
      </div>

      <div className="manager-toolbar">
        <div className="manager-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="manager-filters">
          {["all", ...statuses].map((s) => (
            <button
              key={s}
              type="button"
              className={statusFilter === s ? "manager-filter-chip active" : "manager-filter-chip"}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="manager-table-wrap">
        {filtered.length === 0 ? (
          <div className="manager-empty">
            <FileText size={26} />
            <h3>No articles found</h3>
            <p>Try a different search or filter, or add a new article.</p>
          </div>
        ) : (
          <>
            <table className="manager-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((article) => (
                  <tr key={article._id}>
                    <td>
                      {article.imageUrl ? (
                        <img
                          src={assetUrl(article.imageUrl)}
                          alt={article.title}
                          style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1c2740" }} />
                      )}
                    </td>
                    <td>
                      <div className="manager-title-cell">
                        <strong>{article.title}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="manager-badge purple">{article.category?.name || "-"}</span>
                    </td>
                    <td>{article.author || "-"}</td>
                    <td>
                      <span className={`manager-badge ${statusBadge(article.status)}`}>{article.status}</span>
                    </td>
                    <td>
                      <div className="manager-row-actions">
                        <button type="button" className="manager-icon-btn" onClick={() => openEdit(article)} aria-label="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button type="button" className="manager-icon-btn danger" onClick={() => handleDelete(article._id)} aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="manager-table-footer">
              <span>{filtered.length} of {articles.length} articles</span>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="manager-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="manager-modal" onClick={(event) => event.stopPropagation()}>
            <div className="manager-modal-head">
              <h2>{editingId ? "Edit article" : "Add article"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="manager-form-group">
                <label>Cover image</label>
                <label
                  htmlFor="article-image"
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
                <input id="article-image" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </div>

              <div className="manager-form-group">
                <label htmlFor="article-title">Title</label>
                <input id="article-title" type="text" value={form.title} onChange={handleChange("title")} required />
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="article-category">Category</label>
                  <select id="article-category" value={form.category} onChange={handleChange("category")} required>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="manager-form-group">
                  <label htmlFor="article-status">Status</label>
                  <select id="article-status" value={form.status} onChange={handleChange("status")}>
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="article-author">Author</label>
                  <input id="article-author" type="text" value={form.author} onChange={handleChange("author")} />
                </div>
                <div className="manager-form-group">
                  <label htmlFor="article-release">Publish / release date</label>
                  <input id="article-release" type="date" value={form.releaseDate} onChange={handleChange("releaseDate")} />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="article-fandom">Fandom</label>
                  <input id="article-fandom" type="text" value={form.fandom} onChange={handleChange("fandom")} placeholder="e.g. Starlight Requiem" />
                </div>
                <div className="manager-form-group">
                  <label htmlFor="article-genre">Genre</label>
                  <input id="article-genre" type="text" value={form.genre} onChange={handleChange("genre")} placeholder="e.g. Fantasy" />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="article-tags">Tags (comma separated)</label>
                  <input id="article-tags" type="text" value={form.tags} onChange={handleChange("tags")} placeholder="review, theory" />
                </div>
                <div className="manager-form-group">
                  <label htmlFor="article-pop">Popularity (0-100)</label>
                  <input id="article-pop" type="number" min="0" max="100" value={form.popularityScore} onChange={handleChange("popularityScore")} />
                </div>
              </div>

              <label className="fh-checkbox">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                Featured article (shown in the Stories hero)
              </label>

              <div className="manager-form-group">
                <label htmlFor="article-desc">Summary</label>
                <textarea id="article-desc" rows={2} value={form.description} onChange={handleChange("description")} placeholder="One or two sentences shown on cards" />
              </div>

              <div className="manager-form-group">
                <label htmlFor="article-body">Body</label>
                <textarea
                  id="article-body"
                  rows={10}
                  value={form.body}
                  onChange={handleChange("body")}
                  placeholder={"Blank line = new paragraph\n## Subheading\n![Caption](/images/stories/hidden-power.png)\n> Pull quote\n- bullet\n**bold**"}
                />
                <small className="fh-muted">
                  Formatting: blank line for paragraphs, ## for headings, ![caption](image-url) to embed an image, &gt; for quotes, - for lists, **bold**.
                </small>
              </div>

              <div className="manager-form-group">
                <label htmlFor="article-timeline">Timeline / event highlights (one per line)</label>
                <textarea
                  id="article-timeline"
                  rows={4}
                  value={form.timeline}
                  onChange={handleChange("timeline")}
                  placeholder={"2024-10 | Season 2 premieres | The clan war begins\n2026-08 | Series finale"}
                />
              </div>

              <div className="manager-modal-actions">
                <button type="button" className="manager-cancel-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="manager-save-btn">
                  {editingId ? "Save changes" : "Add article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageArticles;
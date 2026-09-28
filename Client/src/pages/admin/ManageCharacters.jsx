import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  ImagePlus,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import StatCard from "../../components/admin/StatCard";
import api, { assetUrl } from "../../services/api";
import "../../styles/admin/dashboard.css";
import "../../styles/admin/manager-shared.css";
import "../../styles/admin/manage-characters.css";

const emptyForm = {
  name: "",
  alias: "",
  category: "",
  fandom: "",
  role: "",
  bio: "",
  tags: "",
  power: 50,
  intelligence: 50,
  popularity: 50,
};

function ManageCharacters() {
  const [characters, setCharacters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [charData, catData] = await Promise.all([
          api.get("/characters"),
          api.get("/categories"),
        ]);
        setCharacters(charData);
        setCategories(catData);
      } catch (err) {
        console.error("Failed to load characters:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return characters.filter((item) => {
      const matchesCategory =
        categoryFilter === "all" || item.category?._id === categoryFilter;
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.alias?.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [characters, search, categoryFilter]);

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

  const openEdit = (character) => {
    setEditingId(character._id);
    setForm({
      name: character.name,
      alias: character.alias || "",
      category: character.category?._id || "",
      fandom: character.fandom || "",
      role: character.role || "",
      bio: character.bio || "",
      tags: (character.tags || []).join(", "),
      power: character.power ?? 50,
      intelligence: character.intelligence ?? 50,
      popularity: character.popularity ?? 50,
    });
    setImageFile(null);
    setImagePreview(character.imageUrl || "");
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
    if (!form.name.trim() || !form.category) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (imageFile) formData.append("image", imageFile);

    try {
      if (editingId) {
        const updated = await api.putForm(`/characters/${editingId}`, formData);
        setCharacters((current) =>
          current.map((item) => (item._id === editingId ? updated : item))
        );
      } else {
        const created = await api.postForm("/characters", formData);
        setCharacters((current) => [created, ...current]);
      }

      setModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this character?")) return;

    try {
      await api.delete(`/characters/${id}`);
      setCharacters((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="manager-page">Loading...</div>;

  return (
    <div className="manager-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">content</p>
          <h1>Characters</h1>
          <p className="manager-subtitle">Manage character profiles across every fandom.</p>
        </div>

        <button type="button" className="manager-add-btn" onClick={openAdd} disabled={categories.length === 0}>
          <Plus size={16} />
          Add character
        </button>
      </div>

      {categories.length === 0 && (
        <p style={{ color: "#f87171", marginBottom: "16px" }}>
          Create at least one category first (Admin → Categories) before adding characters.
        </p>
      )}

      <div className="manager-stats">
        <StatCard icon={UserRound} color="purple" label="total characters" value={characters.length} />
      </div>

      <div className="manager-toolbar">
        <div className="manager-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search characters..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="manager-filters">
          <button
            type="button"
            className={categoryFilter === "all" ? "manager-filter-chip active" : "manager-filter-chip"}
            onClick={() => setCategoryFilter("all")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              className={categoryFilter === cat._id ? "manager-filter-chip active" : "manager-filter-chip"}
              onClick={() => setCategoryFilter(cat._id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="manager-table-wrap">
        {filtered.length === 0 ? (
          <div className="manager-empty">
            <UserRound size={26} />
            <h3>No characters found</h3>
            <p>Try a different search or filter, or add a new character.</p>
          </div>
        ) : (
          <>
            <table className="manager-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((character) => (
                  <tr key={character._id}>
                    <td>
                      {character.imageUrl ? (
                        <img
                          src={assetUrl(character.imageUrl)}
                          alt={character.name}
                          style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1c2740" }} />
                      )}
                    </td>
                    <td>
                      <div className="manager-title-cell">
                        <strong>{character.name}</strong>
                        <span>{character.alias}</span>
                      </div>
                    </td>
                    <td>
                      <span className="manager-badge purple">{character.category?.name || "-"}</span>
                    </td>
                    <td>{character.role}</td>
                    <td>
                      <div className="manager-row-actions">
                        <button type="button" className="manager-icon-btn" onClick={() => openEdit(character)} aria-label="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button type="button" className="manager-icon-btn danger" onClick={() => handleDelete(character._id)} aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="manager-table-footer">
              <span>{filtered.length} of {characters.length} characters</span>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="manager-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="manager-modal" onClick={(event) => event.stopPropagation()}>
            <div className="manager-modal-head">
              <h2>{editingId ? "Edit character" : "Add character"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="manager-form-group">
                <label>Character image</label>
                <label
                  htmlFor="char-image"
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
                <input
                  id="char-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="char-name">Name</label>
                  <input id="char-name" type="text" value={form.name} onChange={handleChange("name")} required />
                </div>

                <div className="manager-form-group">
                  <label htmlFor="char-alias">Alias</label>
                  <input id="char-alias" type="text" value={form.alias} onChange={handleChange("alias")} />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="char-category">Category</label>
                  <select id="char-category" value={form.category} onChange={handleChange("category")} required>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="manager-form-group">
                  <label htmlFor="char-role">Role</label>
                  <input id="char-role" type="text" value={form.role} onChange={handleChange("role")} placeholder="Hero, Anti-Hero, Artist..." />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="char-fandom">Fandom</label>
                  <input id="char-fandom" type="text" value={form.fandom} onChange={handleChange("fandom")} placeholder="e.g. Starlight Requiem" />
                </div>

                <div className="manager-form-group">
                  <label htmlFor="char-tags">Tags (comma separated)</label>
                  <input id="char-tags" type="text" value={form.tags} onChange={handleChange("tags")} placeholder="swordswoman, leader" />
                </div>
              </div>

              <div className="manager-form-row three">
                {["power", "intelligence", "popularity"].map((stat) => (
                  <div className="manager-form-group" key={stat}>
                    <label htmlFor={`char-${stat}`}>
                      {stat} ({form[stat]})
                    </label>
                    <input id={`char-${stat}`} type="range" min="0" max="100" value={form[stat]} onChange={handleChange(stat)} />
                  </div>
                ))}
              </div>

              <div className="manager-form-group">
                <label htmlFor="char-desc">Bio</label>
                <textarea id="char-desc" rows={4} value={form.bio} onChange={handleChange("bio")} />
              </div>

              <div className="manager-modal-actions">
                <button type="button" className="manager-cancel-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="manager-save-btn">
                  {editingId ? "Save changes" : "Add character"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageCharacters;
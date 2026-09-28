import { useEffect, useMemo, useState } from "react";

import {
  Check,
  Edit3,
  FolderOpen,
  Plus,
  Search,
  Tags,
  Trash2,
  Users,
  X,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/admin/manage-categories.css";

const startingCategories = [
  {
    id: 1,
    name: "anime",
    slug: "anime",
    description: "anime worlds, characters, stories and community content.",
    articles: 428,
    characters: 214,
    status: "active",
    accent: "purple",
  },
  {
    id: 2,
    name: "gaming",
    slug: "gaming",
    description: "games, esports, characters and gaming culture.",
    articles: 312,
    characters: 186,
    status: "active",
    accent: "cyan",
  },
  {
    id: 3,
    name: "manga",
    slug: "manga",
    description: "manga series, creators, characters and recommendations.",
    articles: 196,
    characters: 128,
    status: "active",
    accent: "pink",
  },
  {
    id: 4,
    name: "movies",
    slug: "movies",
    description: "movies, cinematic universes and fan discussions.",
    articles: 148,
    characters: 96,
    status: "active",
    accent: "orange",
  },
  {
    id: 5,
    name: "k-pop",
    slug: "k-pop",
    description: "artists, performances, releases and k-pop culture.",
    articles: 114,
    characters: 42,
    status: "active",
    accent: "blue",
  },
  {
    id: 6,
    name: "cosplay",
    slug: "cosplay",
    description: "cosplay creators, guides, events and showcases.",
    articles: 86,
    characters: 24,
    status: "inactive",
    accent: "green",
  },
];

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  status: "active",
  accent: "purple",
};

function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.get("/categories");
        
        
        setCategories(
          data.map((category) => ({
            ...category,
            id: category._id,
            articles: category.articles || 0,
            characters: category.characters || 0,
          }))
        );
      } catch (err) {
        console.error("Failed to load categories:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const filteredCategories = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return categories.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.description
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const activeCount = categories.filter(
    (item) => item.status === "active"
  ).length;

  const totalArticles = categories.reduce(
    (total, item) => total + item.articles,
    0
  );

  const totalCharacters = categories.reduce(
    (total, item) => total + item.characters,
    0
  );

  const makeSlug = (value) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description,
      status: item.status,
      accent: item.accent,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    if (name === "name") {
      setForm((current) => ({
        ...current,
        name: value,
        slug:
          editingId && current.slug
            ? current.slug
            : makeSlug(value),
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

    const saveCategory = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    const cleanData = {
      ...form,
      name: form.name.trim(),
      slug:
        makeSlug(form.slug) ||
        makeSlug(form.name),
      description:
        form.description.trim(),
    };

    try {
      if (editingId) {
        const updated = await api.put(`/categories/${editingId}`, cleanData);
        setCategories((current) =>
          current.map((item) =>
            item.id === editingId
              ? { ...item, ...updated, id: updated._id }
              : item
          )
        );
      } else {
        const created = await api.post("/categories", cleanData);
        setCategories((current) => [
          { ...created, id: created._id, articles: 0, characters: 0 },
          ...current,
        ]);
      }

      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleStatus = async (id) => {
    const item = categories.find((category) => category.id === id);
    const newStatus = item.status === "active" ? "inactive" : "active";

    try {
      await api.put(`/categories/${id}`, { ...item, status: newStatus });
      setCategories((current) =>
        current.map((category) =>
          category.id === id ? { ...category, status: newStatus } : category
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteCategory = async (id) => {
    const item = categories.find(
      (category) => category.id === id
    );

    const confirmed = window.confirm(
      `kya aap "${item?.name}" category delete karna chahte hain?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      setCategories((current) =>
        current.filter(
          (category) => category.id !== id
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="categories-page">

      
      <div className="categories-top">
        <div>
          <p className="categories-label">
            content management
          </p>

          <h1>categories</h1>

          <p className="categories-subtitle">
            fanhub+ ke fandom worlds aur unki
            content categories yahan manage karo.
          </p>
        </div>

        <button
          type="button"
          className="category-add-btn"
          onClick={openAddModal}
        >
          <Plus size={16} />
          add category
        </button>
      </div>


      
      <div className="category-stats">

        <div className="category-stat">
          <span className="category-stat-icon purple">
            <Tags size={18} />
          </span>

          <div>
            <p>total categories</p>
            <h3>{categories.length}</h3>
          </div>
        </div>


        <div className="category-stat">
          <span className="category-stat-icon green">
            <Check size={18} />
          </span>

          <div>
            <p>active categories</p>
            <h3>{activeCount}</h3>
          </div>
        </div>


        <div className="category-stat">
          <span className="category-stat-icon blue">
            <FolderOpen size={18} />
          </span>

          <div>
            <p>linked articles</p>
            <h3>
              {totalArticles.toLocaleString()}
            </h3>
          </div>
        </div>


        <div className="category-stat">
          <span className="category-stat-icon pink">
            <Users size={18} />
          </span>

          <div>
            <p>characters</p>
            <h3>
              {totalCharacters.toLocaleString()}
            </h3>
          </div>
        </div>

      </div>


      
      <div className="category-toolbar">

        <div className="category-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="search categories..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            all status
          </option>

          <option value="active">
            active
          </option>

          <option value="inactive">
            inactive
          </option>
        </select>

      </div>


      
      {filteredCategories.length > 0 ? (
        <div className="category-grid">

          {filteredCategories.map((item) => (
            <article
              className="category-card"
              key={item.id}
            >

              <div className="category-card-top">

                <span
                  className={`category-main-icon ${item.accent}`}
                >
                  <Tags size={21} />
                </span>

                <span
                  className={`category-state ${item.status}`}
                >
                  <i></i>
                  {item.status}
                </span>

              </div>


              <div className="category-card-title">
                <h3>{item.name}</h3>

                <span>
                  /{item.slug}
                </span>
              </div>


              <p className="category-description">
                {item.description ||
                  "is category ki description abhi add nahi hui."}
              </p>


              <div className="category-numbers">

                <div>
                  <strong>
                    {item.articles}
                  </strong>

                  <span>
                    articles
                  </span>
                </div>

                <div>
                  <strong>
                    {item.characters}
                  </strong>

                  <span>
                    characters
                  </span>
                </div>

              </div>


              <div className="category-card-actions">

                <button
                  type="button"
                  onClick={() =>
                    toggleStatus(item.id)
                  }
                >
                  <Check size={14} />

                  {item.status === "active"
                    ? "disable"
                    : "activate"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openEditModal(item)
                  }
                >
                  <Edit3 size={14} />
                  edit
                </button>

                <button
                  type="button"
                  className="category-delete-btn"
                  onClick={() =>
                    deleteCategory(item.id)
                  }
                  aria-label={`delete ${item.name}`}
                >
                  <Trash2 size={14} />
                </button>

              </div>

            </article>
          ))}

        </div>
      ) : (
        <div className="categories-empty">
          <Tags size={28} />

          <h3>no categories found</h3>

          <p>
            search ya status filter change
            karke dobara check karo.
          </p>
        </div>
      )}


      
      {modalOpen && (
        <div
          className="category-modal-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="category-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="category-modal-head">
              <div>
                <p>
                  fandom management
                </p>

                <h2>
                  {editingId
                    ? "edit category"
                    : "new category"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>


            <form onSubmit={saveCategory}>

              <div className="category-form-row">

                <div className="category-form-group">
                  <label htmlFor="category-name">
                    category name
                  </label>

                  <input
                    id="category-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. anime"
                    autoFocus
                  />
                </div>


                <div className="category-form-group">
                  <label htmlFor="category-slug">
                    slug
                  </label>

                  <input
                    id="category-slug"
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="anime"
                  />
                </div>

              </div>


              <div className="category-form-group">
                <label htmlFor="category-description">
                  description
                </label>

                <textarea
                  id="category-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="category ke bare me short description..."
                  rows="4"
                />
              </div>


              <div className="category-form-row">

                <div className="category-form-group">
                  <label htmlFor="category-status">
                    status
                  </label>

                  <select
                    id="category-status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="active">
                      active
                    </option>

                    <option value="inactive">
                      inactive
                    </option>
                  </select>
                </div>


                <div className="category-form-group">
                  <label htmlFor="category-accent">
                    accent
                  </label>

                  <select
                    id="category-accent"
                    name="accent"
                    value={form.accent}
                    onChange={handleChange}
                  >
                    <option value="purple">
                      purple
                    </option>

                    <option value="cyan">
                      cyan
                    </option>

                    <option value="pink">
                      pink
                    </option>

                    <option value="orange">
                      orange
                    </option>

                    <option value="blue">
                      blue
                    </option>

                    <option value="green">
                      green
                    </option>
                  </select>
                </div>

              </div>


              <div className="category-modal-actions">

                <button
                  type="button"
                  className="category-cancel-btn"
                  onClick={closeModal}
                >
                  cancel
                </button>

                <button
                  type="submit"
                  className="category-save-btn"
                >
                  {editingId
                    ? "save changes"
                    : "create category"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default ManageCategories;
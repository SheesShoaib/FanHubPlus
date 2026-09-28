import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Eye,
  ImagePlus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

import StatCard from "../../components/admin/StatCard";
import api, { assetUrl } from "../../services/api";
import "../../styles/admin/dashboard.css";
import "../../styles/admin/manager-shared.css";
import "../../styles/admin/manage-merchandise.css";

const tags = ["Limited Edition", "Pre-Order", "Collectible", "New", "Best Seller"];
const productTypes = ["Apparel", "Figures", "Manga", "Posters", "Accessories", "Collectibles"];

const emptyForm = {
  name: "",
  category: "",
  productType: productTypes[0],
  price: "",
  oldPrice: "",
  tag: tags[0],
  description: "",
  fandom: "",
  isUpcoming: false,
  releaseDate: "",
};

function ManageMerchandise() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, catData] = await Promise.all([
          api.get("/merchandise"),
          api.get("/categories"),
        ]);
        setProducts(productData);
        setCategories(catData);
      } catch (err) {
        console.error("Failed to load merchandise:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return products.filter(
      (item) => !search || item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

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

  const openEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      category: product.category?._id || "",
      productType: product.productType || productTypes[0],
      price: product.price || "",
      oldPrice: product.oldPrice || "",
      tag: product.tag || tags[0],
      description: product.description || "",
      fandom: product.fandom || "",
      isUpcoming: Boolean(product.isUpcoming),
      releaseDate: product.releaseDate ? product.releaseDate.slice(0, 10) : "",
    });
    setImageFile(null);
    setImagePreview(product.imageUrl || "");
    setModalOpen(true);
  };

  const handleChange = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.price) return;

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (imageFile) formData.append("image", imageFile);

    try {
      if (editingId) {
        const updated = await api.putForm(`/merchandise/${editingId}`, formData);
        setProducts((current) => current.map((item) => (item._id === editingId ? updated : item)));
      } else {
        const created = await api.postForm("/merchandise", formData);
        setProducts((current) => [created, ...current]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.delete(`/merchandise/${id}`);
      setProducts((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const tagBadgeColor = (tag) => {
    if (tag === "Limited Edition") return "red";
    if (tag === "Pre-Order") return "orange";
    if (tag === "Collectible") return "purple";
    if (tag === "New") return "blue";
    return "green";
  };

  if (loading) return <div className="manager-page">Loading...</div>;

  return (
    <div className="manager-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">store & events</p>
          <h1>Merchandise</h1>
          <p className="manager-subtitle">
            Display-only showcase items - no purchase or order processing.
          </p>
        </div>

        <button type="button" className="manager-add-btn" onClick={openAdd} disabled={categories.length === 0}>
          <Plus size={16} />
          Add item
        </button>
      </div>

      {categories.length === 0 && (
        <p style={{ color: "#f87171", marginBottom: "16px" }}>
          Create at least one category first (Admin → Categories) before adding merchandise.
        </p>
      )}

      <div className="manager-stats">
        <StatCard icon={ShoppingBag} color="purple" label="total items" value={products.length} />
      </div>

      <div className="manager-toolbar">
        <div className="manager-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search merchandise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="manager-table-wrap">
        {filtered.length === 0 ? (
          <div className="manager-empty">
            <ShoppingBag size={26} />
            <h3>No merchandise found</h3>
            <p>Try a different search, or add a new item.</p>
          </div>
        ) : (
          <>
            <table className="manager-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Tag</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product._id}>
                    <td>
                      {product.imageUrl ? (
                        <img
                          src={assetUrl(product.imageUrl)}
                          alt={product.name}
                          style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1c2740" }} />
                      )}
                    </td>
                    <td>
                      <div className="manager-title-cell">
                        <strong>{product.name}</strong>
                        <span>{product.productType}</span>
                      </div>
                    </td>
                    <td>
                      <span className="manager-badge purple">{product.category?.name || "-"}</span>
                    </td>
                    <td>${product.price}</td>
                    <td>
                      <span className={`manager-badge ${tagBadgeColor(product.tag)}`}>{product.tag}</span>
                    </td>
                    <td>
                      <div className="manager-row-actions">
                        <button type="button" className="manager-icon-btn" onClick={() => openEdit(product)} aria-label="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button type="button" className="manager-icon-btn danger" onClick={() => handleDelete(product._id)} aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="manager-table-footer">
              <span>{filtered.length} of {products.length} items</span>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="manager-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="manager-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manager-modal-head">
              <h2>{editingId ? "Edit item" : "Add merchandise"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="manager-form-group">
                <label>Product image</label>
                <label
                  htmlFor="merch-image"
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
                <input id="merch-image" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </div>

              <div className="manager-form-group">
                <label htmlFor="merch-name">Product name</label>
                <input id="merch-name" type="text" value={form.name} onChange={handleChange("name")} required />
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="merch-category">Fandom category</label>
                  <select id="merch-category" value={form.category} onChange={handleChange("category")} required>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="manager-form-group">
                  <label htmlFor="merch-type">Product type</label>
                  <select id="merch-type" value={form.productType} onChange={handleChange("productType")}>
                    {productTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="merch-price">Price ($)</label>
                  <input id="merch-price" type="number" step="0.01" value={form.price} onChange={handleChange("price")} required />
                </div>

                <div className="manager-form-group">
                  <label htmlFor="merch-oldprice">Original price ($) (optional)</label>
                  <input id="merch-oldprice" type="number" step="0.01" value={form.oldPrice} onChange={handleChange("oldPrice")} placeholder="For showing a discount" />
                </div>
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="merch-tag">Tag</label>
                  <select id="merch-tag" value={form.tag} onChange={handleChange("tag")}>
                    {tags.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                <div className="manager-form-group">
                  <label htmlFor="merch-fandom">Fandom</label>
                  <input id="merch-fandom" type="text" value={form.fandom} onChange={handleChange("fandom")} placeholder="e.g. Neon Drift" />
                </div>
              </div>

              <div className="manager-form-row">
                <label className="fh-checkbox">
                  <input
                    type="checkbox"
                    checked={form.isUpcoming}
                    onChange={(e) => setForm((current) => ({ ...current, isUpcoming: e.target.checked }))}
                  />
                  Upcoming drop (not released yet)
                </label>

                <div className="manager-form-group">
                  <label htmlFor="merch-release">Drop date</label>
                  <input id="merch-release" type="date" value={form.releaseDate} onChange={handleChange("releaseDate")} />
                </div>
              </div>

              <div className="manager-form-group">
                <label htmlFor="merch-desc">Description</label>
                <textarea id="merch-desc" rows={3} value={form.description} onChange={handleChange("description")} />
              </div>

              <div className="manager-modal-actions">
                <button type="button" className="manager-cancel-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="manager-save-btn">
                  {editingId ? "Save changes" : "Add item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageMerchandise;
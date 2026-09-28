import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Plus, X, Clock3, CheckCircle2, XCircle, Trash2, ExternalLink, ImagePlus } from "lucide-react";

import api, { assetUrl } from "../../services/api";

const categories = ["Anime", "Gaming", "Movies", "TV Shows", "K-Pop", "Comics", "Manga", "Cosplay"];

const statusConfig = {
  pending: { label: "Pending review", icon: Clock3, className: "status-pending" },
  approved: { label: "Approved", icon: CheckCircle2, className: "status-approved" },
  rejected: { label: "Rejected", icon: XCircle, className: "status-rejected" },
};

function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await api.get("/submissions/my");
        setSubmissions(data);
      } catch (err) {
        console.error("Failed to load submissions:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory(categories[0]);
    removeImage();
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);

    try {
      let created;
      if (imageFile) {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("category", category);
        formData.append("content", content.trim());
        formData.append("image", imageFile);
        created = await api.postForm("/submissions", formData);
      } else {
        created = await api.post("/submissions", { title: title.trim(), category, content: content.trim() });
      }
      setSubmissions((current) => [created, ...current]);
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm("Withdraw this submission?")) return;
    try {
      await api.delete(`/submissions/${id}`);
      setSubmissions((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="dash-page-header">
        <h1>Submissions</h1>
        <p>Loading your submissions...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="submissions-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="dash-page-header dash-page-header-row">
        <div>
          <h1>Submissions</h1>
          <p>Submit fan content or articles - admin approval required.</p>
        </div>

        <button
          type="button"
          className="dash-add-btn"
          onClick={() => setShowForm((current) => !current)}
        >
          <Plus size={16} />
          New submission
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            className="dash-card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
          >
            <button
              type="button"
              className="notes-form-close"
              onClick={resetForm}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="dash-field">
              <label htmlFor="sub-title">Title</label>
              <input
                id="sub-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Give your submission a title"
                required
              />
            </div>

            <div className="dash-field">
              <label htmlFor="sub-category">Category</label>
              <select
                id="sub-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="dash-field">
              <label>
                Cover Image{" "}
                <span className="sub-optional">(optional)</span>
              </label>

              {imagePreview ? (
                <div className="sub-image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="sub-image-remove"
                    onClick={removeImage}
                    aria-label="Remove image"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="sub-image-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={18} />
                  <span>Click to upload cover image</span>
                  <small>JPG, PNG, WebP — max 5MB</small>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>

            <div className="dash-field">
              <label htmlFor="sub-content">Content</label>
              <textarea
                id="sub-content"
                rows={5}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write your article or fan content here..."
                required
              />
            </div>

            <button type="submit" className="dash-save-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for review"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {submissions.length === 0 ? (
        <div className="dash-empty-state">
          <Upload size={26} />
          <h3>No submissions yet</h3>
          <p>Share your fan content or article for admin review.</p>
        </div>
      ) : (
        <div className="dash-list">
          {submissions.map((item, index) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;
            return (
              <motion.div
                key={item._id}
                className="dash-list-row"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {item.imageUrl ? (
                  <div className="dash-list-thumb">
                    <img src={assetUrl(item.imageUrl)} alt="" />
                  </div>
                ) : (
                  <div className="dash-list-icon">
                    <Upload size={17} />
                  </div>
                )}

                <div className="dash-list-body">
                  <strong>{item.title}</strong>
                  <span>
                    {item.category} &middot;{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  {item.adminNote && (
                    <em className="fh-bookmark-note">Admin: "{item.adminNote}"</em>
                  )}
                  {item.status === "approved" && item.publishedContent && (
                    <Link to={`/stories/${item.publishedContent}`} className="fh-text-link">
                      View published article <ExternalLink size={12} />
                    </Link>
                  )}
                </div>

                <span className={`dash-status-badge ${status.className}`}>
                  <StatusIcon size={13} />
                  {status.label}
                </span>

                {item.status === "pending" && (
                  <button
                    type="button"
                    className="dash-list-remove"
                    onClick={() => handleWithdraw(item._id)}
                    aria-label="Withdraw submission"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default Submissions;

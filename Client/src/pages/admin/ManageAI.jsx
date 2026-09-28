import { useEffect, useMemo, useState } from "react";
import { Bot, Edit3, HelpCircle, MessageSquare, Plus, Search, Send, Trash2, X, Eye, EyeOff } from "lucide-react";

import StatCard from "../../components/admin/StatCard";
import Loader from "../../components/common/Loader";
import api from "../../services/api";
import "../../styles/admin/dashboard.css";
import "../../styles/admin/manager-shared.css";
import "../../styles/admin/manage-ai.css";

const categories = ["General", "Account", "Content", "Events", "Merchandise"];

const emptyForm = { question: "", answer: "", category: categories[0], keywords: "", active: true };

function ManageAI() {
  const [faqs, setFaqs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [testInput, setTestInput] = useState("");
  const [testReply, setTestReply] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/chat/faqs"), api.get("/chat/stats")])
      .then(([faqData, statData]) => {
        setFaqs(faqData);
        setStats(statData);
      })
      .catch((err) => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return faqs.filter((item) => {
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesSearch =
        !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q) || item.keywords.some((k) => k.includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [faqs, search, categoryFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (faq) => {
    setEditingId(faq._id);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, keywords: faq.keywords.join(", "), active: faq.active });
    setModalOpen(true);
  };

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;

    try {
      if (editingId) {
        const updated = await api.put(`/chat/faqs/${editingId}`, form);
        setFaqs((current) => current.map((item) => (item._id === editingId ? updated : item)));
      } else {
        const created = await api.post("/chat/faqs", form);
        setFaqs((current) => [created, ...current]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleActive = async (faq) => {
    try {
      const updated = await api.put(`/chat/faqs/${faq._id}`, { active: !faq.active });
      setFaqs((current) => current.map((item) => (item._id === faq._id ? updated : item)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this FAQ entry?")) return;
    try {
      await api.delete(`/chat/faqs/${id}`);
      setFaqs((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const runTest = async (event) => {
    event.preventDefault();
    if (!testInput.trim()) return;
    try {
      const res = await api.post("/chat/message", { message: testInput, guestId: `admin-test-${Date.now()}` });
      setTestReply(res.reply);
    } catch (err) {
      setTestReply({ text: err.message, intent: "error" });
    }
  };

  if (loading) return <Loader label="Loading knowledge base..." />;

  return (
    <div className="manager-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">content</p>
          <h1>Chatbot & Knowledge Base</h1>
          <p className="manager-subtitle">
            FAQ entries the assistant answers from. Keywords help it match questions that are worded differently.
          </p>
        </div>

        <button type="button" className="manager-add-btn" onClick={openAdd}>
          <Plus size={16} />
          Add FAQ
        </button>
      </div>

      <div className="manager-stats">
        <StatCard icon={HelpCircle} color="purple" label="faq entries" value={faqs.length} />
        <StatCard icon={Bot} color="blue" label="conversations" value={stats?.sessions ?? 0} />
        <StatCard icon={MessageSquare} color="green" label="messages this week" value={stats?.messagesThisWeek ?? 0} />
        <StatCard icon={MessageSquare} color="pink" label="messages all time" value={stats?.messages ?? 0} />
      </div>

      <div className="fh-admin-split">
        <form className="settings-card fh-bot-test" onSubmit={runTest}>
          <h3>
            <Bot size={16} /> Test the assistant
          </h3>
          <div className="manager-search">
            <input
              type="text"
              placeholder='Try "how do I reset my password" or "recommend some anime"'
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
            />
            <button type="submit" className="manager-icon-btn" aria-label="Send test message">
              <Send size={15} />
            </button>
          </div>
          {testReply && (
            <div className="fh-bot-reply">
              <span className="manager-badge purple">{testReply.intent || "reply"}</span>
              <p style={{ whiteSpace: "pre-line" }}>{testReply.text}</p>
            </div>
          )}
        </form>

        <div className="settings-card">
          <h3>Most used answers</h3>
          {stats?.topFaqs?.length ? (
            <ol className="fh-ranked">
              {stats.topFaqs.map((f) => (
                <li key={f._id}>
                  <span>{f.question}</span>
                  <strong>{f.hits}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="fh-muted">No FAQ answers served yet.</p>
          )}
          {stats?.intents?.length > 0 && (
            <p className="fh-muted">
              Reply types: {stats.intents.map((i) => `${i._id} ${i.count}`).join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="manager-toolbar">
        <div className="manager-search">
          <Search size={16} />
          <input type="text" placeholder="Search questions, answers or keywords..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        <div className="manager-filters">
          <button type="button" className={categoryFilter === "all" ? "manager-filter-chip active" : "manager-filter-chip"} onClick={() => setCategoryFilter("all")}>
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={categoryFilter === category ? "manager-filter-chip active" : "manager-filter-chip"}
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="ai-faq-list">
        {filtered.length === 0 ? (
          <div className="manager-empty">
            <Bot size={26} />
            <h3>No FAQ entries found</h3>
            <p>Try a different search or filter, or add a new entry.</p>
          </div>
        ) : (
          filtered.map((faq) => (
            <div key={faq._id} className={faq.active ? "ai-faq-card" : "ai-faq-card fh-inactive"}>
              <div className="ai-faq-head">
                <span className="manager-badge purple">{faq.category}</span>
                {!faq.active && <span className="manager-badge red">hidden</span>}
                <span className="fh-muted">{faq.hits} uses</span>

                <div className="manager-row-actions">
                  <button type="button" className="manager-icon-btn" onClick={() => toggleActive(faq)} aria-label={faq.active ? "Hide from bot" : "Show to bot"} title={faq.active ? "Hide from bot" : "Show to bot"}>
                    {faq.active ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button type="button" className="manager-icon-btn" onClick={() => openEdit(faq)} aria-label="Edit">
                    <Edit3 size={15} />
                  </button>
                  <button type="button" className="manager-icon-btn danger" onClick={() => handleDelete(faq._id)} aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
              {faq.keywords.length > 0 && (
                <div className="fh-tags">
                  {faq.keywords.map((k) => (
                    <span key={k}>{k}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="manager-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="manager-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="manager-modal-head">
              <h2>{editingId ? "Edit FAQ" : "Add FAQ"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="manager-form-group">
                <label htmlFor="faq-question">Question</label>
                <input id="faq-question" type="text" value={form.question} onChange={handleChange("question")} required />
              </div>

              <div className="manager-form-group">
                <label htmlFor="faq-answer">Answer</label>
                <textarea id="faq-answer" rows={4} value={form.answer} onChange={handleChange("answer")} required />
              </div>

              <div className="manager-form-row">
                <div className="manager-form-group">
                  <label htmlFor="faq-category">Category</label>
                  <select id="faq-category" value={form.category} onChange={handleChange("category")}>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="manager-form-group">
                  <label htmlFor="faq-active">Visible to the bot</label>
                  <select id="faq-active" value={form.active ? "yes" : "no"} onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "yes" }))}>
                    <option value="yes">Yes</option>
                    <option value="no">No (draft)</option>
                  </select>
                </div>
              </div>

              <div className="manager-form-group">
                <label htmlFor="faq-keywords">Keywords (comma separated)</label>
                <input id="faq-keywords" type="text" value={form.keywords} onChange={handleChange("keywords")} placeholder="reset, forgot, password" />
              </div>

              <div className="manager-modal-actions">
                <button type="button" className="manager-cancel-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="manager-save-btn">
                  {editingId ? "Save changes" : "Add FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAI;

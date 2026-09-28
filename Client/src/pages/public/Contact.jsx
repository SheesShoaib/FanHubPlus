import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Send, CheckCircle2, Bug, Lightbulb, HelpCircle } from "lucide-react";

import SectionTitle from "../../components/common/SectionTitle";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import "../../styles/pages/contact.css";

const feedbackTypes = [
  { value: "query", label: "General Query", icon: HelpCircle },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb },
  { value: "bug", label: "Report a Bug", icon: Bug },
];

const TYPE_FIELDS = {
  bug: [
    { name: "severity", label: "How bad is it?", type: "select", options: ["Low - cosmetic", "Medium - annoying", "High - can't use a feature", "Critical - site unusable"], required: true },
    { name: "page", label: "Which page?", type: "text", placeholder: "e.g. /events or Multimedia player" },
    { name: "steps", label: "Steps to reproduce", type: "textarea", placeholder: "1. Go to...\n2. Click...\n3. See error" },
    { name: "browser", label: "Browser & device", type: "text", placeholder: "Auto-detected" },
  ],
  suggestion: [
    { name: "area", label: "Which area?", type: "select", options: ["Explore & search", "Multimedia", "Characters & stories", "Events & map", "Dashboard", "Chatbot", "Other"], required: true },
    { name: "impact", label: "Why would it help fans?", type: "textarea", placeholder: "Tell us the problem it solves" },
  ],
  query: [
    { name: "topic", label: "Topic", type: "select", options: ["Account & login", "Content", "Events", "Merchandise", "Something else"], required: true },
  ],
};

const MESSAGE_LABEL = {
  bug: "What went wrong?",
  suggestion: "Describe your idea",
  query: "Your question",
};

function Contact() {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [form, setForm] = useState({ name: "", email: "", type: "query", subject: "", message: "" });
  const [details, setDetails] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setForm((current) => ({ ...current, name: current.name || user.name, email: current.email || user.email }));
  }, [user]);

  useEffect(() => {
    if (form.type === "bug") {
      setDetails((current) => ({ ...current, browser: current.browser || navigator.userAgent.slice(0, 120) }));
    }
  }, [form.type]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleDetail = (field) => (event) => {
    setDetails((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleTypeSelect = (value) => {
    setForm((current) => ({ ...current, type: value }));
    setDetails({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/feedback", { ...form, details });
      setSubmitted(true);
      setForm((current) => ({ ...current, subject: "", message: "", type: "query" }));
      setDetails({});
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <SectionTitle
          eyebrow="Get in touch"
          title="We'd love to hear from you"
          subtitle="Got a bug to report, an idea for a feature, or a question? Pick a type and the form adapts."
        />
      </section>

      <section className="contact-grid">
        <motion.div
          className="contact-info"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <Mail size={20} />
            </div>
            <div>
              <h3>Email us</h3>
              <p>{settings.supportEmail}</p>
            </div>
          </div>

          <div className="contact-info-card">
            <div className="contact-info-icon">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3>Need a quick answer?</h3>
              <p>Try the assistant in the bottom-right corner. It knows the FAQ.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="contact-form-card"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {submitted ? (
            <div className="contact-success" role="status">
              <CheckCircle2 size={44} />
              <h3>Thanks - message sent!</h3>
              <p>We've received your feedback and will get back to you soon.</p>
              <button type="button" className="contact-again-btn" onClick={() => setSubmitted(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="contact-field">
                <label>What's this about?</label>
                <div className="contact-type-options" role="radiogroup">
                  {feedbackTypes.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={form.type === option.value}
                        className={form.type === option.value ? "contact-type-btn active" : "contact-type-btn"}
                        onClick={() => handleTypeSelect(option.value)}
                      >
                        <Icon size={16} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="contact-field-row">
                <div className="contact-field">
                  <label htmlFor="contact-name">Your name</label>
                  <input id="contact-name" type="text" required value={form.name} onChange={handleChange("name")} placeholder="Aiko Ren" />
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-email">Email</label>
                  <input id="contact-email" type="email" required value={form.email} onChange={handleChange("email")} placeholder="you@example.com" />
                </div>
              </div>

              <div className="contact-field">
                <label htmlFor="contact-subject">Subject</label>
                <input id="contact-subject" type="text" maxLength={150} value={form.subject} onChange={handleChange("subject")} placeholder="Short summary" />
              </div>

              <motion.div key={form.type} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {TYPE_FIELDS[form.type].map((field) => (
                  <div className="contact-field" key={field.name}>
                    <label htmlFor={`fb-${field.name}`}>{field.label}</label>
                    {field.type === "select" ? (
                      <select id={`fb-${field.name}`} required={field.required} value={details[field.name] || ""} onChange={handleDetail(field.name)}>
                        <option value="" disabled>
                          Choose one
                        </option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea id={`fb-${field.name}`} rows={3} value={details[field.name] || ""} onChange={handleDetail(field.name)} placeholder={field.placeholder} />
                    ) : (
                      <input id={`fb-${field.name}`} type="text" value={details[field.name] || ""} onChange={handleDetail(field.name)} placeholder={field.placeholder} />
                    )}
                  </div>
                ))}
              </motion.div>

              <div className="contact-field">
                <label htmlFor="contact-message">{MESSAGE_LABEL[form.type]}</label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  maxLength={5000}
                  value={form.message}
                  onChange={handleChange("message")}
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              {error && <p className="fh-inline-error">{error}</p>}

              <button type="submit" className="contact-submit-btn" disabled={submitting}>
                {submitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={16} />
                    Send message
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </section>
    </div>
  );
}

export default Contact;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ChevronDown, Bot, User, Trash2, CheckCircle2 } from "lucide-react";

import api from "../../services/api";
import Loader from "../../components/common/Loader";

function ChatHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api
      .get("/chat/sessions")
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleOpen = (id) => {
    setOpenId((current) => (current === id ? null : id));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api.delete(`/chat/sessions/${id}`);
      setSessions((current) => current.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Loader label="Loading conversations..." />;

  return (
    <motion.div className="chat-history-page" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="dash-page-header">
        <h1>Chat History</h1>
        <p>Your past conversations with the FanHub+ assistant. The assistant remembers context within each conversation.</p>
      </div>

      {sessions.length === 0 ? (
        <div className="dash-empty-state">
          <MessageSquare size={26} />
          <h3>No conversations yet</h3>
          <p>Open the assistant from the chat bubble in the bottom-right corner and say "give me a tour".</p>
        </div>
      ) : (
        <div className="chat-history-list">
          {sessions.map((conversation, index) => {
            const isOpen = openId === conversation._id;
            return (
              <motion.div
                key={conversation._id}
                className="chat-history-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="fh-chat-summary-row">
                  <button type="button" className="chat-history-summary" onClick={() => toggleOpen(conversation._id)} aria-expanded={isOpen}>
                    <div className="dash-list-icon">
                      <MessageSquare size={17} />
                    </div>

                    <div className="dash-list-body">
                      <strong>{conversation.title}</strong>
                      <span>
                        {new Date(conversation.updatedAt).toLocaleString()} · {conversation.messageCount} messages
                        {conversation.onboardingCompleted && (
                          <>
                            {" · "}
                            <CheckCircle2 size={12} /> tour completed
                          </>
                        )}
                      </span>
                    </div>

                    <ChevronDown size={18} className={isOpen ? "chat-chevron open" : "chat-chevron"} />
                  </button>

                  <button type="button" className="dash-list-remove" onClick={() => handleDelete(conversation._id)} aria-label="Delete conversation">
                    <Trash2 size={16} />
                  </button>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="chat-history-thread"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {conversation.messages.map((message) => (
                        <div key={message._id} className={`chat-bubble-row ${message.from === "user" ? "from-user" : "from-bot"}`}>
                          <div className="chat-bubble-avatar">{message.from === "user" ? <User size={13} /> : <Bot size={13} />}</div>
                          <div>
                            <p style={{ whiteSpace: "pre-line" }}>{message.text}</p>
                            {message.links?.length > 0 && (
                              <div className="fh-chat-links">
                                {message.links.map((link) => (
                                  <Link key={link.to + link.label} to={link.to}>
                                    {link.label}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default ChatHistory;

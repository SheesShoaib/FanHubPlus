import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, RotateCcw, Send, X } from "lucide-react";

import api, { getVisitorId, toQuery } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

const WELCOME = {
  from: "bot",
  text: "Hi! I'm the FanHub+ assistant. Ask me about the platform, get recommendations, find events, or say \"give me a tour\".",
  suggestions: ["Give me a tour", "Recommend some anime", "Upcoming events", "How do I bookmark?"],
};

function sessionKey(user) {
  return `fanhubplus_chat_${user?.id || user?._id || "guest"}`;
}

function readSession(user) {
  try {
    return localStorage.getItem(sessionKey(user));
  } catch {
    return null;
  }
}

function writeSession(user, id) {
  try {
    if (id) localStorage.setItem(sessionKey(user), id);
    else localStorage.removeItem(sessionKey(user));
  } catch {
  }
}

function ChatWidget() {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const stored = readSession(user);
    setSessionId(stored);
    setMessages([WELCOME]);
    setTourStep(-1);
    if (!stored) return;

    api
      .get(`/chat/sessions/${stored}${toQuery({ guestId: getVisitorId() })}`)
      .then((session) => {
        if (session.messages?.length) setMessages([WELCOME, ...session.messages]);
        setTourStep(session.onboardingStep ?? -1);
      })
      .catch(() => {
        writeSession(user, null);
        setSessionId(null);
      });
  }, [user]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!settings.chatbotEnabled) return null;

  const send = async (text) => {
    const message = text.trim();
    if (!message || sending) return;

    setInput("");
    setMessages((current) => [...current, { from: "user", text: message }]);
    setSending(true);

    try {
      const data = await api.post("/chat/message", { message, sessionId, guestId: getVisitorId() });
      setSessionId(data.sessionId);
      writeSession(user, data.sessionId);
      setTourStep(data.onboardingStep);
      setMessages((current) => [...current, data.reply]);
    } catch (err) {
      setMessages((current) => [...current, { from: "bot", text: err.message || "Sorry, something went wrong." }]);
    } finally {
      setSending(false);
    }
  };

  const startOver = () => {
    writeSession(user, null);
    setSessionId(null);
    setTourStep(-1);
    setMessages([WELCOME]);
  };

  const lastBot = [...messages].reverse().find((m) => m.from === "bot");

  return (
    <div className="fh-chat">
      <AnimatePresence>
        {open && (
          <motion.section
            className="fh-chat-panel"
            role="dialog"
            aria-label="FanHub+ assistant"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <header className="fh-chat-head">
              <div className="fh-chat-avatar">
                <Bot size={18} />
              </div>
              <div>
                <strong>FanHub+ Assistant</strong>
                <span>{tourStep >= 0 ? `Platform tour · step ${tourStep + 1} of 6` : "Usually replies instantly"}</span>
              </div>
              <button type="button" onClick={startOver} aria-label="Start a new conversation" title="New conversation">
                <RotateCcw size={16} />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">
                <X size={18} />
              </button>
            </header>

            {tourStep >= 0 && (
              <div className="fh-chat-progress" aria-hidden="true">
                <span style={{ width: `${((tourStep + 1) / 6) * 100}%` }} />
              </div>
            )}

            <div className="fh-chat-messages" ref={listRef} aria-live="polite">
              {messages.map((message, index) => (
                <div key={index} className={`fh-chat-msg ${message.from}`}>
                  <p>{message.text}</p>
                  {message.links?.length > 0 && (
                    <div className="fh-chat-links">
                      {message.links.map((link) => (
                        <Link key={link.to + link.label} to={link.to} onClick={() => setOpen(false)}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="fh-chat-msg bot typing" aria-label="Assistant is typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            {lastBot?.suggestions?.length > 0 && !sending && (
              <div className="fh-chat-suggestions">
                {lastBot.suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              className="fh-chat-input"
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                maxLength={500}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask me anything..."
                aria-label="Message"
              />
              <button type="submit" disabled={!input.trim() || sending} aria-label="Send">
                <Send size={16} />
              </button>
            </form>

            {!user && (
              <p className="fh-chat-note">
                <Link to="/login" onClick={() => setOpen(false)}>Log in</Link> to keep your chat history.
              </p>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="fh-chat-launcher"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}

export default ChatWidget;

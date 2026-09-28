import { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import "../../styles/pages/faq.css";

const faqItems = [
  {
    question: "What is FanHub+?",
    answer:
      "FanHub+ is a fandom platform where fans can explore anime, gaming, movies, K-Pop, manga, cosplay, and other entertainment communities in one place.",
  },
  {
    question: "Do I need an account to explore FanHub+?",
    answer:
      "You can explore public content without an account. Creating one gives you access to favorites, submissions, and personalized features.",
  },
  {
    question: "What fandom categories are available?",
    answer:
      "FanHub+ includes Anime, Gaming, Manga, Movies, K-Pop, Cosplay, and other growing fandom categories.",
  },
  {
    question: "Can I save my favorite content?",
    answer:
      "Yes. Registered users can save supported content and revisit it from their account dashboard.",
  },
  {
    question: "Can users submit content?",
    answer:
      "Yes. Registered users can submit supported fandom content. Submissions may be reviewed before publication.",
  },
  {
    question: "Does FanHub+ include fandom events?",
    answer:
      "Yes. The Events section helps fans discover upcoming fandom-related events and their details.",
  },
  {
    question: "Where can I find articles and stories?",
    answer:
      "Articles and stories are available in the Stories section, where you can explore a variety of fandom content.",
  },
  {
    question: "How can I contact FanHub+?",
    answer:
      "You can use the Contact page to send feedback or questions directly to the FanHub+ team.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <main className="faq-page">
      <section className="faq-hero section-padding">
        <div className="site-container">
          <motion.div
            className="faq-hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="section-eyebrow justify-center">
              <Sparkles size={14} />
              FANHUB+ SUPPORT
            </div>

            <h1 className="section-title">
              Frequently asked <span className="gradient-text">questions.</span>
            </h1>

            <p className="section-description">
              Everything you need to know about exploring fandoms, discovering content, and using FanHub+.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="faq-content section-padding">
        <div className="site-container">
          <div className="faq-layout">
            <motion.div
              className="faq-intro-card"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
            >
              <div className="faq-intro-icon">
                <HelpCircle size={28} />
              </div>

              <span>NEED HELP?</span>

              <h2>Find your answer.</h2>

              <p>
                Browse the most common questions about FanHub+ and its community features.
              </p>
            </motion.div>

            <div className="faq-list">
              {faqItems.map((item, index) => {
                const isOpen = openIndex === index;

                return (
                  <motion.article
                    className={`faq-item ${isOpen ? "faq-item-open" : ""}`}
                    key={item.question}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.04,
                    }}
                  >
                    <button
                      className="faq-question"
                      type="button"
                      onClick={() => toggleFAQ(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.question}</span>

                      <ChevronDown
                        size={20}
                        className={`faq-chevron ${isOpen ? "faq-chevron-open" : ""}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          className="faq-answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p>{item.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default FAQ;

import { motion } from "framer-motion";
import {
  Gamepad2,
  Headphones,
  BookOpen,
  Clapperboard,
  Users,
  WandSparkles,
  Sparkles,
  Target,
  Heart,
  Compass,
} from "lucide-react";
import { Link } from "react-router-dom";

import SectionTitle from "../../components/common/SectionTitle";
import "../../styles/pages/about.css";

function About() {
  const fandoms = [
    { title: "Anime", icon: WandSparkles },
    { title: "Gaming", icon: Gamepad2 },
    { title: "Manga", icon: BookOpen },
    { title: "Movies & TV", icon: Clapperboard },
    { title: "K-Pop", icon: Headphones },
    { title: "Cosplay", icon: Users },
  ];

  const values = [
    {
      icon: Target,
      title: "One hub, every fandom",
      text: "No more jumping between ten different sites and half-dead forums. Anime, gaming, K-pop, comics, cosplay - all under one roof.",
    },
    {
      icon: Heart,
      title: "Built by fans, for fans",
      text: "We're fans first. Every feature exists because we wished it existed somewhere else and it didn't.",
    },
    {
      icon: Compass,
      title: "Discovery over noise",
      text: "Clean categories, real filtering, and curated content - not an algorithm burying what you actually came here for.",
    },
  ];

  return (
    <div className="about-page">
      
      <section className="about-hero">
        <div className="about-hero-glow" />

        <motion.div
          className="about-hero-content"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="about-hero-badge">
            <Sparkles size={14} />
            About Fan Hub Plus
          </span>

          <h1>
            Every fandom you love,
            <br />
            in <span>one universe</span>
          </h1>

          <p>
            Fan Hub Plus started as a simple idea: fandom communities
            deserve a home that's as vibrant and detailed as the worlds
            they're obsessed with - not a cluttered forum or a scattered
            mess of social pages.
          </p>
        </motion.div>
      </section>

      
      <section className="about-story">
        <div className="about-story-grid">
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <SectionTitle
              align="left"
              eyebrow="Our Story"
              title="Why we built this"
            />

            <p className="about-story-text">
              Fandom enthusiasts have always relied on a scattered mix of
              forums, social media pages, and single-fandom niche sites to
              find the content they love - most of it cluttered with ads
              and short on the rich media experience fans actually want.
            </p>

            <p className="about-story-text">
              Fan Hub Plus brings anime, gaming, movies, TV shows, K-pop,
              comics, manga, and cosplay into one clean, categorized,
              visually rich platform - with real search, real filtering,
              and a lot of love from the team building it.
            </p>
          </motion.div>

          <motion.div
            className="about-story-stats"
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="about-stat">
              <h3>8</h3>
              <p>fandom categories</p>
            </div>
            <div className="about-stat">
              <h3>1</h3>
              <p>universe to explore</p>
            </div>
            <div className="about-stat">
              <h3>24/7</h3>
              <p>always open</p>
            </div>
          </motion.div>
        </div>
      </section>

      
      <section className="about-fandoms">
        <SectionTitle
          eyebrow="What we cover"
          title="Fandoms living under this roof"
          subtitle="Every category is presented through an intuitive UI, interactive galleries, and visual storytelling."
        />

        <div className="about-fandoms-grid">
          {fandoms.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                className="about-fandom-card"
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Icon size={22} />
                <span>{item.title}</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      
      <section className="about-values">
        <SectionTitle
          eyebrow="What we stand for"
          title="The things we won't compromise on"
        />

        <div className="about-values-grid">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                className="about-value-card"
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className="about-value-icon">
                  <Icon size={22} />
                </div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      
      <section className="about-cta">
        <motion.div
          className="about-cta-box"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Ready to fall down the rabbit hole?</h2>
          <p>
            Start exploring characters, stories, events, and merch across
            every fandom we've got.
          </p>

          <Link to="/explore" className="about-cta-btn">
            Start Exploring
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

export default About;

import { ArrowUpRight, Sparkles, ArrowRight, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import Hero from "../../components/home/Hero";
import CategoriesSection from "../../components/home/CategoriesSection";
import TrendingSection from "../../components/home/TrendingSection";
import LatestArticles from "../../components/home/LatestArticles";
import FeaturedCharacters from "../../components/home/FeaturedCharacters";
import UpcomingEvents from "../../components/home/UpcomingEvents";
import Sitemap from "../../components/home/Sitemap";
import { useAuth } from "../../context/AuthContext";
import "../../styles/pages/home.css";

function SectionHeading({ eyebrow, title, highlight, description, link, linkLabel }) {
  return (
    <div className="section-heading-row">
      <div>
        <div className="section-eyebrow">
          <Sparkles size={14} />
          {eyebrow}
        </div>

        <h2 className="section-title">
          {title} <span className="gradient-text">{highlight}</span>
        </h2>

        {description && <p className="section-description">{description}</p>}
      </div>

      {link && (
        <Link className="text-link" to={link}>
          {linkLabel}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="home-page">
      <Hero />

      <section className="section-padding discover-section" id="discover">
        <div className="site-container">
          <SectionHeading
            eyebrow="FIND YOUR WORLD"
            title="Every obsession deserves"
            highlight="a universe."
            description="Jump between the fandoms you already love and discover the next one you will not stop talking about."
            link="/categories"
            linkLabel="All categories"
          />
          <CategoriesSection />
        </div>
      </section>

      <section className="section-padding trending-section" id="trending">
        <div className="site-container">
          <SectionHeading
            eyebrow="WHAT FANS LOVE RIGHT NOW"
            title="Trending across the"
            highlight="hub."
            description="The most viewed stories, trailers and soundtracks on FanHub+ right now."
            link="/explore?sort=popular"
            linkLabel="Explore popular"
          />
          <TrendingSection />
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container">
          <SectionHeading
            eyebrow="FRESH FROM THE COMMUNITY"
            title="Latest"
            highlight="stories."
            link="/stories"
            linkLabel="All stories"
          />
          <LatestArticles />
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container">
          <SectionHeading
            eyebrow="ICONS OF EVERY FANDOM"
            title="Featured"
            highlight="characters."
            link="/characters"
            linkLabel="All characters"
          />
          <FeaturedCharacters />
        </div>
      </section>

      <section className="section-padding">
        <div className="site-container">
          <SectionHeading
            eyebrow="MARK YOUR CALENDAR"
            title="What's"
            highlight="next."
            description="Conventions and screenings near you, plus the releases fans are counting down to."
          />
          <UpcomingEvents />
        </div>
      </section>

      {!isAuthenticated && (
        <section className="community-cta">
          <div className="community-glow" />

          <motion.div
            className="site-container community-inner"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <div className="section-eyebrow justify-center">
              <Sparkles size={14} />
              MADE FOR FANS
            </div>

            <h2>
              Don't just follow the story.
              <br />
              <span className="gradient-text">Become part of it.</span>
            </h2>

            <p>
              Save favorites, rate trailers, unlock advanced filters, submit your own fan articles and get
              a dashboard built around the worlds that mean something to you.
            </p>

            <Link className="community-btn" to="/register">
              Enter FanHub+
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </section>
      )}

    </main>
  );
}

export default Home;

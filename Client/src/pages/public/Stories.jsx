import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BookOpen, Clock3, Eye, Search, Sparkles, Star, X } from "lucide-react";

import Loader from "../../components/common/Loader";
import BookmarkButton from "../../components/common/BookmarkButton";
import api, { assetUrl } from "../../services/api";
import useSavedIds from "../../hooks/useSavedIds";
import "../../styles/pages/stories.css";

const accentCycle = ["purple", "green", "red", "blue"];

function readingTime(story) {
  const words = String(story.body || story.description || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function Stories() {
  const isSaved = useSavedIds("Content");
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/articles?sort=${sort}`)
      .then(setStories)
      .catch((err) => console.error("Failed to load stories:", err.message))
      .finally(() => setLoading(false));
  }, [sort]);

  const categories = useMemo(() => {
    const names = stories.map((story) => story.category?.name).filter(Boolean);
    return ["All", ...new Set(names)];
  }, [stories]);

  const filteredStories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return stories.filter((story) => {
      const categoryMatch = activeCategory === "All" || story.category?.name === activeCategory;

      const searchMatch =
        !query ||
        story.title.toLowerCase().includes(query) ||
        story.description?.toLowerCase().includes(query) ||
        story.author?.toLowerCase().includes(query) ||
        story.tags?.some((t) => t.toLowerCase().includes(query));

      return categoryMatch && searchMatch;
    });
  }, [stories, activeCategory, search]);

  const featured = stories.find((s) => s.featured) || stories[0];

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
  };

  if (loading && stories.length === 0) {
    return (
      <main className="stories-page">
        <Loader label="Loading stories..." fullPage />
      </main>
    );
  }

  return (
    <main className="stories-page">
      <section className="stories-hero">
        <img
          className="stories-hero-image"
          src={featured?.imageUrl ? assetUrl(featured.imageUrl) : "/images/stories/journey-never-ends.png"}
          alt=""
          draggable="false"
        />

        <div className="stories-hero-overlay" />
        <div className="stories-hero-grid" />
        <div className="stories-hero-glow" />

        <div className="site-container stories-hero-inner">
          <motion.div
            className="featured-story"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="featured-badge">
              <Sparkles size={14} />
              Featured Story
            </div>

            {featured ? (
              <>
                <h1>{featured.title}</h1>
                <p>{featured.description}</p>

                <div className="featured-meta">
                  <span>
                    <Clock3 size={14} />
                    {readingTime(featured)} min read
                  </span>
                  <i />
                  <span>By {featured.author || "FanHub Editorial"}</span>
                </div>

                <div className="featured-actions">
                  <Link to={`/stories/${featured._id}`} className="read-featured-btn">
                    Read the story
                    <ArrowRight size={17} />
                  </Link>

                  <BookmarkButton itemType="Content" itemId={featured._id} className="featured-save-btn" showLabel={false} />
                </div>
              </>
            ) : (
              <h1>
                THE JOURNEY
                <span>NEVER ENDS.</span>
              </h1>
            )}
          </motion.div>
        </div>

        <div className="stories-scroll-label">
          <span>DISCOVER STORIES</span>
          <div />
        </div>
      </section>

      <section className="stories-library">
        <div className="site-container">
          <div className="stories-heading">
            <div>
              <span className="stories-kicker">FROM ACROSS THE UNIVERSE</span>

              <h2>
                Stories worth
                <span className="gradient-text"> getting lost in.</span>
              </h2>

              <p>Theories, deep lore, reviews and community articles shaping fandom culture.</p>
            </div>

            <span className="stories-result-count">{filteredStories.length} stories found</span>
          </div>

          <div className="stories-search">
            <Search size={19} />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stories, theories, tags..."
              aria-label="Search stories"
            />

            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="stories-filter">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? "story-filter-btn active" : "story-filter-btn"}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}

            <label className="fh-inline-select">
              <span>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="latest">Latest</option>
                <option value="popular">Most popular</option>
                <option value="rating">Top rated</option>
                <option value="alpha">A-Z</option>
              </select>
            </label>
          </div>

          <motion.div layout className="stories-grid">
            <AnimatePresence mode="popLayout">
              {filteredStories.map((story, index) => {
                const accent = accentCycle[index % accentCycle.length];

                return (
                  <motion.article
                    layout
                    key={story._id}
                    className={`story-card story-${accent}`}
                    initial={{ opacity: 0, y: 35, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.45, delay: (index % 6) * 0.05 }}
                  >
                    <div className="story-card-image">
                      {story.imageUrl ? (
                        <img src={assetUrl(story.imageUrl)} alt="" draggable="false" loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "var(--bg-soft)" }} />
                      )}

                      <div className="story-image-overlay" />

                      <div className="story-image-top">
                        <span className="story-category">
                          <BookOpen size={13} />
                          {story.category?.name}
                        </span>

                        <BookmarkButton
                          itemType="Content"
                          itemId={story._id}
                          className="story-bookmark"
                          showLabel={false}
                          initialSaved={isSaved(story._id)}
                        />
                      </div>

                      <span className="story-card-number">{String(index + 1).padStart(2, "0")}</span>
                    </div>

                    <div className="story-card-content">
                      <div className="story-meta">
                        <span>
                          <Clock3 size={12} />
                          {new Date(story.releaseDate || story.createdAt).toLocaleDateString()}
                        </span>
                        <i />
                        <span>{story.author || "FanHub+"}</span>
                      </div>

                      <h3>{story.title}</h3>

                      <p>{story.description}</p>

                      <div className="story-card-footer">
                        <Link to={`/stories/${story._id}`} className="story-read-btn">
                          Read story
                          <ArrowUpRight size={15} />
                        </Link>

                        <span className="story-like-btn" title={`${story.views} views`}>
                          {story.ratingCount > 0 ? (
                            <>
                              <Star size={15} fill="currentColor" />
                              {story.ratingAverage.toFixed(1)}
                            </>
                          ) : (
                            <>
                              <Eye size={15} />
                              {story.views}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {filteredStories.length === 0 && (
            <motion.div className="stories-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div>
                <Search size={25} />
              </div>

              <h3>No stories found.</h3>

              <p>
                {stories.length === 0
                  ? "No published articles yet - add some from the admin panel."
                  : "Try another search or explore a different category."}
              </p>

              <button type="button" onClick={resetFilters}>
                Reset stories
              </button>
            </motion.div>
          )}
        </div>
      </section>

      <section className="story-writer-cta">
        <div className="writer-grid" />
        <div className="writer-glow" />

        <motion.div
          className="site-container writer-inner"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <div className="writer-icon">
            <BookOpen size={22} />
          </div>

          <span>YOUR STORY MATTERS</span>

          <h2>
            Every fan has a
            <br />
            <span className="gradient-text">theory worth sharing.</span>
          </h2>

          <p>
            Submit your theories, lore deep-dives and reviews. Once an admin approves them, they're
            published right here for every fan to read.
          </p>

          <Link to="/dashboard/submissions" className="fh-btn">
            Start writing
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}

export default Stories;

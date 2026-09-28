import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  Lock,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import Loader from "../../components/common/Loader";
import { CATEGORY_ICONS } from "../../components/home/CategoriesSection";
import api, { assetUrl, toQuery } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/pages/explore.css";

const TYPE_LABELS = {
  all: "All types",
  article: "Articles",
  video: "Videos",
  trailer: "Trailers",
  audio: "Audio & podcasts",
  explainer: "Explainers",
  image: "Images",
  character: "Characters",
  merchandise: "Merchandise",
  event: "Events",
};

const SORT_LABELS = { latest: "Latest", popular: "Most popular", rating: "Top rated", alpha: "A-Z" };
const POPULARITY_LABELS = { all: "Any popularity", high: "Trending (75+)", medium: "Rising (40-74)", low: "Hidden gems (<40)" };
const ACCENTS = ["violet", "cyan", "pink", "gold", "red", "green"];

const FILTER_KEYS = ["q", "category", "type", "genre", "year", "popularity", "sort", "page"];

function Explore() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const read = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) || ""]));
    return { ...read, type: read.type || "all", sort: read.sort || "latest", page: Number(read.page) || 1 };
  }, [searchParams]);

  const [searchText, setSearchText] = useState(filters.q);
  const [options, setOptions] = useState({ categories: [], genres: [], years: [] });
  const [data, setData] = useState({ results: [], total: 0, pages: 1, facets: {}, limited: true });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.get("/content/filters").then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    setSearchText(filters.q);
  }, [filters.q]);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/content/explore${toQuery({ ...filters, limit: 12 })}`)
      .then(setData)
      .catch(() => setData({ results: [], total: 0, pages: 1, facets: {}, limited: !isAuthenticated }))
      .finally(() => setLoading(false));
  }, [filters, isAuthenticated]);

  const updateFilters = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries({ page: "", ...patch }).forEach(([key, value]) => {
      if (value === "" || value === "all" || value === undefined || (key === "sort" && value === "latest")) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  };

  const submitSearch = (event) => {
    event.preventDefault();
    updateFilters({ q: searchText.trim() });
  };

  const resetAll = () => {
    setSearchText("");
    setSearchParams({}, { replace: true });
  };

  const activeCount = ["category", "genre", "year", "popularity"].filter((k) => filters[k]).length + (filters.type !== "all" ? 1 : 0);

  return (
    <div className="explore-page">
      <section className="explore-hero">
        <div className="explore-grid" />
        <div className="explore-glow explore-glow-left" />
        <div className="explore-glow explore-glow-right" />

        <div className="explore-orb orb-one" />
        <div className="explore-orb orb-two" />

        <div className="site-container explore-hero-inner">
          <motion.div
            className="explore-hero-copy"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="explore-eyebrow">
              <Sparkles size={14} />
              YOUR NEXT OBSESSION STARTS HERE
            </div>

            <h1>
              FIND YOUR
              <span> NEXT WORLD.</span>
            </h1>

            <p>
              Search every article, trailer, soundtrack, character, event and collectible across all eight
              fandoms, then narrow it down exactly how you like.
            </p>
          </motion.div>

          <motion.div
            className="explore-search-shell"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <form className="explore-search" onSubmit={submitSearch} role="search">
              <Search size={20} />

              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search anime, games, movies, artists..."
                aria-label="Search all content"
              />

              {searchText && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => {
                    setSearchText("");
                    updateFilters({ q: "" });
                  }}
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}

              <button className="search-action" type="submit">
                Explore
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="search-suggestions">
              <span>Try:</span>
              {["Starlight", "Neon Drift", "soundtrack", "cosplay"].map((term) => (
                <button key={term} type="button" onClick={() => updateFilters({ q: term })}>
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="explore-hero-line" />
      </section>

      <section className="explore-content">
        <div className="site-container">
          <div className="explore-toolbar">
            <div>
              <span className="explore-section-kicker">DISCOVER BY FANDOM</span>
              <h2>
                Choose your
                <span className="gradient-text"> universe.</span>
              </h2>
            </div>

            <span className="result-count" aria-live="polite">
              {loading ? "Searching..." : `${data.total} result${data.total === 1 ? "" : "s"}`}
            </span>
          </div>

          <div className="category-filter">
            <button
              type="button"
              className={!filters.category ? "filter-chip active" : "filter-chip"}
              onClick={() => updateFilters({ category: "" })}
            >
              <Sparkles size={15} />
              All
            </button>
            {options.categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug] || Sparkles;
              return (
                <button
                  type="button"
                  key={category._id}
                  className={filters.category === category.slug ? "filter-chip active" : "filter-chip"}
                  onClick={() => updateFilters({ category: category.slug })}
                >
                  <Icon size={15} />
                  {category.name}
                </button>
              );
            })}
          </div>

          <div className="fh-filter-bar">
            <label>
              <span>Type</span>
              <select value={filters.type} onChange={(e) => updateFilters({ type: e.target.value })}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                    {value !== "all" && data.facets[value] ? ` (${data.facets[value]})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Sort by</span>
              <select value={filters.sort} onChange={(e) => updateFilters({ sort: e.target.value })}>
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" className="fh-filter-toggle" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
              <SlidersHorizontal size={15} />
              Advanced filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </button>

            {(activeCount > 0 || filters.q) && (
              <button type="button" className="fh-filter-reset" onClick={resetAll}>
                Reset all
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="fh-filter-advanced"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {!isAuthenticated ? (
                  <p className="fh-locked">
                    <Lock size={15} />
                    Genre, release-year and popularity filters are for members.{" "}
                    <Link to="/login" state={{ from: { pathname: "/explore", search: window.location.search } }}>
                      Log in
                    </Link>{" "}
                    or <Link to="/register">create a free account</Link>.
                  </p>
                ) : (
                  <div className="fh-filter-grid">
                    <label>
                      <span>Genre</span>
                      <select value={filters.genre} onChange={(e) => updateFilters({ genre: e.target.value })}>
                        <option value="">Any genre</option>
                        {options.genres.map((genre) => (
                          <option key={genre} value={genre}>
                            {genre}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Release year</span>
                      <select value={filters.year} onChange={(e) => updateFilters({ year: e.target.value })}>
                        <option value="">Any year</option>
                        {options.years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Popularity</span>
                      <select value={filters.popularity || "all"} onChange={(e) => updateFilters({ popularity: e.target.value })}>
                        {Object.entries(POPULARITY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <Loader label="Searching the universe..." />
          ) : (
            <motion.div layout className="explore-world-grid">
              <AnimatePresence mode="popLayout">
                {data.results.map((item, index) => (
                  <motion.article
                    layout
                    key={`${item.kind}-${item._id}`}
                    className={`world-card world-${ACCENTS[index % ACCENTS.length]}`}
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, delay: index * 0.03 }}
                  >
                    <Link to={item.link} className="world-image">
                      {item.imageUrl ? (
                        <img src={assetUrl(item.imageUrl)} alt="" draggable="false" loading="lazy" />
                      ) : (
                        <span className="fh-img-fallback" />
                      )}

                      <div className="world-overlay" />

                      <div className="world-card-top">
                        <span>{TYPE_LABELS[item.kind]?.replace(/s$/, "") || item.kind}</span>
                        <span aria-hidden="true">
                          <ArrowUpRight size={17} />
                        </span>
                      </div>

                      <div className="world-index">{String((filters.page - 1) * 12 + index + 1).padStart(2, "0")}</div>
                    </Link>

                    <div className="world-content">
                      <div className="world-meta">
                        <span>{item.category?.name || "FanHub+"}</span>
                        {item.year && (
                          <>
                            <i />
                            <span>{item.year}</span>
                          </>
                        )}
                        <i />
                        <span>
                          <Eye size={11} /> {item.views}
                        </span>
                        {item.rating > 0 && (
                          <>
                            <i />
                            <span>
                              <Star size={11} /> {item.rating.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>

                      <h3>{item.title}</h3>

                      <p>{item.description}</p>

                      <Link className="enter-world" to={item.link}>
                        Open
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && data.results.length === 0 && (
            <motion.div className="no-worlds" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="no-worlds-icon">
                <Search size={26} />
              </div>

              <h3>No universe found.</h3>

              <p>Try another search or switch to a different fandom.</p>

              <button type="button" onClick={resetAll}>
                Reset discovery
              </button>
            </motion.div>
          )}

          {data.pages > 1 && (
            <nav className="fh-pagination" aria-label="Results pages">
              <button type="button" disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })}>
                Previous
              </button>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === filters.page ? "active" : ""}
                  aria-current={page === filters.page ? "page" : undefined}
                  onClick={() => updateFilters({ page })}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={filters.page >= data.pages}
                onClick={() => updateFilters({ page: filters.page + 1 })}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </section>

      {!isAuthenticated && (
        <section className="explore-bottom-cta">
          <div className="explore-cta-glow" />

          <motion.div
            className="site-container explore-cta-inner"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <Sparkles size={22} />

            <h2>Want sharper results?</h2>

            <p>Members can filter by genre, release year and popularity, and bookmark anything they find.</p>

            <Link to="/register">
              Join the hub
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </section>
      )}
    </div>
  );
}

export default Explore;

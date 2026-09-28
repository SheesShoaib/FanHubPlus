import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Video, Music2, Sparkles, Clock3, Eye, Star, X, Clapperboard, Lightbulb } from "lucide-react";

import SectionTitle from "../../components/common/SectionTitle";
import SearchBar from "../../components/common/SearchBar";
import Loader from "../../components/common/Loader";
import MediaPlayer from "../../components/common/MediaPlayer";
import StarRating from "../../components/common/StarRating";
import BookmarkButton from "../../components/common/BookmarkButton";
import ShareButton from "../../components/common/ShareButton";
import api, { assetUrl, toQuery } from "../../services/api";
import "../../styles/pages/multimedia.css";

const typeTabs = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "video", label: "Videos", icon: Video },
  { value: "trailer", label: "Trailers", icon: Clapperboard },
  { value: "audio", label: "Audio", icon: Music2 },
  { value: "explainer", label: "Explainers", icon: Lightbulb },
];

const accents = ["purple", "cyan", "pink", "orange", "green"];

function Multimedia() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("item");

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("latest");
  const [activeMedia, setActiveMedia] = useState(null);

  useEffect(() => {
    api.get("/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get(`/multimedia${toQuery({ type: activeType, category, sort, search })}`)
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [activeType, category, sort, search]);

  useEffect(() => {
    if (!openId) {
      setActiveMedia(null);
      return;
    }
    api
      .get(`/multimedia/${openId}`)
      .then(setActiveMedia)
      .catch(() => setActiveMedia(null));
  }, [openId]);

  const openMedia = (item) => setSearchParams({ item: item._id });
  const closeMedia = () => setSearchParams({});

  return (
    <div className="multimedia-page">
      <section className="multimedia-hero">
        <SectionTitle
          eyebrow="Multimedia Center"
          title="Watch, listen, relive"
          subtitle="Trailers, behind-the-scenes videos, soundtracks, podcasts and animated explainers from every fandom in one place."
        />

        <div className="multimedia-controls">
          <SearchBar value={search} onChange={setSearch} placeholder="Search videos, trailers, audio..." />

          <div className="multimedia-tabs" role="tablist">
            {typeTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={activeType === tab.value}
                  className={activeType === tab.value ? "multimedia-tab active" : "multimedia-tab"}
                  onClick={() => setActiveType(tab.value)}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="fh-filter-bar center">
            <label>
              <span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="latest">Newest</option>
                <option value="popular">Most popular</option>
                <option value="rating">Top rated</option>
                <option value="alpha">A-Z</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {loading ? (
        <Loader label="Loading media..." />
      ) : (
        <section className="multimedia-grid">
          {items.length === 0 ? (
            <div className="multimedia-empty">
              <p>No media found. Try a different search or filter.</p>
            </div>
          ) : (
            items.map((item, index) => (
              <motion.button
                type="button"
                key={item._id}
                className={`media-card accent-${accents[index % accents.length]}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
                onClick={() => openMedia(item)}
                aria-label={`Play ${item.title}`}
              >
                <div className="media-thumb">
                  {item.imageUrl && <img className="media-thumb-img" src={assetUrl(item.imageUrl)} alt="" loading="lazy" />}
                  <span className="media-play-btn">
                    {item.type === "audio" ? <Music2 size={20} /> : <Play size={20} fill="currentColor" />}
                  </span>
                  {item.duration && (
                    <span className="media-duration">
                      <Clock3 size={12} />
                      {item.duration}
                    </span>
                  )}
                </div>

                <div className="media-info">
                  <span className="media-type-badge">{item.type}</span>
                  <h3>{item.title}</h3>
                  <p>
                    {item.category?.name}
                    {item.ratingCount > 0 && (
                      <>
                        {" · "}
                        <Star size={11} /> {item.ratingAverage.toFixed(1)}
                      </>
                    )}
                    {" · "}
                    <Eye size={11} /> {item.views}
                  </p>
                </div>
              </motion.button>
            ))
          )}
        </section>
      )}

      <AnimatePresence>
        {activeMedia && (
          <motion.div
            className="media-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMedia}
          >
            <motion.div
              className="media-modal"
              role="dialog"
              aria-modal="true"
              aria-label={activeMedia.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className="media-modal-close" onClick={closeMedia} aria-label="Close player">
                <X size={18} />
              </button>

              <MediaPlayer key={activeMedia._id} item={activeMedia} />

              <div className="media-modal-info">
                <span className="media-type-badge">{activeMedia.type}</span>
                <h2>{activeMedia.title}</h2>
                <p>
                  {[activeMedia.category?.name, activeMedia.fandom, activeMedia.genre, activeMedia.duration]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {activeMedia.description && <p className="fh-media-desc">{activeMedia.description}</p>}

                {activeMedia.tags?.length > 0 && (
                  <div className="fh-tags">
                    {activeMedia.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                )}

                <StarRating contentId={activeMedia._id} />

                <div className="fh-action-row">
                  <BookmarkButton itemType="Content" itemId={activeMedia._id} />
                  <ShareButton title={activeMedia.title} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Multimedia;

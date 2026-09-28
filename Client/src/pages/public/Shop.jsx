import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Eye,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import Loader from "../../components/common/Loader";
import BookmarkButton from "../../components/common/BookmarkButton";
import ShareButton from "../../components/common/ShareButton";
import api, { assetUrl } from "../../services/api";
import useSavedIds from "../../hooks/useSavedIds";
import "../../styles/pages/shop.css";

const productTypes = ["All", "Apparel", "Figures", "Manga", "Posters", "Accessories", "Collectibles"];
const RELEASE_TYPES = ["All", "Anime", "Game", "Movie", "TV Show", "Comic", "Manga", "K-Pop", "Merchandise"];

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(date) {
  return Math.max(0, Math.ceil((new Date(date) - new Date()) / (24 * 60 * 60 * 1000)));
}

function ProductCard({ product, index, isSaved, onOpen }) {
  const discount =
    product.oldPrice > product.price ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  return (
    <motion.article
      layout
      className="product-card"
      initial={{ opacity: 0, y: 35, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, delay: (index % 8) * 0.05 }}
    >
      <div className="product-image">
        {product.imageUrl ? (
          <img src={assetUrl(product.imageUrl)} alt={product.name} draggable="false" loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "var(--bg-soft)" }} />
        )}

        <div className="product-overlay" />

        <div className="product-image-top">
          {product.tag && <span className="product-badge">{product.tag}</span>}

          <BookmarkButton
            itemType="Merchandise"
            itemId={product._id}
            className="wishlist-btn"
            showLabel={false}
            initialSaved={isSaved(product._id)}
          />
        </div>

        {product.isUpcoming && product.releaseDate ? (
          <span className="discount-badge">Drops {formatDate(product.releaseDate)}</span>
        ) : (
          discount > 0 && <span className="discount-badge">-{discount}%</span>
        )}
      </div>

      <div className="product-content">
        <div className="product-category">
          {product.productType}
          {product.fandom ? ` · ${product.fandom}` : ""}
        </div>

        <h3>{product.name}</h3>

        {product.reviews > 0 && (
          <div className="product-rating">
            <Star size={13} fill="currentColor" />
            <strong>{product.rating}</strong>
            <span>({product.reviews})</span>
          </div>
        )}

        <p>{product.description}</p>

        <div className="product-price-row">
          <div>
            {product.price > 0 && <strong>${product.price.toFixed(2)}</strong>}
            {product.oldPrice > product.price && <del>${product.oldPrice.toFixed(2)}</del>}
          </div>

          <button type="button" className="add-cart-btn" onClick={() => onOpen(product)}>
            <Eye size={15} />
            View Details
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function Shop() {
  const isSaved = useSavedIds("Merchandise");
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("item");

  const [products, setProducts] = useState([]);
  const [releases, setReleases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeType, setActiveType] = useState("All");
  const [category, setCategory] = useState("all");
  const [fandom, setFandom] = useState("all");
  const [tag, setTag] = useState("all");
  const [groupBy, setGroupBy] = useState("none");
  const [search, setSearch] = useState("");
  const [releaseType, setReleaseType] = useState("All");

  useEffect(() => {
    Promise.all([api.get("/merchandise"), api.get("/releases"), api.get("/categories")])
      .then(([merch, upcoming, cats]) => {
        setProducts(merch);
        setReleases(upcoming);
        setCategories(cats);
      })
      .catch((err) => console.error("Failed to load merchandise:", err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash === "#releases") {
      document.getElementById("releases")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading]);

  const activeProduct = useMemo(() => products.find((p) => p._id === openId) || null, [products, openId]);

  useEffect(() => {
    if (activeProduct) api.post(`/merchandise/${activeProduct._id}/view`, {}).catch(() => {});
  }, [activeProduct]);

  const openProduct = (product) => setSearchParams({ item: product._id });
  const closeProduct = () => setSearchParams({});

  const fandoms = useMemo(() => [...new Set(products.map((p) => p.fandom).filter(Boolean))].sort(), [products]);
  const tags = useMemo(() => [...new Set(products.map((p) => p.tag).filter(Boolean))].sort(), [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const typeMatch = activeType === "All" || product.productType === activeType;
      const categoryMatch = category === "all" || product.category?.slug === category;
      const fandomMatch = fandom === "all" || product.fandom === fandom;
      const tagMatch = tag === "all" || product.tag === tag;
      const searchMatch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.fandom?.toLowerCase().includes(query) ||
        product.productType?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query);

      return typeMatch && categoryMatch && fandomMatch && tagMatch && searchMatch;
    });
  }, [products, activeType, category, fandom, tag, search]);

  const groups = useMemo(() => {
    if (groupBy === "none") return [["", filteredProducts]];
    const map = {};
    filteredProducts.forEach((p) => {
      const key = (groupBy === "fandom" ? p.fandom : p.category?.name) || "Other";
      (map[key] = map[key] || []).push(p);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredProducts, groupBy]);

  const visibleReleases = releases.filter((r) => releaseType === "All" || r.releaseType === releaseType);

  const resetFilters = () => {
    setSearch("");
    setActiveType("All");
    setCategory("all");
    setFandom("all");
    setTag("all");
  };

  const featuredPick = products.find((p) => p.tag === "Collectible") || products[0];

  if (loading) {
    return (
      <main className="shop-page">
        <Loader label="Loading merchandise..." fullPage />
      </main>
    );
  }

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <div className="shop-hero-grid" />
        <div className="shop-hero-glow shop-glow-one" />
        <div className="shop-hero-glow shop-glow-two" />

        <div className="site-container shop-hero-inner">
          <motion.div
            className="shop-hero-copy"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="shop-hero-badge">
              <Sparkles size={14} />
              FanHub+ Merchandise Showcase
            </div>

            <h1>
              COLLECT WHAT
              <span>YOU LOVE.</span>
            </h1>

            <p>
              Discover apparel, figures, manga box sets, art prints and upcoming collector drops from every
              fandom. Bookmark your favourites to track them.
            </p>

            <div className="shop-hero-actions">
              <a href="#shop-products" className="shop-primary-btn">
                Browse collection
                <ArrowRight size={17} />
              </a>
              <a href="#releases" className="shop-secondary-btn">
                <CalendarClock size={16} />
                Upcoming releases
              </a>
            </div>

            <div className="shop-benefits">
              <span>
                <ShieldCheck size={15} />
                Display & discovery only
              </span>
              <span>
                <Package size={15} />
                Grouped by fandom
              </span>
              <span>
                <Sparkles size={15} />
                Limited & pre-order drops
              </span>
            </div>
          </motion.div>

          <motion.div
            className="shop-hero-product"
            initial={{ opacity: 0, x: 50, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="shop-product-aura" />

            <div className="shop-featured-image">
              {featuredPick?.imageUrl ? (
                <img src={assetUrl(featuredPick.imageUrl)} alt={featuredPick.name} draggable="false" />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "var(--bg-soft)" }} />
              )}
            </div>

            {featuredPick && (
              <button type="button" className="shop-floating-card" onClick={() => openProduct(featuredPick)}>
                <span>COLLECTOR'S PICK</span>
                <strong>{featuredPick.name}</strong>
                {featuredPick.price > 0 && <small>${featuredPick.price.toFixed(2)}</small>}
              </button>
            )}
          </motion.div>
        </div>
      </section>

      <section className="shop-products-section" id="shop-products">
        <div className="site-container">
          <div className="shop-heading">
            <div>
              <span className="shop-kicker">THE FANHUB+ COLLECTION</span>
              <h2>
                Built for the
                <span className="gradient-text"> obsessed.</span>
              </h2>
              <p>Limited drops, collector pieces and fandom essentials, tagged and grouped so you can find your fandom fast.</p>
            </div>
          </div>

          <div className="shop-search">
            <Search size={19} />
            <input
              type="text"
              placeholder="Search merchandise or fandoms..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search merchandise"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="shop-filters">
            {productTypes.map((type) => (
              <button
                type="button"
                key={type}
                className={activeType === type ? "shop-filter active" : "shop-filter"}
                onClick={() => setActiveType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="fh-filter-bar">
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
              <span>Fandom</span>
              <select value={fandom} onChange={(e) => setFandom(e.target.value)}>
                <option value="all">All fandoms</option>
                {fandoms.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tag</span>
              <select value={tag} onChange={(e) => setTag(e.target.value)}>
                <option value="all">All tags</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Group by</span>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="none">No grouping</option>
                <option value="fandom">Fandom</option>
                <option value="category">Category</option>
              </select>
            </label>
          </div>

          <div className="shop-results-row">
            <span>{filteredProducts.length} products</span>
          </div>

          {groups.map(([groupName, items]) => (
            <div key={groupName || "all"} className={groupName ? "fh-shop-group" : ""}>
              {groupName && (
                <h3 className="fh-shop-group-title">
                  {groupName} <small>{items.length}</small>
                </h3>
              )}
              <motion.div layout className="products-grid">
                <AnimatePresence mode="popLayout">
                  {items.map((product, index) => (
                    <ProductCard key={product._id} product={product} index={index} isSaved={isSaved} onOpen={openProduct} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <motion.div className="shop-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Search size={26} />
              <h3>No merchandise found.</h3>
              <p>
                {products.length === 0
                  ? "No products yet - add some from the admin panel."
                  : "Try another product name, fandom or tag."}
              </p>
              <button type="button" onClick={resetFilters}>
                Reset filters
              </button>
            </motion.div>
          )}
        </div>
      </section>

      <section className="fh-releases site-container" id="releases" aria-labelledby="releases-heading">
        <span className="shop-kicker">MARK YOUR CALENDAR</span>
        <h2 id="releases-heading">
          Upcoming <span className="gradient-text">releases.</span>
        </h2>
        <p className="fh-muted">Anticipated anime, games, movies, shows, comics and merchandise drops.</p>

        <div className="fh-chip-row left">
          {RELEASE_TYPES.map((type) => (
            <button key={type} type="button" className={releaseType === type ? "active" : ""} onClick={() => setReleaseType(type)}>
              {type}
            </button>
          ))}
        </div>

        {visibleReleases.length === 0 ? (
          <p className="fh-muted">No upcoming releases in this category yet.</p>
        ) : (
          <div className="fh-release-list">
            {visibleReleases.map((release, index) => (
              <motion.article
                key={release._id}
                className="fh-release-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (index % 4) * 0.05 }}
              >
                {release.imageUrl ? <img src={assetUrl(release.imageUrl)} alt="" loading="lazy" /> : <span className="fh-img-fallback" />}
                <div>
                  <div className="fh-release-meta">
                    <span className="fh-type-chip">{release.releaseType}</span>
                    {release.tag && <span className="fh-tag-chip">{release.tag}</span>}
                  </div>
                  <h3>{release.title}</h3>
                  <p>{release.description}</p>
                  <small>
                    {formatDate(release.releaseDate)}
                    {release.platform ? ` · ${release.platform}` : ""}
                    {release.fandom ? ` · ${release.fandom}` : ""}
                  </small>
                </div>
                <div className="fh-countdown" aria-label={`${daysUntil(release.releaseDate)} days to go`}>
                  <strong>{daysUntil(release.releaseDate)}</strong>
                  <span>days</span>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <section className="shop-community">
        <div className="shop-community-glow" />

        <motion.div
          className="site-container shop-community-inner"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <Package size={23} />
          <span>MORE THAN MERCH</span>
          <h2>
            Your collection.
            <br />
            <span className="gradient-text">Your fandom identity.</span>
          </h2>
          <p>Every piece tells people which worlds, characters and stories mean something to you.</p>
          <a href="#shop-products">
            Explore collection
            <ArrowUpRight size={16} />
          </a>
        </motion.div>
      </section>

      <AnimatePresence>
        {activeProduct && (
          <motion.div
            className="product-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProduct}
          >
            <motion.div
              className="product-modal"
              role="dialog"
              aria-modal="true"
              aria-label={activeProduct.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className="product-modal-close" onClick={closeProduct} aria-label="Close">
                <X size={18} />
              </button>

              <div className="product-modal-image">
                {activeProduct.imageUrl ? (
                  <img src={assetUrl(activeProduct.imageUrl)} alt={activeProduct.name} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--bg-soft)" }} />
                )}
              </div>

              <div className="product-modal-info">
                {activeProduct.tag && <span className="product-badge">{activeProduct.tag}</span>}
                <h2>{activeProduct.name}</h2>
                <p className="product-modal-category">
                  {[activeProduct.productType, activeProduct.fandom, activeProduct.category?.name].filter(Boolean).join(" · ")}
                </p>

                {activeProduct.reviews > 0 && (
                  <div className="product-modal-rating">
                    <Star size={14} fill="currentColor" />
                    <strong>{activeProduct.rating}</strong>
                    <span>({activeProduct.reviews} reviews)</span>
                  </div>
                )}

                <p className="product-modal-desc">{activeProduct.description}</p>

                {activeProduct.isUpcoming && activeProduct.releaseDate && (
                  <p className="fh-inline-note">
                    <CalendarClock size={14} /> Drops on {formatDate(activeProduct.releaseDate)}
                  </p>
                )}

                {activeProduct.price > 0 && (
                  <div className="product-modal-price">
                    <strong>${activeProduct.price.toFixed(2)}</strong>
                    {activeProduct.oldPrice > activeProduct.price && <del>${activeProduct.oldPrice.toFixed(2)}</del>}
                  </div>
                )}

                <div className="fh-action-row">
                  <BookmarkButton itemType="Merchandise" itemId={activeProduct._id} />
                  <ShareButton title={activeProduct.name} />
                </div>

                <p className="product-modal-note">
                  This is a display showcase for discovery only. FanHub+ doesn't sell products or process payments.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default Shop;

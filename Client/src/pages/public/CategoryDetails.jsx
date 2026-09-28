import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  CalendarDays,
  Compass,
  PlayCircle,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";

import Loader from "../../components/common/Loader";
import { CATEGORY_ICONS } from "../../components/home/CategoriesSection";
import api, { assetUrl } from "../../services/api";
import { useBreadcrumb } from "../../context/BreadcrumbContext";
import "../../styles/pages/category-details.css";

function PreviewRow({ title, items, render, moreLink }) {
  if (!items?.length) return null;
  return (
    <section className="fh-category-row">
      <div className="fh-row-head">
        <h2>{title}</h2>
        <Link to={moreLink} className="fh-text-link">
          See all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="fh-card-grid four">{items.map(render)}</div>
    </section>
  );
}

function MiniCard({ to, image, eyebrow, title }) {
  return (
    <Link to={to} className="fh-mini-card">
      {image ? <img src={assetUrl(image)} alt="" loading="lazy" /> : <span className="fh-img-fallback" />}
      <div>
        {eyebrow && <small>{eyebrow}</small>}
        <strong>{title}</strong>
      </div>
    </Link>
  );
}

function CategoryDetails() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useBreadcrumb(data?.category?.name);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/categories/${slug}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loader label="Loading category..." fullPage />;

  if (!data) {
    return (
      <div className="category-details-page">
        <div className="category-not-found">
          <h2>Category not found</h2>
          <p>We couldn't find a fandom category matching "{slug}".</p>
          <Link to="/categories" className="category-back-link">
            <ArrowLeft size={16} />
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  const { category, counts } = data;
  const Icon = CATEGORY_ICONS[category.slug] || Sparkles;
  const explore = (type) => `/explore?category=${category.slug}${type ? `&type=${type}` : ""}`;

  const quickLinks = [
    { title: "Stories & Articles", count: counts.articles, icon: BookMarked, to: explore("article") },
    { title: "Videos & Audio", count: counts.media, icon: PlayCircle, to: `/multimedia` },
    { title: "Characters", count: counts.characters, icon: UserRound, to: explore("character") },
    { title: "Merchandise", count: counts.merchandise, icon: ShoppingBag, to: explore("merchandise") },
    { title: "Events", count: counts.events, icon: CalendarDays, to: explore("event") },
    { title: "Explore everything", count: null, icon: Compass, to: explore() },
  ];

  return (
    <div className="category-details-page">
      <section className={`category-banner accent-${category.accent || "purple"}`}>
        <Link to="/categories" className="category-back-link">
          <ArrowLeft size={16} />
          All Categories
        </Link>

        <motion.div
          className="category-banner-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="category-banner-icon">
            <Icon size={34} />
          </div>

          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </motion.div>
      </section>

      <section className="category-quick-links">
        {quickLinks.map((link, index) => {
          const LinkIcon = link.icon;
          return (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link to={link.to} className="category-quick-card">
                <div className="category-quick-icon">
                  <LinkIcon size={20} />
                </div>
                <h3>{link.title}</h3>
                <p>{link.count === null ? `Search and filter all ${category.name} content.` : `${link.count} in ${category.name}`}</p>
                <span>
                  Go
                  <ArrowRight size={14} />
                </span>
              </Link>
            </motion.div>
          );
        })}
      </section>

      <div className="site-container">
        <PreviewRow
          title="Latest stories"
          items={data.articles}
          moreLink={explore("article")}
          render={(a) => <MiniCard key={a._id} to={`/stories/${a._id}`} image={a.imageUrl} eyebrow={a.author} title={a.title} />}
        />
        <PreviewRow
          title="Watch & listen"
          items={data.media}
          moreLink="/multimedia"
          render={(m) => <MiniCard key={m._id} to={`/multimedia?item=${m._id}`} image={m.imageUrl} eyebrow={m.type} title={m.title} />}
        />
        <PreviewRow
          title="Characters"
          items={data.characters}
          moreLink={explore("character")}
          render={(c) => <MiniCard key={c._id} to={`/characters/${c._id}`} image={c.imageUrl} eyebrow={c.fandom} title={c.name} />}
        />
        <PreviewRow
          title="Merchandise"
          items={data.merchandise}
          moreLink="/shop"
          render={(p) => <MiniCard key={p._id} to={`/shop?item=${p._id}`} image={p.imageUrl} eyebrow={p.tag} title={p.name} />}
        />
        <PreviewRow
          title="Upcoming events"
          items={data.events}
          moreLink="/events"
          render={(e) => <MiniCard key={e._id} to={`/events/${e._id}`} image={e.imageUrl} eyebrow={`${e.date} · ${e.city || e.venue}`} title={e.name} />}
        />
      </div>
    </div>
  );
}

export default CategoryDetails;

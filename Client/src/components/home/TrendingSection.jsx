import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Eye } from "lucide-react";

import api, { assetUrl } from "../../services/api";
import Loader from "../common/Loader";

const cardVariants = {
  hidden: { opacity: 0, y: 45 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

function TrendingSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/content/trending?limit=4")
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading trending..." />;
  if (!items.length) return <p className="fh-muted">Nothing trending yet.</p>;

  return (
    <div className="trending-grid">
      {items.map((item, index) => (
        <motion.article
          className="trend-card"
          key={item._id}
          custom={index}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.18 }}
        >
          <div className="trend-image">
            <img
              src={assetUrl(item.imageUrl) || "/images/trending/arc.jpg"}
              alt=""
              loading="lazy"
              draggable="false"
            />

            <div className="trend-image-overlay" />

            <div className="trend-top">
              <span className="trend-category">{item.category?.name?.toUpperCase()}</span>
              <Link className="trend-open" to={item.link} aria-label={`Open ${item.title}`}>
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <span className="trend-number">{String(index + 1).padStart(2, "0")}</span>
          </div>

          <div className="trend-info">
            <span>
              {item.kind} · <Eye size={11} /> {item.views}
            </span>

            <h3>{item.title}</h3>

            <p>{item.description}</p>

            <Link className="trend-explore" to={item.link}>
              {item.kind === "article" ? "Read story" : "Watch / listen"}
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

export default TrendingSection;

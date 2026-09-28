import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock3 } from "lucide-react";

import api, { assetUrl } from "../../services/api";
import Loader from "../common/Loader";

function LatestArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/articles?sort=latest")
      .then((data) => setArticles(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading stories..." />;
  if (!articles.length) return null;

  return (
    <div className="fh-card-grid three latest-stories">
      {articles.map((article, index) => (
        <motion.article
          key={article._id}
          className="fh-card"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: index * 0.08 }}
        >
          <Link to={`/stories/${article._id}`} className="fh-card-media">
            {article.imageUrl ? <img src={assetUrl(article.imageUrl)} alt="" loading="lazy" /> : <span />}
            <span className="fh-card-badge">{article.category?.name}</span>
          </Link>
          <div className="fh-card-body">
            <h3>
              <Link to={`/stories/${article._id}`}>{article.title}</Link>
            </h3>
            <p>{article.description}</p>
            <div className="fh-card-meta">
              <span>
                <Clock3 size={12} /> {new Date(article.createdAt).toLocaleDateString()}
              </span>
              <Link to={`/stories/${article._id}`}>
                Read <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

export default LatestArticles;

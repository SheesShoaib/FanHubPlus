import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock3, Eye, History, UserRound } from "lucide-react";

import Loader from "../../components/common/Loader";
import RichText from "../../components/common/RichText";
import StarRating from "../../components/common/StarRating";
import BookmarkButton from "../../components/common/BookmarkButton";
import ShareButton from "../../components/common/ShareButton";
import api, { assetUrl } from "../../services/api";
import { useBreadcrumb } from "../../context/BreadcrumbContext";
import "../../styles/pages/article-details.css";

function readingTime(text) {
  const words = String(text || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function ArticleDetails() {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useBreadcrumb(story?.title);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/articles/${id}`)
      .then(setStory)
      .catch(() => setStory(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Loader label="Loading article..." fullPage />;
  }

  if (!story) {
    return (
      <div className="article-details-page">
        <div className="article-not-found">
          <h2>Story not found</h2>
          <p>This article doesn't exist or hasn't been published yet.</p>
          <Link to="/stories" className="article-back-link">
            <ArrowLeft size={16} />
            Back to Stories
          </Link>
        </div>
      </div>
    );
  }

  const bodyText = story.body || story.description || "No content added yet.";

  return (
    <div className="article-details-page">
      <article className="article-container">
        <Link to="/stories" className="article-back-link">
          <ArrowLeft size={16} />
          All Stories
        </Link>

        <motion.header
          className="article-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="article-category-badge accent-purple">{story.category?.name}</span>

          <h1>{story.title}</h1>

          {story.body && story.description && <p className="fh-article-lede">{story.description}</p>}

          <div className="article-meta">
            <span>
              <UserRound size={13} />
              {story.author || "FanHub+"}
            </span>
            <span>
              <Clock3 size={13} />
              {new Date(story.releaseDate || story.createdAt).toLocaleDateString()} · {readingTime(bodyText)} min read
            </span>
            <span>
              <Eye size={13} />
              {story.views} views
            </span>
          </div>
        </motion.header>

        {story.imageUrl && (
          <div className="article-hero-image">
            <img src={assetUrl(story.imageUrl)} alt={story.title} />
          </div>
        )}

        <div className="article-body">
          <RichText text={bodyText} />
        </div>

        {story.timeline?.length > 0 && (
          <section className="fh-timeline" aria-labelledby="timeline-heading">
            <h2 id="timeline-heading">
              <History size={18} /> Key moments
            </h2>
            <ol>
              {story.timeline.map((entry, index) => (
                <motion.li
                  key={`${entry.date}-${entry.title}`}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                >
                  <span className="fh-timeline-date">{entry.date}</span>
                  <strong>{entry.title}</strong>
                  {entry.description && <p>{entry.description}</p>}
                </motion.li>
              ))}
            </ol>
          </section>
        )}

        {story.tags?.length > 0 && (
          <div className="fh-tags">
            {story.tags.map((tag) => (
              <Link key={tag} to={`/explore?q=${encodeURIComponent(tag)}`}>
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <div className="fh-article-footer">
          <div>
            <h3>Rate this story</h3>
            <StarRating contentId={story._id} />
          </div>

          <div className="fh-action-row">
            <BookmarkButton itemType="Content" itemId={story._id} />
            <ShareButton title={story.title} text={story.description} />
          </div>
        </div>
      </article>
    </div>
  );
}

export default ArticleDetails;

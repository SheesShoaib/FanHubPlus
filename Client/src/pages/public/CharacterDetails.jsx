import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Brain, Flame } from "lucide-react";

import Loader from "../../components/common/Loader";
import BookmarkButton from "../../components/common/BookmarkButton";
import ShareButton from "../../components/common/ShareButton";
import api, { assetUrl } from "../../services/api";
import { useBreadcrumb } from "../../context/BreadcrumbContext";
import "../../styles/pages/character-details.css";

const STATS = [
  ["power", "Power", Flame],
  ["intelligence", "Intelligence", Brain],
  ["popularity", "Popularity", Zap],
];

function CharacterDetails() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  useBreadcrumb(character?.name);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/characters/${id}`)
      .then(setCharacter)
      .catch(() => setCharacter(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader label="Loading character..." fullPage />;

  if (!character) {
    return (
      <div className="character-details-page">
        <div className="character-not-found">
          <h2>Character not found</h2>
          <p>This character profile doesn't exist yet.</p>
          <Link to="/characters" className="character-back-link">
            <ArrowLeft size={16} />
            Back to Characters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="character-details-page">
      <section className="character-banner accent-purple">
        <Link to="/characters" className="character-back-link">
          <ArrowLeft size={16} />
          All Characters
        </Link>

        <div className="character-banner-grid">
          <motion.div
            className="character-portrait"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {character.imageUrl ? (
              <img src={assetUrl(character.imageUrl)} alt={character.name} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "var(--bg-soft)" }} />
            )}
          </motion.div>

          <motion.div
            className="character-banner-info"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="character-fandom-badge">
              {[character.category?.name, character.fandom].filter(Boolean).join(" · ")}
            </span>

            <h1>{character.name}</h1>
            {character.alias && <p className="character-alias">"{character.alias}"</p>}

            {character.role && <span className="character-role-badge">{character.role}</span>}

            {character.tags?.length > 0 && (
              <div className="character-tags">
                {character.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}

            <div className="character-actions">
              <BookmarkButton itemType="Character" itemId={character._id} className="char-action-btn" />
              <ShareButton title={character.name} className="char-action-btn" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="character-details-body">
        <div className="character-stats-card">
          <h3>Power Stats</h3>

          {STATS.map(([key, label, Icon]) => (
            <div className="char-stat-row" key={key}>
              <span>
                <Icon size={14} />
                {label}
              </span>
              <div className="char-stat-bar" role="meter" aria-valuenow={character[key]} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
                <div style={{ width: `${character[key]}%` }} />
              </div>
              <b>{character[key]}</b>
            </div>
          ))}
        </div>

        <div className="character-bio-card">
          <h3>Biography</h3>
          <p>{character.bio || "No biography added yet."}</p>
        </div>
      </section>

      {character.related?.length > 0 && (
        <section className="site-container fh-related">
          <h3>More from {character.fandom || character.category?.name}</h3>
          <div className="fh-card-grid four">
            {character.related.map((other) => (
              <Link key={other._id} to={`/characters/${other._id}`} className="fh-character-tile">
                {other.imageUrl ? <img src={assetUrl(other.imageUrl)} alt="" loading="lazy" /> : <span />}
                <div>
                  <small>{other.fandom}</small>
                  <strong>{other.name}</strong>
                  {other.alias && <em>"{other.alias}"</em>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default CharacterDetails;

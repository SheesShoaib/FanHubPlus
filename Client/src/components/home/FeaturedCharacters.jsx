import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import api, { assetUrl } from "../../services/api";
import Loader from "../common/Loader";

function FeaturedCharacters() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/characters?sort=popular")
      .then((data) => setCharacters(data.slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading characters..." />;
  if (!characters.length) return null;

  return (
    <div className="fh-card-grid four">
      {characters.map((character, index) => (
        <motion.div
          key={character._id}
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.06 }}
        >
          <Link to={`/characters/${character._id}`} className="fh-character-tile">
            {character.imageUrl ? <img src={assetUrl(character.imageUrl)} alt="" loading="lazy" /> : <span />}
            <div>
              <small>{character.fandom || character.category?.name}</small>
              <strong>{character.name}</strong>
              {character.alias && <em>"{character.alias}"</em>}
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

export default FeaturedCharacters;

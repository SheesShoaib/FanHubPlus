import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, UserRound } from "lucide-react";

import SectionTitle from "../../components/common/SectionTitle";
import SearchBar from "../../components/common/SearchBar";
import Loader from "../../components/common/Loader";
import BookmarkButton from "../../components/common/BookmarkButton";
import api, { assetUrl, toQuery } from "../../services/api";
import useSavedIds from "../../hooks/useSavedIds";
import "../../styles/pages/characters.css";

function Characters() {
  const [characters, setCharacters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fandoms, setFandoms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [fandom, setFandom] = useState("all");
  const [sort, setSort] = useState("popular");
  const isSaved = useSavedIds("Character");

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/characters/fandoms")])
      .then(([cats, fans]) => {
        setCategories(cats);
        setFandoms(fans);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get(`/characters${toQuery({ search, category, fandom, sort })}`)
        .then(setCharacters)
        .catch(() => setCharacters([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, category, fandom, sort]);

  return (
    <div className="characters-page">
      <section className="characters-hero">
        <SectionTitle
          eyebrow="Character Hub"
          title="Meet the icons of every fandom"
          subtitle="Filter character cards by category and fandom, or search by name, alias or role."
        />

        <div className="characters-search-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search characters..." />
        </div>

        <div className="fh-chip-row" role="group" aria-label="Filter by category">
          <button type="button" className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>
            All
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              className={category === c.slug ? "active" : ""}
              onClick={() => setCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="fh-filter-bar center">
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
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="popular">Most popular</option>
              <option value="power">Most powerful</option>
              <option value="alpha">A-Z</option>
              <option value="latest">Newest</option>
            </select>
          </label>
        </div>
      </section>

      <section className="site-container fh-page-section">
        {loading ? (
          <Loader label="Loading characters..." />
        ) : characters.length === 0 ? (
          <div className="fh-empty">
            <UserRound size={30} />
            <p>No characters match those filters.</p>
          </div>
        ) : (
          <div className="fh-card-grid profiles">
            {characters.map((character, index) => (
              <motion.article
                key={character._id}
                className="fh-profile-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
              >
                <Link to={`/characters/${character._id}`} className="fh-profile-media">
                  {character.imageUrl ? (
                    <img src={assetUrl(character.imageUrl)} alt={character.name} loading="lazy" />
                  ) : (
                    <span className="fh-img-fallback">
                      <UserRound size={34} />
                    </span>
                  )}
                </Link>

                <BookmarkButton
                  itemType="Character"
                  itemId={character._id}
                  className="fh-card-bookmark"
                  showLabel={false}
                  initialSaved={isSaved(character._id)}
                />

                <div className="fh-profile-body">
                  <span className="fh-eyebrow">
                    {character.category?.name}
                    {character.fandom ? ` · ${character.fandom}` : ""}
                  </span>

                  <h3>{character.name}</h3>

                  {character.alias && <p className="fh-muted">"{character.alias}"</p>}

                  <div className="fh-mini-stats" aria-label="Popularity">
                    <span style={{ width: `${character.popularity}%` }} />
                  </div>

                  <Link to={`/characters/${character._id}`} className="fh-text-link">
                    View full profile
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Characters;

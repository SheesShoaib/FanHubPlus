import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  WandSparkles,
  Gamepad2,
  BookOpen,
  Clapperboard,
  Tv,
  Headphones,
  Layers,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import SectionTitle from "../../components/common/SectionTitle";
import Loader from "../../components/common/Loader";
import api from "../../services/api";
import "../../styles/pages/categories.css";

const iconMap = {
  anime: WandSparkles,
  gaming: Gamepad2,
  manga: BookOpen,
  movies: Clapperboard,
  "tv-shows": Tv,
  kpop: Headphones,
  "k-pop": Headphones,
  comics: Layers,
  cosplay: Users,
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.get("/categories");
        setCategories(data.filter((category) => category.status !== "inactive"));
      } catch (err) {
        console.error("Failed to load categories:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="categories-page">
      <section className="categories-hero">
        <SectionTitle
          eyebrow="Browse by fandom"
          title="Every category, one page"
          subtitle="Pick a world and dive straight into its stories, characters, media, and merch."
        />
      </section>

      {loading ? (
        <Loader label="Loading categories..." />
      ) : categories.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
          No categories yet - check back soon.
        </p>
      ) : (
        <section className="categories-grid">
          {categories.map((category, index) => {
            const Icon = iconMap[category.slug] || Sparkles;
            return (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
              >
                <Link
                  to={`/category/${category.slug}`}
                  className={`category-card accent-${category.accent || "purple"}`}
                >
                  <div className="category-card-icon">
                    <Icon size={26} />
                  </div>

                  <h3>{category.name}</h3>
                  <p>{category.description}</p>

                  <span className="category-card-cta">
                    Browse
                    <ArrowRight size={15} />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default Categories;
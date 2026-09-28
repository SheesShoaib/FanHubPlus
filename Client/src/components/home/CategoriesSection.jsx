import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Clapperboard,
  Gamepad2,
  Headphones,
  Layers,
  Sparkles,
  Tv,
  Users,
  WandSparkles,
} from "lucide-react";

import api from "../../services/api";

export const CATEGORY_ICONS = {
  anime: WandSparkles,
  gaming: Gamepad2,
  manga: BookOpen,
  movies: Clapperboard,
  "tv-shows": Tv,
  kpop: Headphones,
  comics: Layers,
  cosplay: Users,
};

const CARD_CLASSES = ["", "fandom-blue", "fandom-pink", "fandom-orange", "fandom-cyan", "fandom-green"];

function CategoriesSection() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .get("/categories")
      .then((data) => setCategories(data.filter((c) => c.status !== "inactive")))
      .catch(() => {});
  }, []);

  return (
    <div className="fandom-grid">
      {categories.map((category, index) => {
        const Icon = CATEGORY_ICONS[category.slug] || Sparkles;

        return (
          <Link key={category._id} to={`/category/${category.slug}`} className="card-link-wrap">
            <motion.article
              className={`fandom-card ${CARD_CLASSES[index % CARD_CLASSES.length]}`}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.05 }}
            >
              <div className="fandom-card-glow" />

              <div className="fandom-icon">
                <Icon size={23} />
              </div>

              <div>
                <h3>{category.name}</h3>
                <p>
                  {category.contentCount > 0
                    ? `${category.contentCount} stories & media`
                    : category.description?.split(/[.:]/)[0]}
                </p>
              </div>

              <ArrowUpRight className="card-arrow" size={15} />
            </motion.article>
          </Link>
        );
      })}
    </div>
  );
}

export default CategoriesSection;

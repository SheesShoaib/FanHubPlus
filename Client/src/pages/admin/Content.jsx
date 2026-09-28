import { Link } from "react-router-dom";
import {
  FileText,
  Tags,
  UserRound,
  Video,
  ArrowRight,
  FolderOpen,
  ShoppingBag,
  Rocket,
  CalendarDays,
  Bot,
} from "lucide-react";

import "../../styles/admin/content.css";



const contentLinks = [
  {
    to: "/admin/articles",
    label: "Articles",
    icon: FileText,
    desc: "Featured articles, theories, lore, and news.",
    color: "blue",
  },
  {
    to: "/admin/categories",
    label: "Categories",
    icon: Tags,
    desc: "The 8 fandom categories and their descriptions.",
    color: "purple",
  },
  {
    to: "/admin/characters",
    label: "Characters",
    icon: UserRound,
    desc: "Character profiles across every fandom.",
    color: "green",
  },
  {
    to: "/admin/multimedia",
    label: "Multimedia",
    icon: Video,
    desc: "Videos, trailers, and audio clips.",
    color: "orange",
  },
  {
    to: "/admin/merchandise",
    label: "Merchandise",
    icon: ShoppingBag,
    desc: "Showcase items, tags and upcoming drops.",
    color: "blue",
  },
  {
    to: "/admin/releases",
    label: "Upcoming Releases",
    icon: Rocket,
    desc: "Anticipated anime, games, movies and more.",
    color: "purple",
  },
  {
    to: "/admin/events",
    label: "Events",
    icon: CalendarDays,
    desc: "Conventions, meetups and screenings with map locations.",
    color: "green",
  },
  {
    to: "/admin/ai",
    label: "Chatbot Knowledge Base",
    icon: Bot,
    desc: "FAQ answers the assistant uses.",
    color: "orange",
  },
];

function Content() {
  return (
    <div className="content-hub-page">
      <div className="manager-page-top">
        <div>
          <p className="manager-label">content management</p>
          <h1>Content Hub</h1>
          <p className="manager-subtitle">
            Jump into any content type to add, edit, or remove entries.
          </p>
        </div>
      </div>

      <div className="content-hub-grid">
        {contentLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className={`content-hub-card ${item.color}`}>
              <div className="content-hub-icon">
                <Icon size={22} />
              </div>

              <h3>{item.label}</h3>
              <p>{item.desc}</p>

              <span>
                Manage
                <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="content-hub-note">
        <FolderOpen size={16} />
        <p>
          Fan-submitted content lives under <Link to="/admin/submissions">Submissions</Link> and
          requires approval before it appears here.
        </p>
      </div>
    </div>
  );
}

export default Content;
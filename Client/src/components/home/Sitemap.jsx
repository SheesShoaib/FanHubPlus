import { Link } from "react-router-dom";
import { Compass, Library, Lock, LifeBuoy, ShieldCheck } from "lucide-react";

const CATEGORY_LINKS = [
  ["Anime", "anime"],
  ["Gaming", "gaming"],
  ["Movies", "movies"],
  ["TV Shows", "tv-shows"],
  ["K-Pop", "kpop"],
  ["Comics", "comics"],
  ["Manga", "manga"],
  ["Cosplay", "cosplay"],
];

export const SITEMAP = [
  {
    title: "Discover",
    icon: Compass,
    links: [
      { label: "Home", to: "/" },
      { label: "Explore (search & filters)", to: "/explore" },
      { label: "All categories", to: "/categories" },
      ...CATEGORY_LINKS.map(([label, slug]) => ({ label, to: `/category/${slug}`, nested: true })),
    ],
  },
  {
    title: "Content",
    icon: Library,
    links: [
      { label: "Stories & featured articles", to: "/stories" },
      { label: "Character profiles", to: "/characters" },
      { label: "Multimedia center", to: "/multimedia" },
      { label: "Events map & calendar", to: "/events" },
      { label: "Merchandise showcase", to: "/shop" },
      { label: "Upcoming releases", to: "/shop#releases" },
    ],
  },
  {
    title: "My account",
    icon: Lock,
    links: [
      { label: "Log in", to: "/login" },
      { label: "Register", to: "/register" },
      { label: "Forgot password", to: "/forgot-password" },
      { label: "Dashboard", to: "/dashboard", auth: true },
      { label: "Profile & preferences", to: "/dashboard/profile", auth: true, nested: true },
      { label: "Bookmarks", to: "/dashboard/bookmarks", auth: true, nested: true },
      { label: "Notes", to: "/dashboard/notes", auth: true, nested: true },
      { label: "Fan submissions", to: "/dashboard/submissions", auth: true, nested: true },
      { label: "Chat history", to: "/dashboard/chat-history", auth: true, nested: true },
    ],
  },
  {
    title: "Help",
    icon: LifeBuoy,
    links: [
      { label: "About FanHub+", to: "/about" },
      { label: "Contact & feedback", to: "/contact" },
      { label: "Full sitemap", to: "/sitemap" },
    ],
  },
  {
    title: "Administration",
    icon: ShieldCheck,
    links: [
      { label: "Admin dashboard", to: "/admin", admin: true },
      { label: "Analytics", to: "/admin/analytics", admin: true, nested: true },
      { label: "Users", to: "/admin/users", admin: true, nested: true },
      { label: "Content hub", to: "/admin/content", admin: true, nested: true },
      { label: "Chatbot knowledge base", to: "/admin/ai", admin: true, nested: true },
      { label: "Settings", to: "/admin/settings", admin: true, nested: true },
    ],
  },
];

function Sitemap({ compact = false }) {
  return (
    <div className={compact ? "fh-sitemap compact" : "fh-sitemap"}>
      {SITEMAP.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.title} className="fh-sitemap-group">
            <h3>
              <Icon size={16} />
              {group.title}
            </h3>
            <ul>
              {group.links.map((link) => (
                <li key={link.to + link.label} className={link.nested ? "nested" : ""}>
                  <Link to={link.to}>{link.label}</Link>
                  {link.auth && <small>members</small>}
                  {link.admin && <small>admins</small>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default Sitemap;

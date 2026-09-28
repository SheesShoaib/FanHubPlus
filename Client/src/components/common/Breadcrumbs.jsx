import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

import { useBreadcrumbLabel } from "../../context/BreadcrumbContext";

const LABELS = {
  explore: "Explore",
  characters: "Characters",
  stories: "Stories",
  events: "Events",
  shop: "Merchandise",
  multimedia: "Multimedia",
  categories: "Categories",
  category: "Categories",
  about: "About",
  contact: "Contact",
  sitemap: "Sitemap",
  dashboard: "Dashboard",
  profile: "Profile",
  bookmarks: "Bookmarks",
  notes: "Notes",
  submissions: "Submissions",
  "chat-history": "Chat History",
};

const LINK_OVERRIDES = { "/category": "/categories" };

const HIDDEN_ON = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

function prettify(segment) {
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const pageLabel = useBreadcrumbLabel();

  if (HIDDEN_ON.includes(pathname)) return null;

  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    const looksLikeId = /^[a-f0-9]{24}$/i.test(segment);

    let label = LABELS[segment] || (looksLikeId ? "Details" : prettify(segment));
    if (isLast && pageLabel) label = pageLabel;

    return { path: LINK_OVERRIDES[path] || path, label, isLast };
  });

  return (
    <nav className="fh-breadcrumbs site-container" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/">
            <Home size={13} />
            <span>Home</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path + crumb.label}>
            <ChevronRight size={13} aria-hidden="true" />
            {crumb.isLast ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.path}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;

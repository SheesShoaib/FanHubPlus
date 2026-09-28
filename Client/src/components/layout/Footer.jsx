import { Link } from "react-router-dom";
import {
  Instagram,
  Youtube,
  Github,
  ArrowUpRight,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import "../../styles/components/footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <footer className="site-footer">

      <div className="footer-inner">

        

        <div className="footer-brand">

          <Link
            to="/"
            className="footer-logo"
            aria-label="Fan Hub Plus Home"
          >

            <div className="footer-logo-mark">

              <span className="footer-logo-f">
                F
              </span>

              <span className="footer-logo-divider"></span>

              <span className="footer-logo-h">
                H
              </span>

            </div>

            <div className="footer-logo-name">

              <strong>
                FAN HUB
              </strong>

              <span>
                PLUS
              </span>

            </div>

          </Link>

          <p className="footer-description">
            One universe for every fandom. Explore
            characters, stories, events, multimedia,
            merchandise and more.
          </p>

        </div>

        

        <div className="footer-column">

          <h3>
            Discover
          </h3>

          <Link to="/">
            Home
          </Link>

          <Link to="/explore">
            Explore
          </Link>

          <Link to="/characters">
            Characters
          </Link>

          <Link to="/stories">
            Stories
          </Link>

          <Link to="/events">
            Events
          </Link>

          <Link to="/multimedia">
            Multimedia
          </Link>

          <Link to="/shop">
            Shop
          </Link>

          <Link to="/categories">
            Categories
          </Link>

        </div>

        

        <div className="footer-column">

          <h3>
            Community
          </h3>

          {isAuthenticated ? (
            <Link to={isAdmin ? "/admin" : "/dashboard"}>
              My Account
            </Link>
          ) : (
            <>
              <Link to="/register">
                Create Account
              </Link>

              <Link to="/login">
                Sign In
              </Link>
            </>
          )}

          <Link to="/dashboard/submissions">
            Share Your Story
          </Link>

          <Link to="/contact">
            Feedback
          </Link>

          <Link to="/about">
            About
          </Link>

          <Link to="/sitemap">
          Sitemap</Link>

        </div>

        

        <div className="footer-column footer-social-column">

          <h3>
            Follow Us
          </h3>

          <div className="footer-socials">

            <a
              href="#"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>

            <a
              href="#"
              aria-label="YouTube"
            >
              <Youtube size={18} />
            </a>

            <a
              href="#"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>

          </div>

        </div>

      </div>

      

      <div className="footer-bottom">

        <div className="footer-bottom-inner">

          <span>
            © {currentYear} Fan Hub Plus. All rights reserved.
          </span>

          <div className="footer-bottom-links">

            <Link to="/sitemap">
              Sitemap
            </Link>

            <Link to="/contact">
              Contact
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}

export default Footer;
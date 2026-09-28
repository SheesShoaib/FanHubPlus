import { Link } from "react-router-dom";
import "../../styles/components/fanhub-logo.css";

function FanHubLogo({
  to = "/",
  variant = "full",
  onClick,
}) {
  return (
    <Link
      to={to}
      className={`fanhub-logo fanhub-logo-${variant}`}
      onClick={onClick}
      aria-label="Fan Hub Plus"
    >
      <span className="fanhub-logo-mark">
        <span className="fanhub-logo-f">F</span>
        <span className="fanhub-logo-divider"></span>
        <span className="fanhub-logo-h">H</span>
      </span>

      {variant === "full" && (
        <span className="fanhub-logo-wordmark">
          <strong>FAN HUB</strong>
          <small>PLUS</small>
        </span>
      )}
    </Link>
  );
}

export default FanHubLogo;
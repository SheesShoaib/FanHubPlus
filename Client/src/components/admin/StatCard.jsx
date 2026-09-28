import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";



function StatCard({
  icon: Icon,
  color = "purple",
  label,
  value,
  trendValue,
  trendLabel,
  trendDirection = "up",
  onMoreClick,
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-head">
        <div className={`stat-icon ${color}`}>
          <Icon size={20} />
        </div>

        <button
          type="button"
          className="stat-card-more"
          onClick={onMoreClick}
          aria-label="More options"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <p>{label}</p>

      <h2>{value}</h2>

      {(trendValue || trendLabel) && (
        <div className="stat-bottom">
          <span className={trendDirection === "down" ? "down" : ""}>
            {trendDirection === "down" ? (
              <ArrowDownRight size={13} />
            ) : (
              <ArrowUpRight size={13} />
            )}
            {trendValue}
          </span>

          {trendLabel && <small>{trendLabel}</small>}
        </div>
      )}
    </div>
  );
}

export default StatCard;
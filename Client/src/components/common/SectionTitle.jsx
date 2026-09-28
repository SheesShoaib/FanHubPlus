import "../../styles/global/components/common.css";

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "center",
}) {
  return (
    <div className={`common-section-title common-section-title-${align}`}>
      {eyebrow && (
        <span className="common-section-title-eyebrow">{eyebrow}</span>
      )}

      <h2 className="common-section-title-heading">{title}</h2>

      {subtitle && (
        <p className="common-section-title-subtitle">{subtitle}</p>
      )}
    </div>
  );
}

export default SectionTitle;

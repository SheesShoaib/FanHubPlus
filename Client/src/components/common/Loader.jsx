import "../../styles/global/components/common.css";



function Loader({ label = "Loading...", fullPage = false }) {
  return (
    <div className={fullPage ? "loader-wrap loader-fullpage" : "loader-wrap"}>
      <span className="loader-spinner" />
      {label && <p className="loader-label">{label}</p>}
    </div>
  );
}

export default Loader;
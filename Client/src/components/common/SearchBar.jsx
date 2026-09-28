import { Search, X } from "lucide-react";

import "../../styles/global/components/common.css";



function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}) {
  return (
    <div className="common-search-bar">
      <Search size={18} />

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />

      {value && (
        <button
          type="button"
          className="common-search-clear"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
import React from "react";
import "../styles/SetSearchBar.css";

export default function SetSearchBar({
  value,
  onChange,
  searchDescription,
  onToggleDescription
}) {
  return (
    <div className="set-searchbar-container">
      <div className="set-searchbar">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search your sets..."
          className="set-searchbar-input"
        />
      </div>

      <label className="set-searchbar-checkbox">
        <input
          type="checkbox"
          checked={searchDescription}
          onChange={(e) => onToggleDescription(e.target.checked)}
        />
        Search descriptions
      </label>
    </div>
  );
}

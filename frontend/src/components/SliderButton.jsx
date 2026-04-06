import React, {useState} from 'react'
import "../styles/SliderButton.css"

function SliderButton({initial, toggleListener, disabled}) {
  const [isActive, setIsActive] = useState(initial || false);

  return (
    <div className={`slider-button-comp-container ${isActive ? "active" : ""} ${disabled ? "disabled" : "clickable"}`} onClick={() => {
        if (!disabled) {
            setIsActive(!isActive);
            toggleListener(!isActive);
        }
    }}>
        <div className="slider-button-comp-toggle">

        </div>
    </div>
  )
}

export default SliderButton
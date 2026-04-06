import React from 'react'
import '../styles/TermImage.css'

function TermImage({card}) {
  return (
    <div className="term-image-container">
        <img src={`http://localhost:5000/images/${card.image_filename}`} alt={card.term} className="term-image" />
    </div>
  )
}

export default TermImage
import { useState } from 'react';
import '../styles/SpeechButton.css';

function SpeechButton({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);

  function handleClick() {
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechSynthesis.speak(utterance);
  }

  return (
    <span
      className={`speech-btn ${isPlaying ? 'playing' : ''}`}
      onClick={handleClick}
    >
      🔉
    </span>
  );
}

export default SpeechButton;

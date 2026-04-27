import { Link } from 'react-router-dom';
import '../styles/BackButton.css'

function BackButton({ text, to }) {
  return (
    <div className='back-btn'>
      <Link to={to}>{`← ${text}`}</Link>
    </div>
  );
}

export default BackButton;

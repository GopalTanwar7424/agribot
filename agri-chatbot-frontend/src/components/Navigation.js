import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut } from 'lucide-react';
import './Navigation.css';

const Navigation = ({ onLoginClick, onLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const scrollToSection = (sectionId) => {
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <nav className="top-nav">
      <div className="nav-logo">AGRIBOT</div>
      <div className="nav-links">
        <button onClick={() => navigate('/')}>HOME</button>
        <button onClick={() => scrollToSection('features')}>FEATURES</button>
        <Link to="/about" style={{ textDecoration: 'none' }}>
          <button>WHO WE ARE</button>
        </Link>
        <button onClick={() => {
            window.location.href = '/contact';
            }}>
            CONTACT US
            </button>
        
        {user ? (
          <div className="user-menu">
            <span className="username">👤 {user.email?.split('@')[0]}</span>
            <button onClick={onLogout} className="logout-btn-icon">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button onClick={onLoginClick} className="login-btn">Login / Sign Up</button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
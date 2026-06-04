import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut, Menu, X } from 'lucide-react';
import './Navigation.css';

const Navigation = ({ onLoginClick, onLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const scrollToSection = (sectionId) => {
    setMenuOpen(false);
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

      {/* Hamburger button - only shows on mobile */}
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <button onClick={() => { navigate('/'); setMenuOpen(false); }}>HOME</button>
        <button onClick={() => scrollToSection('features')}>FEATURES</button>
        <Link to="/about" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
          <button>WHO WE ARE</button>
        </Link>
        <button onClick={() => { window.location.href = '/contact'; setMenuOpen(false); }}>
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
          <button onClick={() => { onLoginClick(); setMenuOpen(false); }} className="login-btn">
            Login / Sign Up
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
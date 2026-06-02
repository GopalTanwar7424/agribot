import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Navigation from '../components/Navigation';
import './AboutUs.css';

const AboutUs = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="aboutus-page">
      {/* Use shared navigation */}
      <Navigation 
        onLoginClick={() => navigate('/')} 
        onLogout={handleLogout} 
      />

      {/* Header Section with Background */}
      <section 
        className="aboutus-header"
        style={{ backgroundImage: 'url(/who-we-are-header.png)' }}
      >
        <h1 className="aboutus-header-title">Who We Are</h1>
      </section>

      {/* Main Content Section */}
      <section className="aboutus-content-section">
        <div className="aboutus-grid">
          {/* Left: Text Content */}
          <div className="aboutus-text-content">
            <p className="aboutus-paragraph">
              <strong>AgriBot is an AI-powered agricultural assistant designed specifically for Indian farmers. 
              We use cutting-edge artificial intelligence to provide 24/7 expert farming advice in 
              English, Hindi, and Marathi. Our mission is to empower farmers with instant access to 
              crop disease diagnosis, weather-based recommendations, soil health analysis, and 
              personalized farming guidance - all through simple voice, text, or image inputs.</strong>
            </p>
            <p className="aboutus-paragraph">
              <strong>Founded with the vision of bridging the technology gap in agriculture, AgriBot combines 
              traditional farming wisdom with modern AI to help farmers increase productivity, reduce 
              crop losses, and make data-driven decisions. Whether you're dealing with a pest problem, 
              planning your planting schedule, or need fertilizer recommendations, AgriBot is your 
              trusted farming companion.</strong>
            </p>
          </div>

          {/* Right: Image with Top-Right Curved Border */}
          <div className="aboutus-image-container">
            <div className="curved-image-wrapper-topright">
              <img src="/group-of-farmers.jpg" alt="Farmers using AgriBot" className="aboutus-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section - Farmer Image + Mission */}
      <section className="aboutus-bottom-section">
        <div className="bottom-grid">
          {/* Left: Farmer Image with Bottom-Left Curved Border */}
          <div className="farmer-image-container">
            <div className="curved-image-wrapper-bottomleft">
              <img src="/farmer-field.jpeg" alt="Farmer in field" className="farmer-image" />
            </div>
          </div>

          {/* Right: Mission Box */}
          <div className="mission-box-container">
            <div 
              className="mission-box"
              style={{ backgroundImage: 'url(/Our%20Mission.png)' }}
            >
              <h2 className="mission-title">Our Mission</h2>
              <p className="mission-text">
                <strong>To co-create a world where farmers use technology and data to build prosperous communities.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
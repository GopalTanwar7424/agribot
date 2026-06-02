import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Camera, Mic, Cloud, Calendar, FileText, X } from 'lucide-react';
import Navigation from './Navigation';
import Weather from './Weather';
import CropCalendar from './CropCalendar';
import SoilHealthReport from './SoilHealthReport';
import './LanguageSelector.css';

const LanguageSelector = ({ 
  onLanguageSelect, 
  user, 
  onLoginClick, 
  onLogout,
  crops,
  setCrops,
  soilReports,
  setSoilReports
}) => {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showCropCalendar, setShowCropCalendar] = useState(false);
  const [showSoilReport, setShowSoilReport] = useState(false);

  const languages = [
    { code: 'english', name: 'English', flag: '🇬🇧' },      // Changed from 'en'
    { code: 'hindi', name: 'हिंदी', flag: '🇮🇳' },         // Changed from 'hi'
    { code: 'marathi', name: 'मराठी', flag: '🇮🇳' }       // Changed from 'mr'
  ];

  const features = [
    {
      icon: <MessageSquare size={40} />,
      title: 'AI Chat Assistant',
      description: '24/7 expert advice in English, Hindi, and Marathi',
      color: '#8b5cf6'
    },
    {
      icon: <Camera size={40} />,
      title: 'Image Analysis',
      description: 'Detect crop diseases instantly by uploading photos',
      color: '#ef4444'
    },
    {
      icon: <Mic size={40} />,
      title: 'Voice Support',
      description: 'Ask questions using your voice in your language',
      color: '#ec4899'
    },
    {
      icon: <Cloud size={40} />,
      title: 'Weather Integration',
      description: 'Get real-time weather updates and farming tips',
      color: '#3b82f6'
    },
    {
      icon: <Calendar size={40} />,
      title: 'Crop Calendar',
      description: 'Track planting schedules and get timely reminders',
      color: '#10b981'
    },
    {
      icon: <FileText size={40} />,
      title: 'Soil Health Report',
      description: 'Analyze soil nutrients and get fertilizer recommendations',
      color: '#f59e0b'
    }
  ];

  const handleFeatureClick = (index) => {
    if (index === 0) {
      // AI Chat Assistant - redirect to chat
      if (!user) {
        onLoginClick();
      } else {
        setShowLanguageModal(true);
      }
    } else if (index === 1) {
      // Image Analysis - open chat with image upload ready
      if (!user) {
        onLoginClick();
      } else {
        localStorage.setItem('openImageUpload', 'true');
        setShowLanguageModal(true);
      }
    } else if (index === 2) {
      // Voice Support - open chat with voice recording ready
      if (!user) {
        onLoginClick();
      } else {
        localStorage.setItem('startVoiceRecording', 'true');
        setShowLanguageModal(true);
      }
    } else if (index === 3) {
      // Weather Integration
      setShowWeather(true);
    } else if (index === 4) {
      // Crop Calendar
      setShowCropCalendar(true);
    } else if (index === 5) {
      // Soil Health Report
      setShowSoilReport(true);
    }
  };

  return (
    <div className="language-selector-new">
      {/* Shared Navigation */}
      <Navigation onLoginClick={onLoginClick} onLogout={onLogout} />

      {/* Hero Section */}
      <section className="hero-section-new" id="home">
        <div className="hero-content-new">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="hero-subtitle-new">HELLO & WELCOME</p>
            <h1 className="hero-title-new">AGRIBOT</h1>
            <p className="hero-description-new">Your AI-Powered Agriculture Assistant</p>
            <motion.button
              className="cta-button-new"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => user ? setShowLanguageModal(true) : onLoginClick()}
            >
              START CHATTING →
            </motion.button>
          </motion.div>
        </div>
        <div className="hero-image-new">
          <motion.img
            src="/robot.png"
            alt="AgriBot"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section-new">
        <div className="stats-grid-new">
          <motion.div
            className="stat-card-new"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3>3</h3>
            <p>Languages Supported</p>
          </motion.div>
          <motion.div
            className="stat-card-new"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3>6</h3>
            <p>Smart Features</p>
          </motion.div>
          <motion.div
            className="stat-card-new"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3>24/7</h3>
            <p>AI Availability</p>
          </motion.div>
          <motion.div
            className="stat-card-new"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <h3>100%</h3>
            <p>Free to Use</p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section-new" id="features">
        <motion.h2
          className="section-title-new"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Powerful Features for Modern Farming
        </motion.h2>
        <div className="features-grid-new">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card-new"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
              onClick={() => handleFeatureClick(index)}
              style={{ cursor: 'pointer' }}
            >
              <div className="feature-icon-new" style={{ 
                background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}40)`,
                color: feature.color 
              }}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-new">
        <motion.h2
          className="section-title-new"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>
        <div className="steps-grid-new">
          <motion.div
            className="step-card-new"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="step-number-new">1</div>
            <h3>Choose Your Language</h3>
            <p>Select from English, Hindi, or Marathi</p>
          </motion.div>
          <motion.div
            className="step-card-new"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="step-number-new">2</div>
            <h3>Ask Your Question</h3>
            <p>Type, speak, or upload an image</p>
          </motion.div>
          <motion.div
            className="step-card-new"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="step-number-new">3</div>
            <h3>Get Expert Advice</h3>
            <p>Receive instant AI-powered recommendations</p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section-new" id="contact">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="cta-content-new"
        >
          <h2>Ready to Transform Your Farming?</h2>
          <p>Join thousands of farmers using AI to increase productivity</p>
          <motion.button
            className="cta-button-large-new"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => user ? setShowLanguageModal(true) : onLoginClick()}
          >
            Get Started Now →
          </motion.button>
        </motion.div>
      </section>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="modal-overlay-new">
          <motion.div
            className="modal-content-new"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button className="modal-close-new" onClick={() => setShowLanguageModal(false)}>
              <X size={24} />
            </button>
            <h2>Select Your Language</h2>
            <p>Choose your preferred language to continue</p>
            <div className="language-options-new">
              {languages.map((lang) => (
                <motion.button
                  key={lang.code}
                  className="language-option-new"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onLanguageSelect(lang.code);
                    setShowLanguageModal(false);
                  }}
                >
                  <span className="language-flag-new">{lang.flag}</span>
                  <span className="language-name-new">{lang.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Weather Modal */}
      {showWeather && (
        <Weather onClose={() => setShowWeather(false)} />
      )}

      {/* Crop Calendar Modal */}
      {showCropCalendar && (
        <CropCalendar 
          onClose={() => setShowCropCalendar(false)}
          crops={crops}
          setCrops={setCrops}
        />
      )}

      {/* Soil Health Report Modal */}
      {showSoilReport && (
        <SoilHealthReport 
          onClose={() => setShowSoilReport(false)}
          soilReports={soilReports}
          setSoilReports={setSoilReports}
        />
      )}
    </div>
  );
};

export default LanguageSelector;
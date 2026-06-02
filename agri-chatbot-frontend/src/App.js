import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import LanguageSelector from './components/LanguageSelector';
import ChatInterface from './components/ChatInterface';
import AboutUs from './pages/AboutUs';

import { selectLanguage } from './utils/api';
import './App.css';
import Contact from './pages/Contact';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [language, setLanguage] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(false);

  // Add states for crops and soil reports
  const [crops, setCrops] = useState([]);
  const [soilReports, setSoilReports] = useState([]);

  // Load data from localStorage on app start
  useEffect(() => {
    const savedCrops = localStorage.getItem('agribot_crops');
    const savedReports = localStorage.getItem('agribot_soil_reports');
    
    if (savedCrops) {
      try {
        setCrops(JSON.parse(savedCrops));
      } catch (error) {
        console.error('Error loading crops:', error);
      }
    }
    
    if (savedReports) {
      try {
        setSoilReports(JSON.parse(savedReports));
      } catch (error) {
        console.error('Error loading soil reports:', error);
      }
    }
  }, []);

  // Save crops whenever they change
  useEffect(() => {
    localStorage.setItem('agribot_crops', JSON.stringify(crops));
  }, [crops]);

  // Save soil reports whenever they change
  useEffect(() => {
    localStorage.setItem('agribot_soil_reports', JSON.stringify(soilReports));
  }, [soilReports]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLanguageSelect = async (selectedLang) => {
    if (!user) {
      setShowAuth(true);
      localStorage.setItem('pendingLanguage', selectedLang);
      return;
    }

    setLoading(true);
    try {
      const response = await selectLanguage(selectedLang);
      setSessionId(response.session_id);
      setLanguage(selectedLang);
      setGreeting(response.greeting);
    } catch (error) {
      console.error('Error selecting language:', error);
      alert('Failed to connect to AgriBot. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    const pendingLang = localStorage.getItem('pendingLanguage');
    if (pendingLang) {
      localStorage.removeItem('pendingLanguage');
      handleLanguageSelect(pendingLang);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setSessionId(null);
    setLanguage(null);
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading AgriBot...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Starting AgriBot...</p>
      </div>
    );
  }

  if (showAuth) {
    return <Auth onAuthSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />;
  }

  if (sessionId) {
    return (
      <ChatInterface
        sessionId={sessionId}
        language={language}
        greeting={greeting}
        onRestart={() => {
          setSessionId(null);
          setLanguage(null);
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <LanguageSelector 
              onLanguageSelect={handleLanguageSelect}
              user={user}
              onLoginClick={() => setShowAuth(true)}
              onLogout={handleLogout}
              crops={crops}
              setCrops={setCrops}
              soilReports={soilReports}
              setSoilReports={setSoilReports}
            />
          } 
        />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}


export default App;
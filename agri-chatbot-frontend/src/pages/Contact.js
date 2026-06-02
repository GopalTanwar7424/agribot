import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Navigation from '../components/Navigation';
import emailjs from '@emailjs/browser';
import './Contact.css';

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Using EmailJS to send email
      const result = await emailjs.send(
        'service_7bm4o5k',  // Replace with your EmailJS service ID
        'template_7qodxe8', // Replace with your EmailJS template ID
        {
          from_name: formData.name,     // Matches {{from_name}}
          from_email: formData.email,   // Matches {{from_email}}
          name: formData.name,          // Matches {{name}} in template
          message: formData.message     // Matches {{message}}
        },
        'LKCt3QiOplg1-mngK' // Replace with your EmailJS public key
      );

      if (result.text === 'OK') {
        setStatus({
          type: 'success',
          message: 'Message sent successfully! We will get back to you soon.'
        });
        setFormData({ name: '', email: '', message: '' });
      }
    } catch (error) {
      console.error('Email error:', error);
      setStatus({
        type: 'error',
        message: 'Failed to send message. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Navigation */}
      <Navigation 
        onLoginClick={() => navigate('/')} 
        onLogout={handleLogout} 
      />

      {/* Header Section with Same Background as About Us */}
      <section 
        className="contact-header"
        style={{ backgroundImage: 'url(/who-we-are-header.png)' }}
      >
        <h1 className="contact-header-title">Contact</h1>
      </section>

      {/* Contact Form Section */}
      <section className="contact-content-section">
        <div className="contact-grid">
          {/* Left: Contact Information */}
          <div className="contact-info">
            <h2 className="contact-info-title">Get In Touch</h2>
            <p className="contact-info-text">
              Have questions about AgriBot? Need help with your farming challenges? 
              We're here to assist you. Fill out the form and we'll get back to you as soon as possible.
            </p>
            
            <div className="contact-details">
              <div className="contact-detail-item">
                <div className="contact-icon">📧</div>
                <div>
                  <h3>Email</h3>
                  <p>gt124176@gmail.com</p>
                </div>
              </div>
              
              <div className="contact-detail-item">
                <div className="contact-icon">🌾</div>
                <div>
                  <h3>Support</h3>
                  <p>24/7 AI-Powered Assistance</p>
                </div>
              </div>
              
              <div className="contact-detail-item">
                <div className="contact-icon">🌍</div>
                <div>
                  <h3>Languages</h3>
                  <p>English, Hindi, Marathi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="contact-form-container">
            <div className="contact-form-wrapper">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Name and last name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="youremail@gmail.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Message"
                    rows="6"
                    required
                  />
                </div>

                {status.message && (
                  <div className={`status-message ${status.type}`}>
                    {status.message}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Submit →'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
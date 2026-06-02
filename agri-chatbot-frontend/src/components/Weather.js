import React, { useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle, MapPin } from 'lucide-react';
import './Weather.css';

const Weather = ({ onClose }) => {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState([]);

  // openweathermap.org
  const API_KEY = 'f98d9828d7c8a9395e59e05d438f8240'; 

  const getWeatherAdvice = (temp, humidity, condition) => {
    const tips = [];
    
    if (temp > 35) {
      tips.push("🌡️ High temperature alert! Increase watering frequency for crops.");
      tips.push("☀️ Avoid fertilizer application during peak heat (10 AM - 4 PM).");
    } else if (temp < 15) {
      tips.push("❄️ Cold weather: Protect sensitive crops with mulch or covers.");
    }
    
    if (humidity > 80) {
      tips.push("💧 High humidity: Monitor for fungal diseases. Apply preventive fungicides.");
    } else if (humidity < 30) {
      tips.push("🏜️ Low humidity: Increase irrigation and use mulch to retain moisture.");
    }
    
    if (condition.includes('rain') || condition.includes('Rain')) {
      tips.push("🌧️ Rain expected: Delay fertilizer and pesticide application.");
      tips.push("💦 Check drainage systems to prevent waterlogging.");
    } else if (condition.includes('clear') || condition.includes('Clear')) {
      tips.push("☀️ Good weather for field work and spraying operations.");
    }

    if (tips.length === 0) {
      tips.push("🌤️ Moderate conditions. Continue regular farming activities.");
    }
    
    return tips;
  };

  const fetchWeather = async () => {
    if (!location.trim()) {
      alert('Please enter a city name');
      return;
    }
    
    setLoading(true);
    
    // Handle common spelling variations
    let searchCity = location.trim();
    if (searchCity.toLowerCase() === 'nashik') {
      searchCity = 'Nasik'; // Alternative spelling
    }
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity},IN&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('City not found');
      }
      
      const data = await response.json();
      
      const weatherData = {
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        windSpeed: Math.round(data.wind.speed * 3.6),
        precipitation: 0,
        maxTemp: Math.round(data.main.temp_max),
        minTemp: Math.round(data.main.temp_min),
        location: data.name,
        country: data.sys.country
      };
      
      setWeather(weatherData);
      setAdvice(getWeatherAdvice(weatherData.temp, weatherData.humidity, weatherData.condition));
    } catch (error) {
      // Try alternative spelling if first attempt fails
      if (location.toLowerCase() === 'nasik') {
        alert('City not found. Try "Nashik" with h, or check spelling.');
      } else {
        alert(`Could not find "${location}". Please check spelling and try again.`);
      }
      console.error('Weather fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  };

  return (
    <div className="modal-overlay-weather">
      <div className="weather-container">
        <div className="weather-header">
          <h2>🌦️ Weather & Farming Advice</h2>
          <button className="close-btn-weather" onClick={onClose}>×</button>
        </div>

        <div className="weather-search">
          <input
            type="text"
            placeholder="Enter city name (e.g., Pune, Mumbai, Delhi)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={fetchWeather} disabled={loading}>
            {loading ? 'Loading...' : 'Get Weather'}
          </button>
        </div>

        {weather && (
          <div className="weather-content">
            <div className="weather-current">
              <div className="weather-location">
                <h3>
                  <MapPin size={24} style={{ display: 'inline', marginRight: '8px' }} />
                  {weather.location}
                </h3>
                <p>{weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}</p>
              </div>
              
              <div className="weather-temp">
                <div className="temp-main">{weather.temp}°C</div>
                <div className="temp-range">
                  {weather.minTemp}° / {weather.maxTemp}°
                </div>
              </div>
            </div>

            <div className="weather-details">
              <div className="weather-detail-item">
                <Droplets size={20} />
                <span>Humidity</span>
                <strong>{weather.humidity}%</strong>
              </div>
              <div className="weather-detail-item">
                <Wind size={20} />
                <span>Wind</span>
                <strong>{weather.windSpeed} km/h</strong>
              </div>
              <div className="weather-detail-item">
                {weather.condition === 'Clear' ? <Sun size={20} /> : <Cloud size={20} />}
                <span>Condition</span>
                <strong>{weather.condition}</strong>
              </div>
            </div>

            <div className="farming-advice">
              <h3><AlertTriangle size={20} /> Farming Recommendations</h3>
              {advice.map((tip, index) => (
                <div key={index} className="advice-item">{tip}</div>
              ))}
            </div>
          </div>
        )}

        {!weather && !loading && (
          <div className="weather-empty">
            <Sun size={60} color="#ffa500" />
            <p>Enter your city to get weather-based farming advice</p>
            <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
              Works for any city in India
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Weather;
import React, { useState } from 'react';
import { Calendar, Plus, Trash2, AlertCircle, Droplets, Sprout, Clock, X } from 'lucide-react';
import './CropCalendar.css';

const CropCalendar = ({ onClose, crops, setCrops }) => {
  // REMOVE THIS LINE: const [crops, setCrops] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCrop, setNewCrop] = useState({
    name: '',
    plantingDate: '',
    cropType: 'vegetable'
  });

  // REMOVE ALL useEffect hooks - they're now in App.js

  // Crop growth data (days)
  const cropData = {
    tomato: { water: 2, fertilize: 14, harvest: 70, icon: '🍅' },
    wheat: { water: 7, fertilize: 30, harvest: 120, icon: '🌾' },
    rice: { water: 1, fertilize: 20, harvest: 100, icon: '🌾' },
    potato: { water: 3, fertilize: 21, harvest: 90, icon: '🥔' },
    onion: { water: 3, fertilize: 15, harvest: 100, icon: '🧅' },
    cotton: { water: 7, fertilize: 30, harvest: 150, icon: '🌱' },
    sugarcane: { water: 7, fertilize: 45, harvest: 365, icon: '🎋' },
    corn: { water: 3, fertilize: 21, harvest: 90, icon: '🌽' },
    cabbage: { water: 2, fertilize: 14, harvest: 70, icon: '🥬' },
    carrot: { water: 2, fertilize: 21, harvest: 75, icon: '🥕' }
  };

  const addCrop = () => {
    if (!newCrop.name || !newCrop.plantingDate) {
      alert('Please enter crop name and planting date');
      return;
    }

    const crop = {
      id: Date.now(),
      name: newCrop.name.toLowerCase(),
      plantingDate: newCrop.plantingDate,
      cropType: newCrop.cropType,
      createdAt: new Date().toISOString()
    };

    setCrops([...crops, crop]);
    setNewCrop({ name: '', plantingDate: '', cropType: 'vegetable' });
    setShowAddForm(false);
  };

  const deleteCrop = (id) => {
    if (window.confirm('Are you sure you want to remove this crop?')) {
      setCrops(crops.filter(c => c.id !== id));
    }
  };

  const getReminders = (crop) => {
    const plantDate = new Date(crop.plantingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    plantDate.setHours(0, 0, 0, 0);
    
    const daysSincePlanting = Math.floor((today - plantDate) / (1000 * 60 * 60 * 24));
    const data = cropData[crop.name] || { water: 3, fertilize: 21, harvest: 90, icon: '🌱' };
    const reminders = [];

    if (daysSincePlanting < 0) {
      const daysUntilPlanting = Math.abs(daysSincePlanting);
      return {
        reminders: [{
          type: 'future',
          message: `🌱 Will be planted in ${daysUntilPlanting} day${daysUntilPlanting > 1 ? 's' : ''}`,
          urgent: false,
          icon: <Calendar size={18} />
        }],
        daysSincePlanting,
        data,
        isFuture: true
      };
    }

    const daysSinceWater = daysSincePlanting % data.water;
    const daysUntilWater = data.water - daysSinceWater;
    reminders.push({
      type: 'water',
      message: daysUntilWater === 0 ? '💧 Water today!' : `💧 Water in ${daysUntilWater} day${daysUntilWater > 1 ? 's' : ''}`,
      urgent: daysUntilWater === 0,
      icon: <Droplets size={18} />
    });

    const daysSinceFertilize = daysSincePlanting % data.fertilize;
    const daysUntilFertilize = data.fertilize - daysSinceFertilize;
    reminders.push({
      type: 'fertilize',
      message: daysUntilFertilize === 0 ? '🌿 Fertilize today!' : `🌿 Fertilize in ${daysUntilFertilize} day${daysUntilFertilize > 1 ? 's' : ''}`,
      urgent: daysUntilFertilize === 0,
      icon: <Sprout size={18} />
    });

    const daysUntilHarvest = data.harvest - daysSincePlanting;
    if (daysUntilHarvest > 0) {
      reminders.push({
        type: 'harvest',
        message: daysUntilHarvest <= 7 ? `🎉 Harvest in ${daysUntilHarvest} day${daysUntilHarvest > 1 ? 's' : ''}!` : `🕐 Harvest in ${daysUntilHarvest} day${daysUntilHarvest > 1 ? 's' : ''}`,
        urgent: daysUntilHarvest <= 7,
        icon: <Clock size={18} />
      });
    } else {
      reminders.push({
        type: 'harvest',
        message: '🎉 Ready to harvest!',
        urgent: true,
        icon: <AlertCircle size={18} />
      });
    }

    return { reminders, daysSincePlanting, data, isFuture: false };
  };

  return (
    <div className="modal-overlay-calendar">
      <div className="calendar-container">
        <div className="calendar-header">
          <h2>📅 Crop Calendar & Reminders</h2>
          <button className="close-btn-calendar" onClick={onClose}>×</button>
        </div>

        {!showAddForm && (
          <div className="add-crop-section">
            <button className="add-crop-btn" onClick={() => setShowAddForm(true)}>
              <Plus size={20} />
              Add New Crop
            </button>
          </div>
        )}

        {showAddForm && (
          <div className="add-crop-form">
            <h3>Add New Crop</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Crop Name</label>
                <select
                  value={newCrop.name}
                  onChange={(e) => setNewCrop({ ...newCrop, name: e.target.value })}
                >
                  <option value="">Select crop</option>
                  <option value="tomato">🍅 Tomato</option>
                  <option value="wheat">🌾 Wheat</option>
                  <option value="rice">🌾 Rice</option>
                  <option value="potato">🥔 Potato</option>
                  <option value="onion">🧅 Onion</option>
                  <option value="cotton">🌱 Cotton</option>
                  <option value="sugarcane">🎋 Sugarcane</option>
                  <option value="corn">🌽 Corn</option>
                  <option value="cabbage">🥬 Cabbage</option>
                  <option value="carrot">🥕 Carrot</option>
                </select>
              </div>

              <div className="form-group">
                <label>Planting Date</label>
                <input
                  type="date"
                  value={newCrop.plantingDate}
                  onChange={(e) => setNewCrop({ ...newCrop, plantingDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button className="btn-add" onClick={addCrop}>
                Add Crop
              </button>
            </div>
          </div>
        )}

        <div className="crops-list">
          {crops.length === 0 ? (
            <div className="empty-state">
              <Calendar size={60} color="#ccc" />
              <p>No crops added yet</p>
              <p className="empty-subtitle">Add your first crop to get started with reminders</p>
            </div>
          ) : (
            crops.map(crop => {
              const { reminders, daysSincePlanting, data } = getReminders(crop);
              const cropInfo = cropData[crop.name] || { icon: '🌱' };

              return (
                <div key={crop.id} className="crop-card">
                  <div className="crop-card-header">
                    <div className="crop-title">
                      <span className="crop-icon">{cropInfo.icon}</span>
                      <div>
                        <h3>{crop.name.charAt(0).toUpperCase() + crop.name.slice(1)}</h3>
                        <p className="crop-date">
                          {daysSincePlanting < 0 
                            ? `Planting in ${Math.abs(daysSincePlanting)} day${Math.abs(daysSincePlanting) > 1 ? 's' : ''}`
                            : daysSincePlanting === 0
                            ? 'Planted today'
                            : `Planted ${daysSincePlanting} day${daysSincePlanting > 1 ? 's' : ''} ago`
                          }
                        </p>
                      </div>
                    </div>
                    <button className="delete-btn" onClick={() => deleteCrop(crop.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="reminders-list">
                    {reminders.map((reminder, index) => (
                      <div
                        key={index}
                        className={`reminder-item ${reminder.urgent ? 'urgent' : ''}`}
                      >
                        {reminder.icon}
                        <span>{reminder.message}</span>
                      </div>
                    ))}
                  </div>

                  <div className="crop-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: daysSincePlanting < 0 
                            ? '0%' 
                            : `${Math.min((daysSincePlanting / data.harvest) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <span className="progress-text">
                      {daysSincePlanting < 0 
                        ? 'Not planted yet'
                        : `${Math.min(Math.round((daysSincePlanting / data.harvest) * 100), 100)}% to harvest`
                      }
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CropCalendar;
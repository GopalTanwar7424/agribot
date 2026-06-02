import React, { useState } from 'react';
import { FileText, X, Upload } from 'lucide-react';
import './SoilHealthReport.css';

const SoilHealthReport = ({ onClose, soilReports, setSoilReports }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: '',
    organic_matter: '',
    crop: 'wheat',
    location: '',
    testDate: new Date().toISOString().split('T')[0]
  });

  // Use props directly instead of local state
  const reports = soilReports;
  const setReports = setSoilReports;

  const analyzeNPK = (n, p, k, crop) => {
    const recommendations = [];
    let severity = 'good';

    // Nitrogen analysis
    if (n < 200) {
      recommendations.push({
        nutrient: 'Nitrogen (N)',
        status: 'Low',
        message: `Nitrogen is LOW (${n} kg/ha). Apply 50-60 kg Urea per acre.`,
        color: '#dc2626',
        icon: '⚠️'
      });
      severity = 'poor';
    } else if (n < 280) {
      recommendations.push({
        nutrient: 'Nitrogen (N)',
        status: 'Medium',
        message: `Nitrogen is MEDIUM (${n} kg/ha). Apply 30-40 kg Urea per acre.`,
        color: '#ffa500',
        icon: '⚡'
      });
      if (severity === 'good') severity = 'medium';
    } else {
      recommendations.push({
        nutrient: 'Nitrogen (N)',
        status: 'Good',
        message: `Nitrogen is GOOD (${n} kg/ha). Maintain current levels.`,
        color: '#10b981',
        icon: '✅'
      });
    }

    // Phosphorus analysis
    if (p < 10) {
      recommendations.push({
        nutrient: 'Phosphorus (P)',
        status: 'Low',
        message: `Phosphorus is LOW (${p} kg/ha). Apply 60-80 kg DAP per acre.`,
        color: '#dc2626',
        icon: '⚠️'
      });
      severity = 'poor';
    } else if (p < 25) {
      recommendations.push({
        nutrient: 'Phosphorus (P)',
        status: 'Medium',
        message: `Phosphorus is MEDIUM (${p} kg/ha). Apply 40-50 kg DAP per acre.`,
        color: '#ffa500',
        icon: '⚡'
      });
      if (severity === 'good') severity = 'medium';
    } else {
      recommendations.push({
        nutrient: 'Phosphorus (P)',
        status: 'Good',
        message: `Phosphorus is GOOD (${p} kg/ha). Maintain current levels.`,
        color: '#10b981',
        icon: '✅'
      });
    }

    // Potassium analysis
    if (k < 110) {
      recommendations.push({
        nutrient: 'Potassium (K)',
        status: 'Low',
        message: `Potassium is LOW (${k} kg/ha). Apply 30-40 kg MOP per acre.`,
        color: '#dc2626',
        icon: '⚠️'
      });
      severity = 'poor';
    } else if (k < 280) {
      recommendations.push({
        nutrient: 'Potassium (K)',
        status: 'Medium',
        message: `Potassium is MEDIUM (${k} kg/ha). Apply 20-25 kg MOP per acre.`,
        color: '#ffa500',
        icon: '⚡'
      });
      if (severity === 'good') severity = 'medium';
    } else {
      recommendations.push({
        nutrient: 'Potassium (K)',
        status: 'Good',
        message: `Potassium is GOOD (${k} kg/ha). Maintain current levels.`,
        color: '#10b981',
        icon: '✅'
      });
    }

    return { recommendations, severity };
  };

  const analyzePH = (ph) => {
    if (ph < 5.5) {
      return {
        status: 'Too Acidic',
        message: `Soil is TOO ACIDIC (pH ${ph}). Apply 200-300 kg lime per acre to increase pH.`,
        color: '#dc2626',
        icon: '🔴'
      };
    } else if (ph < 6.0) {
      return {
        status: 'Slightly Acidic',
        message: `Soil is SLIGHTLY ACIDIC (pH ${ph}). Apply 100-150 kg lime per acre.`,
        color: '#ffa500',
        icon: '🟡'
      };
    } else if (ph <= 7.5) {
      return {
        status: 'Optimal',
        message: `Soil pH is OPTIMAL (${ph}). Perfect for most crops.`,
        color: '#10b981',
        icon: '🟢'
      };
    } else if (ph <= 8.0) {
      return {
        status: 'Slightly Alkaline',
        message: `Soil is SLIGHTLY ALKALINE (pH ${ph}). Add organic matter or sulfur.`,
        color: '#ffa500',
        icon: '🟡'
      };
    } else {
      return {
        status: 'Too Alkaline',
        message: `Soil is TOO ALKALINE (pH ${ph}). Apply 20-30 kg sulfur per acre.`,
        color: '#dc2626',
        icon: '🔴'
      };
    }
  };

  const analyzeOrganicMatter = (om) => {
    if (om < 1) {
      return {
        status: 'Very Low',
        message: `Organic matter is VERY LOW (${om}%). Add 5-10 tons compost per acre.`,
        color: '#dc2626',
        icon: '⚠️'
      };
    } else if (om < 2) {
      return {
        status: 'Low',
        message: `Organic matter is LOW (${om}%). Add 3-5 tons compost per acre.`,
        color: '#ffa500',
        icon: '⚡'
      };
    } else if (om <= 4) {
      return {
        status: 'Good',
        message: `Organic matter is GOOD (${om}%). Maintain with regular composting.`,
        color: '#10b981',
        icon: '✅'
      };
    } else {
      return {
        status: 'Excellent',
        message: `Organic matter is EXCELLENT (${om}%). Keep up the good work!`,
        color: '#10b981',
        icon: '⭐'
      };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const n = parseFloat(formData.nitrogen);
    const p = parseFloat(formData.phosphorus);
    const k = parseFloat(formData.potassium);
    const ph = parseFloat(formData.ph);
    const om = parseFloat(formData.organic_matter);

    if (!n || !p || !k || !ph) {
      alert('Please fill in all required fields (N, P, K, pH)');
      return;
    }

    const npkAnalysis = analyzeNPK(n, p, k, formData.crop);
    const phAnalysis = analyzePH(ph);
    const omAnalysis = om ? analyzeOrganicMatter(om) : null;

    const report = {
      id: Date.now(),
      ...formData,
      nitrogen: n,
      phosphorus: p,
      potassium: k,
      ph: ph,
      organic_matter: om || 0,
      npkAnalysis,
      phAnalysis,
      omAnalysis,
      createdAt: new Date().toISOString()
    };

    setReports([report, ...reports]);
    setFormData({
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      ph: '',
      organic_matter: '',
      crop: 'wheat',
      location: '',
      testDate: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
  };

  const deleteReport = (id) => {
    if (window.confirm('Delete this soil report?')) {
      setReports(reports.filter(r => r.id !== id));
    }
  };

  return (
    <div className="modal-overlay-soil">
      <div className="soil-container">
        <div className="soil-header">
          <h2>🌱 Soil Health Report</h2>
          <button className="close-btn-soil" onClick={onClose}>×</button>
        </div>

        {!showForm && (
          <div className="add-report-section">
            <button className="add-report-btn" onClick={() => setShowForm(true)}>
              <Upload size={20} />
              Add Soil Test Results
            </button>
          </div>
        )}

        {showForm && (
          <div className="soil-form-container">
            <h3>Enter Soil Test Results</h3>
            <form onSubmit={handleSubmit} className="soil-form">
              <div className="form-grid">
                <div className="form-field">
                  <label>Nitrogen (N) - kg/ha *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.nitrogen}
                    onChange={(e) => setFormData({ ...formData, nitrogen: e.target.value })}
                    placeholder="e.g., 250"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Phosphorus (P) - kg/ha *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.phosphorus}
                    onChange={(e) => setFormData({ ...formData, phosphorus: e.target.value })}
                    placeholder="e.g., 20"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Potassium (K) - kg/ha *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.potassium}
                    onChange={(e) => setFormData({ ...formData, potassium: e.target.value })}
                    placeholder="e.g., 150"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Soil pH *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="10"
                    value={formData.ph}
                    onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                    placeholder="e.g., 6.5"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Organic Matter (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.organic_matter}
                    onChange={(e) => setFormData({ ...formData, organic_matter: e.target.value })}
                    placeholder="e.g., 2.5"
                  />
                </div>

                <div className="form-field">
                  <label>Crop to Grow</label>
                  <select
                    value={formData.crop}
                    onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                  >
                    <option value="wheat">Wheat</option>
                    <option value="rice">Rice</option>
                    <option value="corn">Corn</option>
                    <option value="cotton">Cotton</option>
                    <option value="sugarcane">Sugarcane</option>
                    <option value="tomato">Tomato</option>
                    <option value="potato">Potato</option>
                    <option value="onion">Onion</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Farm Plot A"
                  />
                </div>

                <div className="form-field">
                  <label>Test Date</label>
                  <input
                    type="date"
                    value={formData.testDate}
                    onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button type="button" className="btn-cancel-soil" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-soil">
                  Generate Report
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="reports-list">
          {reports.length === 0 && !showForm && (
            <div className="empty-state-soil">
              <FileText size={60} color="#ccc" />
              <p>No soil reports yet</p>
              <p className="empty-subtitle">Add your first soil test to get personalized fertilizer recommendations</p>
            </div>
          )}

          {reports.map(report => (
            <div key={report.id} className="report-card">
              <div className="report-card-header">
                <div>
                  <h3>
                    {report.location || 'Soil Test Report'}
                    <span className={`severity-badge ${report.npkAnalysis.severity}`}>
                      {report.npkAnalysis.severity.toUpperCase()}
                    </span>
                  </h3>
                  <p className="report-date">
                    {new Date(report.testDate).toLocaleDateString()} • {report.crop}
                  </p>
                </div>
                <button className="delete-report-btn" onClick={() => deleteReport(report.id)}>
                  <X size={18} />
                </button>
              </div>

              <div className="npk-values">
                <div className="npk-item">
                  <span className="npk-label">N</span>
                  <span className="npk-value">{report.nitrogen}</span>
                  <span className="npk-unit">kg/ha</span>
                </div>
                <div className="npk-item">
                  <span className="npk-label">P</span>
                  <span className="npk-value">{report.phosphorus}</span>
                  <span className="npk-unit">kg/ha</span>
                </div>
                <div className="npk-item">
                  <span className="npk-label">K</span>
                  <span className="npk-value">{report.potassium}</span>
                  <span className="npk-unit">kg/ha</span>
                </div>
                <div className="npk-item">
                  <span className="npk-label">pH</span>
                  <span className="npk-value">{report.ph}</span>
                  <span className="npk-unit"></span>
                </div>
              </div>

              <div className="recommendations">
                <h4>📋 Recommendations</h4>
                
                {report.npkAnalysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="rec-item" style={{ borderLeftColor: rec.color }}>
                    <span className="rec-icon">{rec.icon}</span>
                    <div>
                      <strong>{rec.nutrient}</strong>
                      <p>{rec.message}</p>
                    </div>
                  </div>
                ))}

                <div className="rec-item" style={{ borderLeftColor: report.phAnalysis.color }}>
                  <span className="rec-icon">{report.phAnalysis.icon}</span>
                  <div>
                    <strong>Soil pH</strong>
                    <p>{report.phAnalysis.message}</p>
                  </div>
                </div>

                {report.omAnalysis && (
                  <div className="rec-item" style={{ borderLeftColor: report.omAnalysis.color }}>
                    <span className="rec-icon">{report.omAnalysis.icon}</span>
                    <div>
                      <strong>Organic Matter</strong>
                      <p>{report.omAnalysis.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SoilHealthReport;
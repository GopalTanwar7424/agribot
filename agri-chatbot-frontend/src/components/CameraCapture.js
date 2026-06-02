import React, { useRef, useState } from 'react';
import { Camera, X, Repeat } from 'lucide-react';
import './CameraCapture.css';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Cannot access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      console.error('Video or canvas not available');
      alert('Camera not ready. Please try again.');
      return;
    }

    if (video.readyState < 2) {
      console.error('Video not ready');
      alert('Please wait for camera to load');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob');
        alert('Failed to capture photo. Please try again.');
        return;
      }
      
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage(imageUrl);
      setCapturedBlob(blob);
    }, 'image/jpeg', 0.95);
  };

  const retakePhoto = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  };

  const confirmPhoto = () => {
    // ✅ JUST SEND THE PHOTO, NO DESCRIPTION HERE
    if (!capturedBlob) {
      console.error('No captured photo');
      alert('Please capture a photo first');
      return;
    }

    try {
      const file = new File([capturedBlob], 'camera-photo.jpg', { type: 'image/jpeg' });
      
      // ✅ SEND FILE TO CHAT INTERFACE
      onCapture(file);
      
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
      
      stopCamera();
      onClose();
    } catch (error) {
      console.error('Error confirming photo:', error);
      alert('Failed to process photo. Please try again.');
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(startCamera, 100);
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [facingMode]);

  return (
    <div className="camera-modal">
      <div className="camera-container">
        <div className="camera-header">
          <h3>Take Photo</h3>
          <button className="close-btn" onClick={() => { 
            stopCamera(); 
            if (capturedImage) {
              URL.revokeObjectURL(capturedImage);
            }
            onClose(); 
          }}>
            <X size={24} />
          </button>
        </div>

        <div className="camera-view">
          {!capturedImage ? (
            <>
              <video ref={videoRef} autoPlay playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </>
          ) : (
            <img src={capturedImage} alt="Captured" />
          )}
        </div>

        <div className="camera-controls">
          {!capturedImage ? (
            <>
              <button className="switch-camera-btn" onClick={switchCamera}>
                <Repeat size={24} />
              </button>
              <button className="capture-btn" onClick={capturePhoto}>
                <Camera size={32} />
              </button>
              <div style={{ width: '48px' }} />
            </>
          ) : (
            <>
              <button className="action-btn retake" onClick={retakePhoto}>
                Retake
              </button>
              <button className="action-btn confirm" onClick={confirmPhoto}>
                Use Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
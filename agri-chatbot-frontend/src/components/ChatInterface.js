import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, Volume2, Download, Loader, Plus, MessageSquare, Home, User, LogOut, Copy, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessage, transcribeVoice, analyzeImage, textToSpeech } from '../utils/api';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './ChatInterface.css';
import CameraCapture from './CameraCapture';
import { Camera } from 'lucide-react';

const ChatInterface = ({ sessionId, language, greeting, onRestart }) => {
  const [chats, setChats] = useState([
    {
      id: 1,
      title: 'Current Chat',
      date: 'Today',
      messages: [{ role: 'assistant', content: greeting, timestamp: new Date() }]
    }
  ]);
  const [currentChatId, setCurrentChatId] = useState(1);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  
  // Image preview state
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check for image upload or voice recording triggers
  useEffect(() => {
    const openImageUpload = localStorage.getItem('openImageUpload');
    const startVoiceRecording = localStorage.getItem('startVoiceRecording');
    
    if (openImageUpload === 'true') {
      localStorage.removeItem('openImageUpload');
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 500);
    }
    
    if (startVoiceRecording === 'true') {
      localStorage.removeItem('startVoiceRecording');
      setTimeout(() => {
        startRecording();
      }, 500);
    }
  }, []); 

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateCurrentChatMessages = (newMessages) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: newMessages }
          : chat
      )
    );
  };

  const handleSendMessage = async (text = input) => {
    console.log('=== SEND MESSAGE DEBUG ===');
    console.log('Session ID:', sessionId);
    console.log('Message:', text);
    console.log('Language:', language);
    console.log('Selected Image:', selectedImage);
    console.log('========================');
    // If there's an image, handle image analysis
    if (selectedImage) {
      await handleImageSubmit(selectedImage, text);
      return;
    }

    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text, timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    updateCurrentChatMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessage(sessionId, text, language);
      const assistantMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date()
      };
      updateCurrentChatMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      updateCurrentChatMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        setLoading(true);
        try {
          const response = await transcribeVoice(audioBlob, sessionId, language);
          if (response.transcript) {
            // If image is attached, set transcript to input
            if (selectedImage) {
              setInput(response.transcript);
            } else {
              handleSendMessage(response.transcript);
            }
          }
        } catch (error) {
          console.error('Error transcribing audio:', error);
          alert('Failed to transcribe audio. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // ✅ HANDLE CAMERA PHOTO - Show preview in chat
  const handleCameraPhoto = (photoFile) => {
    // Close camera modal
    setShowCamera(false);
    
    // Show preview in chat
    setSelectedImage(photoFile);
    setImagePreview(URL.createObjectURL(photoFile));
    
    // Focus on input for description
    setTimeout(() => {
      document.querySelector('.message-input')?.focus();
    }, 100);
  };

  // Handle image selection from file input
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setSelectedImage(file);
    };
    reader.readAsDataURL(file);
  };

  // Remove image preview
  const removeImagePreview = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setSelectedImage(null);
    setInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ✅ HANDLE IMAGE SUBMISSION WITH DESCRIPTION
  const handleImageSubmit = async (imageFile, description = '') => {
  if (!imageFile) return;

  // ✅ ADD DEBUGGING
  console.log('=== IMAGE SUBMIT DEBUG ===');
  console.log('Session ID:', sessionId);
  console.log('Language:', language);
  console.log('Image File:', imageFile);
  console.log('Description:', description);
  console.log('========================');

  // ✅ CHECK IF SESSION ID EXISTS
  if (!sessionId) {
    alert('Session expired. Please refresh the page and try again.');
    removeImagePreview();
    return;
  }

  setLoading(true);
  
  try {
    const cleanedDescription = description
      .replace(/[\n\r\t]/g, ' ')
      .replace(/[^\x20-\x7E]/g, '')
      .trim();

    const userMessage = {
      role: 'user',
      content: cleanedDescription || '[Image uploaded]',
      image: imagePreview,
      timestamp: new Date()
    };
    const newMessages = [...messages, userMessage];
    updateCurrentChatMessages(newMessages);

    setInput('');
    const tempPreview = imagePreview;
    setImagePreview(null);
    setSelectedImage(null);

    const response = await analyzeImage(
      imageFile, 
      sessionId, 
      language, 
      cleanedDescription
    );
    
    const diagnosis = 
      `IMAGE ANALYSIS RESULTS\n\n` +
      `DETECTED ISSUES:\n${response.detected_issues?.join(', ') || 'None detected'}\n\n` +
      `DIAGNOSIS:\n${response.diagnosis || 'Unable to diagnose'}\n\n` +
      `TREATMENT:\n${response.treatment || 'No treatment suggested'}\n\n` +
      `PREVENTION:\n${response.prevention || 'No prevention advice'}\n\n` +
      `SEVERITY: ${(response.severity || 'unknown').toUpperCase()}`;
    
    const assistantMessage = {
      role: 'assistant',
      content: diagnosis,
      timestamp: new Date()
    };
    
    updateCurrentChatMessages([...newMessages, assistantMessage]);
    
    if (tempPreview && tempPreview.startsWith('blob:')) {
      URL.revokeObjectURL(tempPreview);
    }
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    let errorMessage = 'Sorry, I encountered an error analyzing the image. Please try again.';
    
    if (error.response) {
      console.error('Backend error:', error.response.data);
      errorMessage += `\n\nError: ${error.response.data.detail || 'Unknown error'}`;
    } else if (error.request) {
      console.error('No response from backend');
      errorMessage = 'Cannot connect to server. Please check if the backend is running.';
    } else {
      console.error('Error:', error.message);
    }
    
    updateCurrentChatMessages([...messages, {
      role: 'assistant',
      content: errorMessage,
      timestamp: new Date()
    }]);
    
    removeImagePreview();
  } finally {
    setLoading(false);
  }
};

  const handlePlayAudio = async (text, messageIndex) => {
    // Stop if already playing this message
    if (playingAudio === messageIndex) {
      window.speechSynthesis.cancel();
      setPlayingAudio(null);
      return;
    }

    // Stop any currently playing audio
    window.speechSynthesis.cancel();
    setPlayingAudio(messageIndex);

    try {
      // Use browser's built-in speech synthesis (instant!)
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language based on current language setting
      const languageMap = {
        'english': 'en-US',
        'hindi': 'hi-IN',
        'marathi': 'mr-IN'
      };
      utterance.lang = languageMap[language] || 'en-US';
      
      // Adjust speech parameters for better quality
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Reset playing state when done
      utterance.onend = () => {
        setPlayingAudio(null);
      };

      utterance.onerror = (error) => {
        console.error('Speech error:', error);
        setPlayingAudio(null);
        alert('Text-to-speech not available. Please try again.');
      };

      // Start speaking immediately
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Error with speech synthesis:', error);
      setPlayingAudio(null);
      alert('Text-to-speech not available. Please try again.');
    }
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    alert('Message copied to clipboard!');
  };

  const downloadChat = () => {
    const chatText = messages.map(m => 
      `[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agribot-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const regenerateResponse = async () => {
    if (messages.length < 2) return;
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    const filteredMessages = messages.slice(0, -1);
    updateCurrentChatMessages(filteredMessages);
    
    handleSendMessage(lastUserMessage.content);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const newChat = () => {
    const newChatItem = {
      id: chats.length + 1,
      title: `Chat ${chats.length + 1}`,
      date: 'Today',
      messages: [{ role: 'assistant', content: greeting, timestamp: new Date() }]
    };
    setChats(prev => [newChatItem, ...prev]);
    setCurrentChatId(newChatItem.id);
    removeImagePreview();
  };

  const switchChat = (chatId) => {
    setCurrentChatId(chatId);
    removeImagePreview();
  };

  const goHome = () => {
    onRestart();
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={newChat}>
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="chat-history">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-history-item ${chat.id === currentChatId ? 'active' : ''}`}
              onClick={() => switchChat(chat.id)}
            >
              <MessageSquare size={16} />
              <div className="chat-info">
                <span className="chat-title">{chat.title}</span>
                <span className="chat-date">{chat.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div className="user-info">
              <span className="user-name">{auth.currentUser?.email?.split('@')[0] || 'User'}</span>
              <span className="user-plan">Free Plan</span>
            </div>
          </div>
          <button className="logout-btn-sidebar" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Top Bar */}
        <div className="chat-topbar">
          <div className="topbar-left">
            <button 
              className="toggle-sidebar-btn" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MessageSquare size={20} />
            </button>
            <div className="topbar-title">
              <h3>AgriBot</h3>
              <span className="online-status">● Online</span>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn-topbar" onClick={goHome} title="Home">
              <Home size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                className={`message-row ${message.role}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {message.role === 'assistant' && (
                  <div className="message-avatar bot-avatar-msg">
                    <img src="/robot.png" alt="AgriBot" className="bot-avatar-img" />
                  </div>
                )}
                
                <div className="message-bubble">
                  <div className="message-header">
                    <strong>{message.role === 'user' ? 'You' : 'AgriBot'}</strong>
                  </div>
                  
                  {/* Show image if present */}
                  {message.image && (
                    <div className="message-image">
                      <img src={message.image} alt="Uploaded" />
                    </div>
                  )}
                  
                  <div className="message-text">
                    {message.content.split('\n').map((line, i) => {
                      // Check if line is a section header
                      const isHeader = line.match(/^(IMAGE ANALYSIS RESULTS|DETECTED ISSUES|DIAGNOSIS|TREATMENT|PREVENTION|SEVERITY):/);
                      
                      // Process **bold** markdown
                      const processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      
                      return (
                        <React.Fragment key={i}>
                          {isHeader ? (
                            <strong 
                              style={{ 
                                display: 'block', 
                                marginTop: i > 0 ? '1rem' : '0',
                                marginBottom: '0.5rem',
                                color: '#fdfefe',
                                fontSize: '0.95rem',
                                fontWeight: '600'
                              }}
                            >
                              {line}
                            </strong>
                          ) : (
                            <span dangerouslySetInnerHTML={{ __html: processedLine }} />
                          )}
                          {i < message.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  
                  <div className="message-footer">
                    <span className="message-timestamp">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="message-actions">
                      <button 
                        className="msg-action-btn" 
                        onClick={() => copyMessage(message.content)} 
                        title="Copy"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        className="msg-action-btn" 
                        onClick={() => handlePlayAudio(message.content, index)} 
                        title="Read aloud"
                      >
                        <Volume2 size={14} />
                      </button>
                      {message.role === 'assistant' && index === messages.length - 1 && (
                        <button 
                          className="msg-action-btn" 
                          onClick={regenerateResponse}
                          title="Regenerate"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button 
                        className="msg-action-btn" 
                        onClick={downloadChat}
                        title="Download chat"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="message-avatar user-avatar-msg">
                    <User size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="message-row assistant">
              <div className="message-avatar bot-avatar-msg">
                <img src="/robot.png" alt="AgriBot" className="bot-avatar-img" />
              </div>
              <div className="typing-indicator-new">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          {/* ✅ IMAGE PREVIEW */}
          {imagePreview && (
            <div className="image-preview-container">
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="Preview" className="preview-image" />
                <button className="remove-image-btn" onClick={removeImagePreview}>
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="input-wrapper">
            <button
              className={`input-icon-btn ${recording ? 'recording' : ''}`}
              onClick={recording ? stopRecording : startRecording}
              title="Voice input"
            >
              <Mic size={20} />
            </button>

            <button
              className="input-icon-btn"
              onClick={() => setShowCamera(true)}
              title="Take photo"
            >
              <Camera size={20} />
            </button>

            <button
              className="input-icon-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload image"
            >
              <ImageIcon size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />

            <input
              type="text"
              className="message-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={imagePreview ? "Add description for image..." : "Type your agriculture question..."}
              disabled={loading || recording}
            />

            <button
              className="send-button"
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !selectedImage) || loading}
            >
              {loading ? <Loader className="spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
          
          <div className="input-actions">
            <button className="input-action-btn" onClick={downloadChat} title="Download chat">
              <Download size={16} />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* ✅ CAMERA MODAL */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraPhoto}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default ChatInterface;
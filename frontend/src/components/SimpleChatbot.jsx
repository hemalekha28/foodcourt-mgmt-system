import React, { useState } from 'react';
import { api } from '../utils/api';

const SimpleChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your shopping assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/chat', {
        message: inputMessage
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.data.message,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        backgroundColor: '#3b82f6',
        color: 'white',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '24px'
      }}
      onClick={() => setIsOpen(true)}
      title="Chat with our assistant"
      >
        💬
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      width: '350px',
      height: '400px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '16px',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
          <span style={{ fontWeight: '600' }}>Shopping Assistant</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        backgroundColor: '#f9fafb'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '12px'
            }}
          >
            <div style={{
              backgroundColor: message.sender === 'user' ? '#3b82f6' : '#e5e7eb',
              color: message.sender === 'user' ? 'white' : 'black',
              padding: '12px',
              borderRadius: '8px',
              maxWidth: '80%',
              fontSize: '14px'
            }}>
              <p style={{ margin: 0 }}>{message.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '12px'
          }}>
            <div style={{
              backgroundColor: '#e5e7eb',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', backgroundColor: '#6b7280', borderRadius: '50%', animation: 'bounce 1s infinite' }}></div>
                <div style={{ width: '6px', height: '6px', backgroundColor: '#6b7280', borderRadius: '50%', animation: 'bounce 1s infinite 0.1s' }}></div>
                <div style={{ width: '6px', height: '6px', backgroundColor: '#6b7280', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: 'white',
        borderRadius: '0 0 12px 12px'
      }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            style={{
              backgroundColor: (!inputMessage.trim() || isLoading) ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimpleChatbot;

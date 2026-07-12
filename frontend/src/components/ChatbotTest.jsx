import React from 'react';

const ChatbotTest = () => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    }}>
      🤖 Chatbot Test - Click me!
    </div>
  );
};

export default ChatbotTest;

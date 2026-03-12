import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../api/axios';

const socket = io('http://localhost:3000');

function ChatModal({ request, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadMessages();
    socket.on('newMessage', (data) => {
      if (data.requestId == request.id) {
        setMessages((prev) => [...prev, data.message]);
      }
    });
    return () => { socket.off('newMessage'); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await API.get(`/messages/${request.id}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.log('Error loading messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await API.post(`/messages/${request.id}`, { message: newMessage });
      setNewMessage('');
    } catch (err) {
      console.log('Error sending message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') { sendMessage(); }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '500px', maxHeight: '600px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '15px 20px', borderBottom: '1px solid #eee',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>💬 Chat — {request.client_name}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#777' }}>{request.reference}</p>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#999'
          }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '15px', maxHeight: '400px', minHeight: '300px' }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} style={{
                marginBottom: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender_id === user.id ? 'flex-end' : 'flex-start'
              }}>
                <p style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>
                  {msg.sender_name} ({msg.sender_role})
                </p>
                <div style={{
                  padding: '10px 15px',
                  borderRadius: msg.sender_id === user.id ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  background: msg.sender_id === user.id ? '#1a73e8' : '#f0f0f0',
                  color: msg.sender_id === user.id ? 'white' : '#333',
                  maxWidth: '80%',
                  fontSize: '14px'
                }}>
                  {msg.message}
                </div>
                <p style={{ fontSize: '10px', color: '#bbb', marginTop: '3px' }}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '15px', borderTop: '1px solid #eee',
          display: 'flex', gap: '10px'
        }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{
              flex: 1, padding: '10px 15px', border: '1px solid #ddd',
              borderRadius: '20px', fontSize: '14px', outline: 'none'
            }}
          />
          <button onClick={sendMessage} style={{
            padding: '10px 20px', background: '#1a73e8', color: 'white',
            border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '14px'
          }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatModal;
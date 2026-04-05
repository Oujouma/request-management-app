import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../api/axios';
import { X, Send } from 'lucide-react';

const socket = io('http://localhost:3000');

function ChatModal({ request, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadMessages();
    const handleNewMessage = (data) => {
      if (String(data.requestId) === String(request.id)) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
    };
    socket.on('newMessage', handleNewMessage);
    return () => { socket.off('newMessage', handleNewMessage); };
  }, [request.id]);

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
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>Chat — {request.client_name}</h3>
            <p>{request.reference}</p>
          </div>
          <button className="chat-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <p className="chat-empty">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                <span className="chat-sender">{msg.sender_name} ({msg.sender_role})</span>
                <div className={`chat-bubble ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                  {msg.message}
                </div>
                <span className="chat-time">{new Date(msg.created_at).toLocaleTimeString()}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
          />
          <button className="chat-send-btn" onClick={sendMessage}><Send size={14} /> Send</button>
        </div>
      </div>
    </div>
  );
}

export default ChatModal;

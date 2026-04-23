import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { io } from 'socket.io-client';
import '../chat.css';

const SOCKET_URL = 'https://qnectback-production.up.railway.app';

const CHANNELS = [
  { id: 'general', name: 'general', topic: 'General chat for everyone' },
  { id: 'showcase', name: 'showcase', topic: 'Share your projects' },
  { id: 'find-a-team', name: 'find-a-team', topic: 'Looking for teammates?' },
  { id: 'resources', name: 'resources', topic: 'Useful links and tools' },
  { id: 'off-topic', name: 'off-topic', topic: 'Anything goes' },
];

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDay(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState('general');
  const [messagesByChannel, setMessagesByChannel] = useState({});
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const messages = messagesByChannel[activeChannel] || [];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_channel', activeChannel);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('channel_history', ({ channel, messages: hist }) => {
      setMessagesByChannel(prev => ({ ...prev, [channel]: hist }));
    });

    socket.on('receive_message', (msg) => {
      setMessagesByChannel(prev => ({
        ...prev,
        [msg.channel]: [...(prev[msg.channel] || []), msg],
      }));
    });

    socket.on('online_users', (users) => setOnlineUsers(users));

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_channel', activeChannel);
    }
    inputRef.current?.focus();
  }, [activeChannel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socketRef.current) return;
    const msg = {
      channel: activeChannel,
      content: input.trim(),
      userId: user?.id,
      userName: user?.name,
      userInitial: user?.name?.[0]?.toUpperCase(),
      timestamp: new Date().toISOString(),
      id: 'local_' + Date.now(),
    };
    // Optimistic update
    setMessagesByChannel(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), msg],
    }));
    socketRef.current.emit('send_message', msg);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const chData = CHANNELS.find(c => c.id === activeChannel);

  // Group messages by day
  const grouped = [];
  let lastDay = null;
  messages.forEach(msg => {
    const day = new Date(msg.timestamp).toDateString();
    if (day !== lastDay) {
      grouped.push({ type: 'divider', label: formatDay(msg.timestamp), key: 'div_' + day });
      lastDay = day;
    }
    grouped.push({ type: 'msg', ...msg });
  });

  return (
    <div className="chat-app">
      {/* Server Rail */}
      <div className="chat-rail">
        <div className="chat-logo" onClick={() => navigate('/dashboard')} title="Back to Dashboard">Q</div>
        <div className="rail-divider" />
        <div className="rail-icon active" title="Qnect Chat">💬</div>
      </div>

      {/* Channel Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <span className="sidebar-server-name">Qnect Chat</span>
          <span className={`conn-dot ${connected ? 'online' : 'offline'}`} title={connected ? 'Connected' : 'Disconnected'} />
        </div>

        <div className="ch-list">
          <div className="ch-section">Text Channels</div>
          {CHANNELS.map(ch => (
            <div
              key={ch.id}
              className={`ch-item ${activeChannel === ch.id ? 'active' : ''}`}
              onClick={() => setActiveChannel(ch.id)}
            >
              <span className="ch-hash">#</span>
              <span className="ch-name">{ch.name}</span>
            </div>
          ))}
        </div>

        <div className="chat-user-panel">
          <div className="chat-user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="chat-user-info">
            <div className="chat-user-name">{user?.name}</div>
            <div className="chat-user-sub">online</div>
          </div>
          <button className="chat-icon-btn" onClick={() => navigate('/dashboard')} title="Dashboard">🏠</button>
        </div>
      </div>

      {/* Main Chat */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <span className="chat-header-hash">#</span>
          <span className="chat-header-name">{chData?.name}</span>
          <span className="chat-header-divider" />
          <span className="chat-header-topic">{chData?.topic}</span>
          <div className="chat-header-actions">
            <button className="chat-icon-btn" onClick={() => navigate('/friends')} title="Friends">👥</button>
            <button className="chat-icon-btn" onClick={() => navigate('/dashboard')} title="Dashboard">📁</button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {grouped.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">#</div>
              <div className="chat-empty-title">Welcome to #{chData?.name}</div>
              <div className="chat-empty-sub">This is the beginning of the channel. Say hello!</div>
            </div>
          )}
          {grouped.map((item, i) => {
            if (item.type === 'divider') {
              return <div key={item.key} className="chat-day-divider">{item.label}</div>;
            }
            const isMe = item.userId === user?.id;
            return (
              <div key={item.id || i} className="chat-msg-group">
                <div className="chat-msg-avatar" style={{ background: isMe ? '#2563eb' : '#6b7280' }}>
                  {item.userInitial || item.userName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="chat-msg-body">
                  <div className="chat-msg-header">
                    <span className="chat-msg-author" style={{ color: isMe ? '#2563eb' : '#374151' }}>
                      {item.userName || 'Unknown'}
                    </span>
                    {isMe && <span className="chat-you-badge">you</span>}
                    <span className="chat-msg-time">{formatTime(item.timestamp)}</span>
                  </div>
                  <div className="chat-msg-text">{item.content}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-wrap">
            <input
              ref={inputRef}
              className="chat-input"
              placeholder={`Message #${chData?.name}`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* Online Users */}
      <div className="chat-members">
        <div className="members-header">Online — {onlineUsers.length || 1}</div>
        {onlineUsers.length > 0 ? onlineUsers.map((u, i) => (
          <div key={i} className="member-item">
            <div className="member-avatar">{u.name?.[0]?.toUpperCase()}</div>
            <div className="member-name">{u.name}</div>
            <span className="member-dot online" />
          </div>
        )) : (
          <div className="member-item">
            <div className="member-avatar" style={{ background: '#2563eb' }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div className="member-name">{user?.name}</div>
            <span className="member-dot online" />
          </div>
        )}
      </div>
    </div>
  );
}

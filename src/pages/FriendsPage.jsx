import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/friends.css';

export default function FriendsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      setUserId(user.id);
      fetchFriends(user.id);
      fetchRequests(user.id);
    }
  }, []);

  const fetchFriends = async (id) => {
    try {
      const response = await api.get(`/friends/${id}`);
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchRequests = async (id) => {
    try {
      const response = await api.get(`/friends/requests/${id}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get(`/profile/search/${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await api.post(`/friends/accept/${friendshipId}`);
      if (userId) {
        fetchFriends(userId);
        fetchRequests(userId);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      await api.delete(`/friends/reject/${friendshipId}`);
      if (userId) {
        fetchRequests(userId);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  return (
    <div className="friends-page">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

      <h1>Friends & Network</h1>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button 
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({requests.length})
        </button>
        <button 
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Find Friends
        </button>
      </div>

      {/* Friend Requests */}
      {activeTab === 'requests' && (
        <section className="friend-requests">
          {requests.length === 0 ? (
            <p className="empty">No friend requests</p>
          ) : (
            <div className="requests-list">
              {requests.map(req => (
                <div key={req.id} className="request-item">
                  <div className="request-info">
                    {req.user.avatar && <img src={req.user.avatar} alt={req.user.name} className="avatar-sm" />}
                    <div>
                      <h4>{req.user.name}</h4>
                      <p>{req.user.bio}</p>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAcceptRequest(req.id)}
                    >
                      Accept
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRejectRequest(req.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Search Users */}
      {activeTab === 'search' && (
        <section className="search-users">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
          <div className="search-results">
            {searchResults.length === 0 && searchQuery.length > 1 ? (
              <p className="empty">No users found</p>
            ) : (
              searchResults.map(user => (
                <div key={user.id} className="user-card">
                  {user.avatar && <img src={user.avatar} alt={user.name} />}
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p>{user.email}</p>
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    View Profile
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Friends List */}
      {activeTab === 'friends' && (
        <section className="friends-list">
          {friends.length === 0 ? (
            <p className="empty">You don't have any friends yet. Find friends to connect with!</p>
          ) : (
            <div className="friends-grid">
              {friends.map(friend => (
                <div key={friend.id} className="friend-card">
                  {friend.avatar && <img src={friend.avatar} alt={friend.name} />}
                  <h4>{friend.name}</h4>
                  {friend.bio && <p className="bio-text">{friend.bio}</p>}
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/profile/${friend.id}`)}
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
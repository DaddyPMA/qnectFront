import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendAPI, profileAPI } from '../api';
import '../friends.css';

export default function FriendsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await friendAPI.getFriends();
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await friendAPI.getPendingRequests();
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const response = await profileAPI.searchUsers(query);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      setActionError('');
      await friendAPI.sendRequest(userId);
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      setActionError(error.response?.data?.error || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendAPI.acceptRequest(friendshipId);
      fetchFriends();
      fetchRequests();
    } catch (error) {
      setActionError('Failed to accept request');
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      await friendAPI.removeFriend(friendshipId);
      fetchRequests();
    } catch (error) {
      setActionError('Failed to reject request');
    }
  };

  return (
    <div className="friends-page">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
      <h1>Friends & Network</h1>
      {actionError && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
          {actionError}
        </div>
      )}
      <div className="tabs">
        <button className={`tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>Friends ({friends.length})</button>
        <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
          Requests {requests.length > 0 && <span style={{ background: '#dc2626', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: 11, marginLeft: 4 }}>{requests.length}</span>}
        </button>
        <button className={`tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>Find People</button>
      </div>

      {activeTab === 'friends' && (
        <section className="friends-list">
          {loading ? <p className="empty">Loading...</p> : friends.length === 0 ? (
            <p className="empty">No friends yet. Use "Find People" to connect!</p>
          ) : (
            <div className="friends-grid">
              {friends.map(friend => (
                <div key={friend.id} className="friend-card">
                  {friend.avatar ? <img src={friend.avatar} alt={friend.name} /> :
                    <div style={{ width:80,height:80,borderRadius:'50%',background:'#2563eb',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700,margin:'0 auto 10px' }}>{friend.name?.[0]?.toUpperCase()}</div>}
                  <h4>{friend.name}</h4>
                  {friend.bio && <p className="bio-text">{friend.bio}</p>}
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/profile/${friend.id}`)}>View Profile</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'requests' && (
        <section className="friend-requests">
          {requests.length === 0 ? <p className="empty">No pending requests</p> : (
            <div className="requests-list">
              {requests.map(req => (
                <div key={req.friendshipId} className="request-item">
                  <div className="request-info">
                    {req.from?.avatar ? <img src={req.from.avatar} alt={req.from.name} className="avatar-sm" /> :
                      <div style={{ width:50,height:50,borderRadius:'50%',background:'#2563eb',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,flexShrink:0 }}>{req.from?.name?.[0]?.toUpperCase()}</div>}
                    <div><h4>{req.from?.name}</h4><p>{req.from?.email}</p></div>
                  </div>
                  <div className="request-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleAcceptRequest(req.friendshipId)}>Accept</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRejectRequest(req.friendshipId)}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'search' && (
        <section className="search-users">
          <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={handleSearch} className="search-input" />
          <div className="search-results">
            {searchResults.length === 0 && searchQuery.length > 1 ? <p className="empty">No users found</p> : (
              searchResults.map(user => (
                <div key={user.id} className="user-card">
                  {user.avatar ? <img src={user.avatar} alt={user.name} /> :
                    <div style={{ width:80,height:80,borderRadius:'50%',background:'#2563eb',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700,margin:'0 auto 10px' }}>{user.name?.[0]?.toUpperCase()}</div>}
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                  <div style={{ display:'flex',gap:8,justifyContent:'center',marginTop:10 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSendRequest(user.id)}>Add Friend</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/profile/${user.id}`)}>Profile</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
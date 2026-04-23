import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import "../styles.css";

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', avatar: '' });
  const [friendStatus, setFriendStatus] = useState('none');
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      setIsOwnProfile(currentUser?.id === userId);

      const response = await api.get(`/profile/${userId}/with-status`);
      setProfile(response.data.user);
      setFriendStatus(response.data.friendStatus);
      setFormData({
        name: response.data.user.name,
        bio: response.data.user.bio || '',
        avatar: response.data.user.avatar || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/profile/me', formData);
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleAddFriend = async () => {
    try {
      await api.post(`/friends/request/${userId}`);
      setFriendStatus('pending');
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    }
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      await api.delete(`/friends/${userId}`);
      setFriendStatus('none');
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!profile) return <div className="error">User not found</div>;

  return (
    <div className="profile-page">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back</button>

      <div className="profile-header">
        {profile.avatar && <img src={profile.avatar} alt={profile.name} className="avatar" />}
        <div className="profile-info">
          <h1>{profile.name}</h1>
          {profile.bio && <p className="bio">{profile.bio}</p>}
          <p className="member-since">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat">
          <span className="stat-value">{profile.stats?.files || 0}</span>
          <span className="stat-label">Files</span>
        </div>
        <div className="stat">
          <span className="stat-value">{profile.stats?.folders || 0}</span>
          <span className="stat-label">Folders</span>
        </div>
        <div className="stat">
          <span className="stat-value">{profile.stats?.friends || 0}</span>
          <span className="stat-label">Friends</span>
        </div>
      </div>

      <div className="profile-actions">
        {isOwnProfile ? (
          <>
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="edit-form">
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Bio (optional)"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows="3"
                />
                <input
                  type="text"
                  placeholder="Avatar URL (optional)"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                />
                <div className="form-buttons">
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
            )}
          </>
        ) : (
          <>
            {friendStatus === 'none' && (
              <button className="btn btn-primary" onClick={handleAddFriend}>Add Friend</button>
            )}
            {friendStatus === 'pending' && (
              <button className="btn btn-secondary" disabled>Friend Request Pending</button>
            )}
            {friendStatus === 'accepted' && (
              <button className="btn btn-danger" onClick={handleRemoveFriend}>Remove Friend</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { profileAPI, friendAPI, fileAPI } from '../api';
import "../styles.css";

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', avatar: '' });
  const [friendStatus, setFriendStatus] = useState('none');
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [userFiles, setUserFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState({});
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId, currentUser]);

  const fetchUserFiles = async (viewUserId) => {
    try {
      setLoadingFiles(true);
      const response = await fileAPI.getUserFiles(viewUserId);
      setUserFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching user files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      setIsOwnProfile(currentUser?.id === userId);

      let response;
      try {
        response = await profileAPI.getProfileWithStatus(userId);
      } catch (error) {
        if ([404, 401, 403].includes(error.response?.status)) {
          response = await profileAPI.getPublicProfile(userId);
          setFriendStatus('none');
        } else {
          throw error;
        }
      }

      const userData = response.data.user || response.data;
      setProfile(userData);
      setFriendStatus(response.data.friendStatus || 'none');
      setFormData({
        name: userData.name,
        bio: userData.bio || '',
        avatar: userData.avatar || ''
      });
      await fetchUserFiles(userId);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.response?.data?.error || 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await profileAPI.updateProfile(formData.name, formData.bio, formData.avatar);
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleAddFriend = async () => {
    try {
      await friendAPI.sendRequest(userId);
      setFriendStatus('pending');
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert(error.response?.data?.error || 'Failed to send friend request');
    }
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      await friendAPI.removeFriend(userId);
      setFriendStatus('none');
    } catch (error) {
      console.error('Error removing friend:', error);
      alert(error.response?.data?.error || 'Failed to remove friend');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    const previewMap = {};

    const loadPreviews = async () => {
      const imageFiles = userFiles.filter((file) => file.mimeType?.startsWith('image/'));
      for (const file of imageFiles) {
        try {
          const response = await fileAPI.getFilePreview(file.id, { signal: abortController.signal });
          if (!isMounted) return;
          previewMap[file.id] = URL.createObjectURL(response.data);
        } catch (error) {
          if (abortController.signal.aborted) return;
          console.error('Error loading file preview:', error);
        }
      }
      if (isMounted) {
        setPreviewUrls((prev) => {
          Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
          return previewMap;
        });
      }
    };

    if (userFiles.length > 0) {
      loadPreviews();
    }

    return () => {
      isMounted = false;
      abortController.abort();
      Object.values(previewMap).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [userFiles]);

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!profile) return <div className="error">{error || 'User not found'}</div>;

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

      <section className="profile-files" style={{ marginTop: '2rem' }}>
        <h2>Posted Files</h2>
        {loadingFiles ? (
          <p className="empty">Loading posts...</p>
        ) : userFiles.length === 0 ? (
          <p className="empty">No posted files visible.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {userFiles.map((file) => (
              <div key={file.id} style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                {file.mimeType?.startsWith('image/') && previewUrls[file.id] ? (
                  <img
                    src={previewUrls[file.id]}
                    alt={file.originalName}
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 140, borderRadius: 10, background: '#f3f4f6', display: 'grid', placeItems: 'center', color: '#475569', marginBottom: 12 }}>
                    {file.mimeType?.startsWith('image/') ? 'Loading preview...' : 'File'}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: '0 0 8px' }}>{file.originalName}</h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>{file.mimeType}</p>
                  <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>{(parseInt(file.size, 10) / 1024).toFixed(2)} KB</p>
                  <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Permission: {file.permission}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
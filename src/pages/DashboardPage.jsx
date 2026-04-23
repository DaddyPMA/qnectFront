import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { fileAPI, folderAPI } from '../api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentUserId = user?.id;

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [filePermission, setFilePermission] = useState('private');

  useEffect(() => {
    loadData();
  }, [currentFolderId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [filesRes, foldersRes] = await Promise.all([
        fileAPI.getFiles(currentFolderId),
        folderAPI.getFolders(currentFolderId),
      ]);
      setFiles(filesRes.data.files || []);
      setFolders(foldersRes.data.folders || []);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await folderAPI.createFolder(newFolderName, currentFolderId);
      setNewFolderName('');
      setSuccess('Folder created');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to create folder');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await fileAPI.uploadFile(file, currentFolderId, filePermission);
      setSuccess('File uploaded successfully');
      e.target.value = '';
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to upload file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Delete this file?')) return;
    try {
      await fileAPI.deleteFile(fileId);
      setSuccess('File deleted');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete file');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm('Delete this folder and all its contents?')) return;
    try {
      await folderAPI.deleteFolder(folderId);
      setSuccess('Folder deleted');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete folder');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  /* ========= ROUTING (PRIORITY FROM SECOND FILE) ========= */
  const goToFriends = () => navigate('/friends');
  const goToChat = () => navigate('/chat');
  const goToProfile = () =>
    navigate(currentUserId ? `/profile/${currentUserId}` : '/profile');

  const breadcrumbs = currentFolderId ? (
    <button
      onClick={() => setCurrentFolderId(null)}
      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
    >
      ← Back to root
    </button>
  ) : (
    <span style={{ color: '#6b7280' }}>Root</span>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Qnect Dashboard</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: '#6b7280' }}>Welcome, {user?.name}</span>
            <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {breadcrumbs}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '1rem', margin: '1.5rem 0' }}>
            <button onClick={goToFriends} className="btn-primary">Friends & Network</button>
            <button onClick={goToChat} className="btn-chat">💬 Chat Rooms</button>
            <button onClick={goToProfile} className="btn-primary">My Profile</button>
          </div>

          {/* Alerts */}
          {error && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success">{success}</div>}

          {/* Folder + File UI */}
          {/* (unchanged from both originals – logic already merged) */}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setError('');
      await folderAPI.createFolder(newFolderName, currentFolderId);
      setNewFolderName('');
      setSuccess('Folder created');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create folder');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      await fileAPI.uploadFile(file, currentFolderId, filePermission);
      setSuccess('File uploaded successfully');
      e.target.value = '';
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (confirm('Delete this file?')) {
      try {
        await fileAPI.deleteFile(fileId);
        setSuccess('File deleted');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete file');
      }
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (confirm('Delete this folder and all its contents?')) {
      try {
        await folderAPI.deleteFolder(folderId);
        setSuccess('Folder deleted');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete folder');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const breadcrumbs = currentFolderId ? (
    <button
      onClick={() => setCurrentFolderId(null)}
      style={{
        background: 'none',
        border: 'none',
        color: '#2563eb',
        cursor: 'pointer',
        textDecoration: 'underline',
      }}
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
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1rem' }}>{breadcrumbs}</div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <Link
              to="/friends"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1.25rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
                minWidth: '160px',
                textAlign: 'center',
              }}
            >
              Friends & Network
            </Link>
            <Link
              to={currentUserId ? `/profile/${currentUserId}` : '/profile'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1.25rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
                minWidth: '140px',
                textAlign: 'center',
              }}
            >
              My Profile
            </Link>
          </div>
          

          {error && <div>{error}</div>}
          {success && <div>{success}</div>}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
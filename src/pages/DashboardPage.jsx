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
    <button onClick={() => setCurrentFolderId(null)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>
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
            <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Breadcrumbs */}
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

          {/* Alerts */}
          {error && <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #fecaca' }}>{error}</div>}
          {success && <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>{success}</div>}

          {/* Create Folder Section */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ marginBottom: '1rem' }}>Create New Folder</h2>
            <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
              <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                Create Folder
              </button>
            </form>
          </div>

          {/* File Upload Section */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ marginBottom: '1rem' }}>Upload File</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="file-upload" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Choose file</label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label htmlFor="permission" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Permission</label>
                <select
                  id="permission"
                  value={filePermission}
                  onChange={(e) => setFilePermission(e.target.value)}
                  style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                >
                  <option value="private">Private</option>
                  <option value="friends">Friends</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>
          </div>

          {/* Folders Section */}
          {folders.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>Folders</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {folders.map(folder => (
                  <div key={folder.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <h3 style={{ cursor: 'pointer', color: '#2563eb' }} onClick={() => setCurrentFolderId(folder.id)}>
                        📁 {folder.name}
                      </h3>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.25rem' }}
                      >
                        ×
                      </button>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{folder.childrenCount || 0} subfolder(s)</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          {files.length > 0 && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Files</h2>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Size</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Permission</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map(file => (
                      <tr key={file.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1rem' }}>{file.originalName}</td>
                        <td style={{ padding: '1rem', color: '#6b7280' }}>{(parseInt(file.size) / 1024).toFixed(2)} KB</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: '#dbeafe', color: '#0c4a6e', borderRadius: '4px', fontSize: '0.875rem' }}>
                            {file.permission}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.25rem' }}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && files.length === 0 && folders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p>No files or folders yet. Create a folder or upload a file to get started!</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '2px solid #d1d5db', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

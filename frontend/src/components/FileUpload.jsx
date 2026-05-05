import React, { useState, useRef } from 'react';
import api from '../utils/api';

export default function FileUpload({ onUpload, accept = '*', label = 'Upload File' }) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded]   = useState(null);
  const [error, setError]         = useState('');
  const inputRef                  = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload/assignment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploaded({ name: res.data.file_name, url: res.data.file_url, size: res.data.file_size });
      onUpload && onUpload(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      {!uploaded ? (
        <div
          className={`file-upload-area ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {uploading ? (
            <>
              <span className="upload-icon">⏳</span>
              <p>Uploading...</p>
              <span>Please wait</span>
            </>
          ) : (
            <>
              <span className="upload-icon">📎</span>
              <p>{label}</p>
              <span>Drag & drop or click to browse</span>
              <span style={{ display: 'block', marginTop: 6 }}>PDF, Word, Images, Text — max 10 MB</span>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: 'var(--light-gray)',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'
        }}>
          <span style={{ fontSize: '1.5rem' }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {uploaded.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {formatSize(uploaded.size)} • Uploaded ✅
            </div>
          </div>
          <button
            onClick={() => { setUploaded(null); onUpload && onUpload(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
            title="Remove file"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginTop: 8, marginBottom: 0 }}>
          {error}
        </div>
      )}
    </div>
  );
}

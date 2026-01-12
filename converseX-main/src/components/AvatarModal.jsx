import { useState } from 'react';
import './Modal.css';
import './AvatarModal.css';

const AvatarModal = ({ onClose, onSave, currentAvatar, loading }) => {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar || '');
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentAvatar || '');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadMode === 'url') {
      if (!avatarUrl) return;
      await onSave(avatarUrl.trim());
    } else {
      if (!selectedFile) return;
      // Convert file to base64 and save
      const reader = new FileReader();
      reader.onloadend = async () => {
        await onSave(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Update avatar</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="avatar-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${uploadMode === 'url' ? 'active' : ''}`}
              onClick={() => setUploadMode('url')}
            >
              URL
            </button>
            <button
              type="button"
              className={`mode-btn ${uploadMode === 'file' ? 'active' : ''}`}
              onClick={() => setUploadMode('file')}
            >
              Upload from device
            </button>
          </div>

          {uploadMode === 'url' ? (
            <label className="avatar-label">
              Paste an image URL for your new avatar
              <input
                type="url"
                className="avatar-input"
                placeholder="https://example.com/avatar.png"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                required
              />
            </label>
          ) : (
            <label className="avatar-label">
              Select an image from your device
              <input
                type="file"
                className="avatar-input"
                accept="image/*"
                onChange={handleFileSelect}
                required
              />
              {selectedFile && (
                <p className="file-name">Selected: {selectedFile.name}</p>
              )}
            </label>
          )}

          <div className="avatar-preview">
            <img
              src={previewUrl || currentAvatar || '/ConverseX.jpg'}
              alt="Avatar preview"
              onError={(e) => {
                e.target.src = '/ConverseX.jpg';
              }}
            />
            <p>This preview updates as you type.</p>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="create-button" 
              disabled={
                loading || 
                (uploadMode === 'url' && !avatarUrl) || 
                (uploadMode === 'file' && !selectedFile)
              }
            >
              {loading ? 'Saving...' : 'Save avatar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvatarModal;

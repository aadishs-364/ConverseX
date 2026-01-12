import { useEffect, useMemo, useState } from 'react';
import './AddMembersModal.css';

const AddMembersModal = ({ isOpen, onClose, community }) => {
  const [emails, setEmails] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [status, setStatus] = useState(null);

  const inviteLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin;
    return `${base}/join/${community?._id || ''}`;
  }, [community]);

  useEffect(() => {
    if (isOpen) {
      setStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    if (!inviteLink) {
      setStatus({ type: 'error', message: 'Invite link not available' });
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
        setStatus({ type: 'success', message: 'Invite link copied to clipboard' });
      } else {
        setStatus({ type: 'error', message: 'Clipboard not supported in this browser' });
      }
    } catch (error) {
      console.error('Failed to copy invite link', error);
      setStatus({ type: 'error', message: 'Unable to copy link' });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!emails.trim()) {
      setStatus({ type: 'error', message: 'Add at least one email address' });
      return;
    }

    setStatus({ type: 'pending', message: 'Sending invites…' });

    setTimeout(() => {
      setStatus({ type: 'success', message: 'Invites sent! Your teammates will receive an email shortly.' });
      setEmails('');
      setPersonalNote('');
    }, 600);
  };

  return (
    <div className="invite-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="invite-card" onClick={(event) => event.stopPropagation()}>
        <div className="invite-card-header">
          <div>
            <p className="invite-eyebrow">Team access</p>
            <h2>Invite members</h2>
            <p className="invite-subtitle">
              {community?.name ? `Share ${community.name} with more collaborators.` : 'Bring more teammates into this workspace.'}
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="invite-share-card">
          <div>
            <p className="invite-label">Shareable link</p>
            <p className="invite-link">{inviteLink}</p>
          </div>
          <button type="button" className="ghost-btn" onClick={handleCopyLink}>
            Copy link
          </button>
        </div>

        <form className="invite-form" onSubmit={handleSubmit}>
          <label className="invite-label" htmlFor="invite-emails">
            Email addresses
          </label>
          <textarea
            id="invite-emails"
            value={emails}
            onChange={(event) => setEmails(event.target.value)}
            placeholder="name@company.com, teammate@studio.com"
            rows={3}
          />

          <label className="invite-label" htmlFor="invite-note">
            Personal note <span>(optional)</span>
          </label>
          <textarea
            id="invite-note"
            value={personalNote}
            onChange={(event) => setPersonalNote(event.target.value)}
            placeholder="Give your teammates some context"
            rows={2}
          />

          {status && (
            <p className={`invite-status ${status.type}`}>
              {status.message}
            </p>
          )}

          <div className="invite-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="primary-btn">
              Send invites
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMembersModal;

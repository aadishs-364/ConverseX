import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfileMenu.css';

const menuItems = [
  { id: 'profile', label: 'My Profile', icon: '👤' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'accounts', label: 'Accounts', icon: '🗂️' },
  { id: 'general', label: 'General', icon: '🧭' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'privacy', label: 'Privacy', icon: '🛡️' },
  { id: 'change-avatar', label: 'Change avatar', icon: '🖼️' },
];

const statusOptions = [
  { value: 'online', label: 'Online' },
  { value: 'busy', label: 'Busy' },
  { value: 'away', label: 'Away' },
  { value: 'meeting', label: 'In a meeting' },
  { value: 'offline', label: 'Invisible' },
];

const STATUS_LABELS = {
  online: 'Online',
  busy: 'Busy',
  away: 'Away',
  meeting: 'In a meeting',
  offline: 'Invisible',
};

const accountOptions = [
  { key: 'google', label: 'Google' },
  { key: 'microsoft', label: 'Microsoft' },
  { key: 'github', label: 'GitHub' },
];

const ProfileMenu = ({ user, onOpenAvatarModal }) => {
  const { logout, updateProfile, savePreferences } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    status: user?.status || 'online',
  });
  const [settings, setSettings] = useState({
    darkMode: user?.preferences?.appearance?.darkMode ?? true,
    compactLayout: user?.preferences?.appearance?.compactLayout ?? false,
    autoUpdates: user?.preferences?.appearance?.autoUpdates ?? true,
  });
  const [accounts, setAccounts] = useState({
    google: user?.linkedAccounts?.google ?? false,
    microsoft: user?.linkedAccounts?.microsoft ?? false,
    github: user?.linkedAccounts?.github ?? false,
  });
  const [general, setGeneral] = useState({
    autoJoin: user?.preferences?.general?.autoJoin ?? false,
    language: user?.preferences?.general?.language ?? 'English (US)',
    timezone: user?.preferences?.general?.timezone ?? 'GMT+05:30',
  });
  const [notifications, setNotifications] = useState({
    messages: user?.preferences?.notifications?.messages ?? true,
    mentions: user?.preferences?.notifications?.mentions ?? true,
    emailDigest: user?.preferences?.notifications?.emailDigest ?? false,
    sound: user?.preferences?.notifications?.sound ?? true,
  });
  const [privacy, setPrivacy] = useState({
    showStatus: user?.preferences?.privacy?.showStatus ?? true,
    readReceipts: user?.preferences?.privacy?.readReceipts ?? true,
    shareActivity: user?.preferences?.privacy?.shareActivity ?? false,
  });
  const [feedback, setFeedback] = useState({ message: '', type: 'success' });
  const [savingSection, setSavingSection] = useState(null);
  const showStatusPublicly = user?.preferences?.privacy?.showStatus !== false;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
        setFeedback({ message: '', type: 'success' });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setProfileForm({
      username: user?.username || '',
      status: user?.status || 'online',
    });
    setSettings({
      darkMode: user?.preferences?.appearance?.darkMode ?? true,
      compactLayout: user?.preferences?.appearance?.compactLayout ?? false,
      autoUpdates: user?.preferences?.appearance?.autoUpdates ?? true,
    });
    setGeneral({
      autoJoin: user?.preferences?.general?.autoJoin ?? false,
      language: user?.preferences?.general?.language ?? 'English (US)',
      timezone: user?.preferences?.general?.timezone ?? 'GMT+05:30',
    });
    setNotifications({
      messages: user?.preferences?.notifications?.messages ?? true,
      mentions: user?.preferences?.notifications?.mentions ?? true,
      emailDigest: user?.preferences?.notifications?.emailDigest ?? false,
      sound: user?.preferences?.notifications?.sound ?? true,
    });
    setPrivacy({
      showStatus: user?.preferences?.privacy?.showStatus ?? true,
      readReceipts: user?.preferences?.privacy?.readReceipts ?? true,
      shareActivity: user?.preferences?.privacy?.shareActivity ?? false,
    });
    setAccounts({
      google: user?.linkedAccounts?.google ?? false,
      microsoft: user?.linkedAccounts?.microsoft ?? false,
      github: user?.linkedAccounts?.github ?? false,
    });
  }, [user]);

  const handleToggle = () =>
    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        setFeedback({ message: '', type: 'success' });
      }
      return next;
    });

  const handleMenuClick = (item) => {
    if (item.id === 'change-avatar') {
      onOpenAvatarModal?.();
      setOpen(false);
      return;
    }

    setActiveSection(item.id);
    setFeedback({ message: '', type: 'success' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileFormChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const result = await updateProfile(profileForm);
    setFeedback({
      message: result.success ? 'Profile updated successfully.' : result.error,
      type: result.success ? 'success' : 'error',
    });
  };

  const persistSection = async (section, payload, successMessage) => {
    setSavingSection(section);
    const result = await savePreferences(section, payload);
    setSavingSection(null);
    setFeedback({
      message: result.success ? successMessage : result.error,
      type: result.success ? 'success' : 'error',
    });
    return result.success;
  };

  const handleAccountToggle = async (key) => {
    if (savingSection === 'accounts') return;
    const previous = accounts[key];
    const updated = { ...accounts, [key]: !previous };
    setAccounts(updated);
    const success = await persistSection('accounts', updated, 'Account preference saved.');
    if (!success) {
      setAccounts((prev) => ({ ...prev, [key]: previous }));
    }
  };

  const handleSettingsSave = () => persistSection('appearance', settings, 'Settings saved.');
  const handleNotificationsSave = () =>
    persistSection('notifications', notifications, 'Notification preferences saved.');
  const handlePrivacySave = () =>
    persistSection('privacy', privacy, 'Privacy preferences saved.');
  const handleGeneralSave = () =>
    persistSection('general', general, 'General preferences saved.');

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <form className="section-form" onSubmit={handleProfileSave}>
            <label>
              Display name
              <input
                type="text"
                value={profileForm.username}
                onChange={(e) => handleProfileFormChange('username', e.target.value)}
                required
              />
            </label>
            <label>
              Status
              <select
                value={profileForm.status}
                onChange={(e) => handleProfileFormChange('status', e.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="section-button">
              Save changes
            </button>
          </form>
        );
      case 'settings':
        return (
          <div className="section-form">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
              />
              Dark mode
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={settings.compactLayout}
                onChange={(e) =>
                  setSettings({ ...settings, compactLayout: e.target.checked })
                }
              />
              Compact layout
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={settings.autoUpdates}
                onChange={(e) => setSettings({ ...settings, autoUpdates: e.target.checked })}
              />
              Auto update app
            </label>
            <button
              type="button"
              className="section-button"
              onClick={handleSettingsSave}
              disabled={savingSection === 'appearance'}
            >
              {savingSection === 'appearance' ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        );
      case 'accounts':
        return (
          <div className="accounts-list">
            {accountOptions.map((account) => (
              <div key={account.key} className="account-row">
                <span>{account.label}</span>
                <button
                  type="button"
                  onClick={() => handleAccountToggle(account.key)}
                  className={accounts[account.key] ? 'connected' : ''}
                  disabled={savingSection === 'accounts'}
                >
                  {accounts[account.key] ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        );
      case 'general':
        return (
          <div className="section-form">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={general.autoJoin}
                onChange={(e) => setGeneral({ ...general, autoJoin: e.target.checked })}
              />
              Auto-join invites
            </label>
            <label>
              Language
              <select
                value={general.language}
                onChange={(e) => setGeneral({ ...general, language: e.target.value })}
              >
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Deutsch</option>
              </select>
            </label>
            <label>
              Timezone
              <select
                value={general.timezone}
                onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
              >
                <option>GMT+05:30</option>
                <option>GMT+01:00</option>
                <option>GMT-05:00</option>
              </select>
            </label>
            <button
              type="button"
              className="section-button"
              onClick={handleGeneralSave}
              disabled={savingSection === 'general'}
            >
              {savingSection === 'general' ? 'Saving...' : 'Save general preferences'}
            </button>
          </div>
        );
      case 'notifications':
        return (
          <div className="section-form">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={notifications.messages}
                onChange={(e) => setNotifications({ ...notifications, messages: e.target.checked })}
              />
              Message alerts
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={notifications.mentions}
                onChange={(e) => setNotifications({ ...notifications, mentions: e.target.checked })}
              />
              Mention alerts
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={notifications.sound}
                onChange={(e) => setNotifications({ ...notifications, sound: e.target.checked })}
              />
              Play sound
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={notifications.emailDigest}
                onChange={(e) => setNotifications({ ...notifications, emailDigest: e.target.checked })}
              />
              Weekly email summary
            </label>
            <button
              type="button"
              className="section-button"
              onClick={handleNotificationsSave}
              disabled={savingSection === 'notifications'}
            >
              {savingSection === 'notifications' ? 'Saving...' : 'Save notification settings'}
            </button>
          </div>
        );
      case 'privacy':
        return (
          <div className="section-form">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={privacy.showStatus}
                onChange={(e) => setPrivacy({ ...privacy, showStatus: e.target.checked })}
              />
              Show my status
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={privacy.readReceipts}
                onChange={(e) => setPrivacy({ ...privacy, readReceipts: e.target.checked })}
              />
              Send read receipts
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={privacy.shareActivity}
                onChange={(e) => setPrivacy({ ...privacy, shareActivity: e.target.checked })}
              />
              Share activity status
            </label>
            <button
              type="button"
              className="section-button"
              onClick={handlePrivacySave}
              disabled={savingSection === 'privacy'}
            >
              {savingSection === 'privacy' ? 'Saving...' : 'Save privacy settings'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-menu" ref={menuRef}>
      <button className="profile-trigger" onClick={handleToggle}>
        {showStatusPublicly && (
          <span className={`status-dot ${user?.status || 'online'}`}></span>
        )}
        <img
          src={user?.avatar || '/ConverseX.jpg'}
          alt={user?.username || 'You'}
          className="profile-avatar"
        />
        <div className="profile-trigger-text">
          <span>{user?.username}</span>
          <small>
            {showStatusPublicly
              ? STATUS_LABELS[user?.status] || 'Online'
              : 'Status hidden'}
          </small>
        </div>
        <span className={`chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <img
              src={user?.avatar || '/ConverseX.jpg'}
              alt={user?.username || 'You'}
              className="profile-avatar large"
            />
            <div>
              <h4>{user?.username}</h4>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="profile-dropdown-body">
            <div className="profile-dropdown-menu">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`menu-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item)}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <button className="menu-item danger" onClick={handleLogout}>
                <span className="menu-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>

            <div className="profile-section-content">
              {renderSectionContent()}
              {feedback.message && (
                <p className={`section-feedback ${feedback.type}`}>
                  {feedback.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;

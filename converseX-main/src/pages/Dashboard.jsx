import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { communityAPI, channelAPI } from '../services/api';
import LeftPanel from '../components/LeftPanel';
import ChatArea from '../components/ChatArea';
import MembersList from '../components/MembersList';
import CreateCommunityModal from '../components/CreateCommunityModal';
import AvatarModal from '../components/AvatarModal';
import { getChannelIdentity } from '../utils/channelDisplay';
import './Dashboard.css';

const AUTO_AWAY_DURATION = 15 * 60 * 1000; // 15 minutes

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

const accountOptions = [
  { key: 'google', label: 'Google' },
  { key: 'microsoft', label: 'Microsoft' },
  { key: 'github', label: 'GitHub' },
];

const Dashboard = () => {
  const { user, updateProfile, logout, savePreferences } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
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
  const autoAwayTimeoutRef = useRef(null);
  const autoAwayActiveRef = useRef(false);
  const previousStatusRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const appearancePrefs = user?.preferences?.appearance || {};
  const activeChannelIdentity = selectedChannel ? getChannelIdentity(selectedChannel) : null;
  const privacyPrefs = user?.preferences?.privacy || {};
  const linkedAccounts = user?.linkedAccounts || {};
  const autoUpdatesEnabled = appearancePrefs.autoUpdates !== false;
  const showActivity = privacyPrefs.shareActivity !== false;

  // Sync form state with user data
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
        setFeedback({ message: '', type: 'success' });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await communityAPI.getAll();
      const fetchedCommunities = response.data.communities;
      setCommunities(fetchedCommunities);

      setSelectedCommunity((prev) => {
        if (prev && fetchedCommunities.some((community) => community._id === prev._id)) {
          return prev;
        }
        return fetchedCommunities[0] || null;
      });
    } catch (error) {
      console.error('Failed to load communities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChannels = useCallback(async (communityId) => {
    try {
      const response = await channelAPI.getByCommunity(communityId);
      const fetchedChannels = response.data.channels;
      setChannels(fetchedChannels);

      setSelectedChannel((prev) => {
        if (prev && fetchedChannels.some((channel) => channel._id === prev._id)) {
          return prev;
        }
        return fetchedChannels[0] || null;
      });
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  }, []);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  // redirect /dashboard to /dashboard/home so NavLink tabs have a sensible default
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      navigate('/dashboard/home', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (selectedCommunity) {
      loadChannels(selectedCommunity._id);
    }
  }, [selectedCommunity, loadChannels]);

  useEffect(() => {
    if (!autoUpdatesEnabled) return;
    const interval = setInterval(() => {
      loadCommunities();
      if (selectedCommunity) {
        loadChannels(selectedCommunity._id);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [autoUpdatesEnabled, selectedCommunity, loadCommunities, loadChannels]);

  const handleCreateCommunity = async (communityData) => {
    try {
      await communityAPI.create(communityData);
      await loadCommunities();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create community:', error);
      alert(error.response?.data?.error || 'Failed to create community');
    }
  };

  const handleSelectCommunity = (community) => {
    if (selectedCommunity?._id === community._id) {
      return;
    }
    setSelectedCommunity(community);
    setSelectedChannel(null);
  };

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
  };

  const handleAvatarSave = async (avatarUrl) => {
    if (!avatarUrl) return;
    setUpdatingAvatar(true);
    const result = await updateProfile({ avatar: avatarUrl });
    setUpdatingAvatar(false);
    if (result.success) {
      setShowAvatarModal(false);
    } else {
      alert(result.error);
    }
  };

  // Profile dropdown handlers
  const handleMenuClick = (item) => {
    if (item.id === 'change-avatar') {
      setShowAvatarModal(true);
      setShowProfileDropdown(false);
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

  const handleAutoUpdatesToggle = (newVal) => {
    setSettings(prev => ({ ...prev, autoUpdates: newVal }));
    persistSection('appearance', { ...settings, autoUpdates: newVal }, 'Auto-updates setting saved.');
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
    persistSection('general', 'General preferences saved.');

  const triggerAutoAway = useCallback(async () => {
    if (!user || autoAwayActiveRef.current) return;
    if (user.status !== 'online') return;
    autoAwayActiveRef.current = true;
    previousStatusRef.current = user.status || 'online';
    const result = await updateProfile({ status: 'away' });
    if (!result.success) {
      autoAwayActiveRef.current = false;
    }
  }, [user, updateProfile]);

  const handleUserActivity = useCallback(() => {
    if (!user) return;
    if (autoAwayTimeoutRef.current) {
      clearTimeout(autoAwayTimeoutRef.current);
    }

    if (
      autoAwayActiveRef.current &&
      user.status === 'away' &&
      previousStatusRef.current &&
      previousStatusRef.current !== 'away'
    ) {
      const restoreStatus = previousStatusRef.current;
      autoAwayActiveRef.current = false;
      previousStatusRef.current = null;
      updateProfile({ status: restoreStatus });
    }

    autoAwayTimeoutRef.current = setTimeout(() => {
      triggerAutoAway();
    }, AUTO_AWAY_DURATION);
  }, [user, triggerAutoAway, updateProfile]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return undefined;
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, handleUserActivity));
    handleUserActivity();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
      if (autoAwayTimeoutRef.current) {
        clearTimeout(autoAwayTimeoutRef.current);
      }
    };
  }, [user, handleUserActivity]);

  useEffect(() => {
    if (!user) return;
    if (user.status !== 'away') {
      autoAwayActiveRef.current = false;
      previousStatusRef.current = null;
    }
  }, [user]);

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
                onChange={(e) => handleAutoUpdatesToggle(e.target.checked)}
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading ConverseX...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <LeftPanel
        communities={communities}
        selectedCommunity={selectedCommunity}
        channels={channels}
        selectedChannel={selectedChannel}
        onSelectCommunity={handleSelectCommunity}
        onSelectChannel={handleSelectChannel}
        onCreateCommunity={() => setShowCreateModal(true)}
      />

      <div className="dashboard-main">
        <div className="main-container">
          <header className="dashboard-header">
          <div className="header-left-group">
            <div className="header-text">
              <p className="header-subtitle">Connected as</p>
              <h1 className="header-title">{user?.username}</h1>
              {showActivity && activeChannelIdentity && (
                <p className="header-activity">
                  Currently sharing ideas in {activeChannelIdentity.symbol} {activeChannelIdentity.label}
                </p>
              )}
            </div>
          </div>

          <div className="header-members-compact">
            <MembersList selectedCommunity={selectedCommunity} compact />
          </div>

          <div className="header-logo">
            <img src="/images/ConverseX.jpg" alt="ConverseX Logo" />
          </div>

          <div className="header-indicators">
            <div className="account-pill-wrapper" ref={profileDropdownRef}>
              <div 
                className="account-pill clickable" 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <img src={user?.avatar} alt={user?.username} className="account-avatar" />
                <div className="account-info">
                  <span className="account-name">{user?.username}</span>
                  {/* show a small colored dot plus readable label based on user.status */}
                  <span className="account-status">
                    <span className={`account-status-dot ${user?.status || 'offline'}`} aria-hidden></span>
                    {(() => {
                      const map = {
                        online: 'Online',
                        busy: 'Busy',
                        away: 'Away',
                        meeting: 'In a meeting',
                        offline: 'Invisible',
                      };
                      return map[user?.status] || 'Offline';
                    })()}
                  </span>
                </div>
                <span className={`chevron ${showProfileDropdown ? 'open' : ''}`}>▾</span>
              </div>

              {showProfileDropdown && (
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
            <span className={`header-pill ${autoUpdatesEnabled ? 'success' : 'warning'}`}>
              {autoUpdatesEnabled ? 'Auto updates on' : 'Auto updates paused'}
            </span>
          </div>
        </header>

          <div className="dashboard-content">
            <div className="chat-shell expanded">
              <div className="content-card">
                <ChatArea
                  selectedChannel={selectedChannel}
                  selectedCommunity={selectedCommunity}
                  user={user}
                  autoUpdates={settings.autoUpdates}
                  onAutoUpdatesChange={handleAutoUpdatesToggle}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCommunity}
        />
      )}

      {showAvatarModal && (
        <AvatarModal
          onClose={() => setShowAvatarModal(false)}
          onSave={handleAvatarSave}
          currentAvatar={user?.avatar}
          loading={updatingAvatar}
        />
      )}
    </div>
  );
};

export default Dashboard;

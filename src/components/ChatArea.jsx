import { useState, useEffect, useRef, useCallback } from 'react';
import { messageAPI } from '../services/api';
import { getLanguageLocale, getTimezoneIdentifier } from '../utils/preferences';
import { getChannelIdentity } from '../utils/channelDisplay';
import {
  joinChannel,
  leaveChannel,
  sendMessage,
  onReceiveMessage,
  offReceiveMessage,
  emitTyping,
  emitStopTyping,
  onUserTyping,
  onUserStopTyping,
  emitMessageUpdate,
  emitMessageDelete,
  onMessageUpdated,
  onMessageDeleted,
  offMessageUpdated,
  offMessageDeleted,
} from '../services/socket';
import AddMembersModal from './AddMembersModal';
import './ChatArea.css';

const ChatArea = ({ selectedChannel, selectedCommunity, user, autoUpdates, onAutoUpdatesChange }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const chatScrollbarRef = useRef(null);
  const chatThumbRef = useRef(null);
  const draggingRef = useRef({ active: false, startY: 0, startScrollTop: 0 });
  const typingTimeoutRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  const [notificationBanner, setNotificationBanner] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState(() => new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const preferences = user?.preferences || {};
  const notificationsPrefs = preferences.notifications || {};
  const privacyPrefs = preferences.privacy || {};
  const generalPrefs = preferences.general || {};

  const locale = getLanguageLocale(generalPrefs.language);
  const timezone = getTimezoneIdentifier(generalPrefs.timezone);
  const allowMessageAlerts = notificationsPrefs.messages !== false;
  const allowMentionHighlights = notificationsPrefs.mentions !== false;
  const allowSound = notificationsPrefs.sound !== false;
  const showReadReceipts = privacyPrefs.readReceipts !== false;
  const memberCount = Array.isArray(selectedCommunity?.members)
    ? selectedCommunity.members.length
    : selectedCommunity?.memberCount ?? selectedCommunity?.stats?.members ?? null;
  const currentUserId = user?.id || user?._id || null;
  const storageUserId = currentUserId || 'anon';
  const hiddenStorageKey = selectedChannel?._id
    ? `hiddenMessages_${storageUserId}_${selectedChannel._id}`
    : null;

  const clearSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedMessageIds(new Set());
  }, []);

  const appendHiddenMessages = useCallback(
    (messageIds) => {
      if (!hiddenStorageKey || typeof window === 'undefined' || !Array.isArray(messageIds)) return;
      try {
        const existingRaw = window.localStorage.getItem(hiddenStorageKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const updated = Array.from(new Set([...(existing || []), ...messageIds]));
        window.localStorage.setItem(hiddenStorageKey, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update hidden messages:', error);
      }
    },
    [hiddenStorageKey]
  );

  const loadMessages = useCallback(async () => {
    if (!selectedChannel) return;
    setLoading(true);
    try {
      const response = await messageAPI.getByChannel(selectedChannel._id);
      // filter out messages user has deleted for themselves (persisted in localStorage)
      const msgs = response.data.messages || [];

      if (hiddenStorageKey && typeof window !== 'undefined') {
        const hiddenRaw = window.localStorage.getItem(hiddenStorageKey);
        const hidden = hiddenRaw ? JSON.parse(hiddenRaw) : [];
        setMessages(msgs.filter((m) => !hidden.includes(m._id)));
      } else {
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedChannel, hiddenStorageKey]);

  useEffect(() => {
    if (!selectedChannel) return;

    // Always load a snapshot of messages when channel changes
    loadMessages();

    if (autoUpdates) {
      joinChannel(selectedChannel._id);

      const handleIncomingMessage = (message) => {
        setMessages((prev) => [...prev, message]);
        if (message.author._id === user.id) return;

        if (allowMessageAlerts) {
          setNotificationBanner(`${message.author.username} sent a new message`);
          if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
          }
          notificationTimeoutRef.current = setTimeout(() => {
            setNotificationBanner(null);
          }, 4000);
        }

        if (allowSound) {
          playNotificationTone();
        }
      };

      // Listen for incoming messages
      onReceiveMessage(handleIncomingMessage);

      // Listen for typing indicators
      onUserTyping(({ username }) => {
        setTypingUser(username);
      });

      onUserStopTyping(() => {
        setTypingUser(null);
      });

      const handleMessageUpdated = (updatedMessage) => {
        setMessages((prev) =>
          prev.map((message) => (message._id === updatedMessage._id ? updatedMessage : message))
        );
      };

      const handleMessageDeleted = ({ messageId }) => {
        setMessages((prev) => prev.filter((message) => message._id !== messageId));
      };

      onMessageUpdated(handleMessageUpdated);
      onMessageDeleted(handleMessageDeleted);

      return () => {
        leaveChannel(selectedChannel._id);
        offReceiveMessage();
        offMessageUpdated();
        offMessageDeleted();
      };
    }

    // if autoUpdates is false we still keep the snapshot but ensure listeners are cleared
    offReceiveMessage();
    offMessageUpdated();
    offMessageDeleted();
  }, [selectedChannel, allowMessageAlerts, allowSound, user.id, loadMessages, autoUpdates]);

  // Custom overlay scrollbar for chat messages (sync + drag)
  useEffect(() => {
    const container = messagesContainerRef.current;
    const thumb = chatThumbRef.current;
    if (!container || !thumb) return;

    const updateThumb = () => {
      const ch = container.clientHeight;
      const sh = container.scrollHeight;
      if (sh <= ch) {
        // no overflow — make thumb full height
        thumb.style.height = `${ch}px`;
        thumb.style.transform = `translateY(0px)`;
        return;
      }

      // compute thumb height and top using scrollable extents so mapping is linear
      const scrollable = sh - ch;
      const thumbHeight = Math.max(32, Math.floor((ch * ch) / sh));
      const trackHeight = ch - thumbHeight;
      const top = Math.round((container.scrollTop / scrollable) * trackHeight);
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${top}px)`;
    };

    const onScroll = () => updateThumb();
    container.addEventListener('scroll', onScroll, { passive: true });

    // dragging
    const onWindowMouseMove = (e) => {
      if (!draggingRef.current.active) return;
      const delta = e.clientY - draggingRef.current.startY;
      const containerEl = messagesContainerRef.current;
      const sh = containerEl.scrollHeight;
      const ch = containerEl.clientHeight;
      const scrollable = sh - ch;
      if (scrollable <= 0) return;
      const thumbEl = chatThumbRef.current;
      const thumbHeight = parseFloat(getComputedStyle(thumbEl).height || 0);
      const thumbTrack = Math.max(1, ch - thumbHeight);
      // speed multiplier to make dragging feel snappier (closer to native scrollbar speed)
      const SPEED = 1.8;
      const scrollPerPx = (scrollable / thumbTrack) * SPEED;
      containerEl.scrollTop = draggingRef.current.startScrollTop + delta * scrollPerPx;
    };

    const onWindowMouseUp = () => {
      draggingRef.current.active = false;
      document.body.style.userSelect = '';
    };

    const onThumbMouseDown = (e) => {
      draggingRef.current.active = true;
      draggingRef.current.startY = e.clientY;
      draggingRef.current.startScrollTop = container.scrollTop;
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };

    // track click: jump to position where user clicked on track
    const onTrackClick = (e) => {
      if (!chatScrollbarRef.current) return;
      const trackRect = chatScrollbarRef.current.getBoundingClientRect();
      const ch = container.clientHeight;
      const sh = container.scrollHeight;
      if (sh <= ch) return;
      const clickY = e.clientY - trackRect.top; // relative to top of track
      const thumbEl = chatThumbRef.current;
      const thumbHeight = parseFloat(getComputedStyle(thumbEl).height || 0);
      const trackInner = Math.max(1, trackRect.height - thumbHeight);
      const ratio = Math.max(0, Math.min(1, (clickY - thumbHeight / 2) / trackInner));
      // jump scroll — make it snappy
      container.scrollTop = Math.round(ratio * (sh - ch));
    };

    // touch support for thumb drag
    const onThumbTouchStart = (e) => {
      const touch = e.touches[0];
      draggingRef.current.active = true;
      draggingRef.current.startY = touch.clientY;
      draggingRef.current.startScrollTop = container.scrollTop;
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };

    const onWindowTouchMove = (e) => {
      if (!draggingRef.current.active) return;
      const touch = e.touches[0];
      const delta = touch.clientY - draggingRef.current.startY;
      const containerEl = messagesContainerRef.current;
      const sh = containerEl.scrollHeight;
      const ch = containerEl.clientHeight;
      const scrollable = sh - ch;
      if (scrollable <= 0) return;
      const thumbTrack = ch - parseFloat(getComputedStyle(chatThumbRef.current).height || 0);
      const scrollPerPx = scrollable / Math.max(1, thumbTrack);
      containerEl.scrollTop = draggingRef.current.startScrollTop + delta * scrollPerPx;
    };

    const onWindowTouchEnd = () => {
      draggingRef.current.active = false;
      document.body.style.userSelect = '';
    };

  thumb.addEventListener('mousedown', onThumbMouseDown);
  thumb.addEventListener('touchstart', onThumbTouchStart, { passive: false });
  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);
  window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
  window.addEventListener('touchend', onWindowTouchEnd);

  // track clicks
  const track = chatScrollbarRef.current;
  if (track) track.addEventListener('click', onTrackClick);

    // initial
    updateThumb();

    const ro = new ResizeObserver(updateThumb);
    ro.observe(container);

    return () => {
      container.removeEventListener('scroll', onScroll);
      thumb.removeEventListener('mousedown', onThumbMouseDown);
      thumb.removeEventListener('touchstart', onThumbTouchStart);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
      if (track) track.removeEventListener('click', onTrackClick);
      ro.disconnect();
    };
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug: log messages container sizes so we can confirm overflow and scrollbar behavior
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = messagesContainerRef.current;
    if (!el) return;

    const logSizes = () => {
      // eslint-disable-next-line no-console
      console.log('[ChatArea] messages-container offsetHeight=', el.offsetHeight, 'scrollHeight=', el.scrollHeight, 'scrollTop=', el.scrollTop);
    };

    // initial log
    logSizes();

    const observer = new ResizeObserver(() => logSizes());
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [messagesContainerRef, messages, autoUpdates]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setEditingMessageId(null);
    setDeleteTargetId(null);
    setEditContent('');
    clearSelection();
  }, [selectedChannel?._id, clearSelection]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotificationTone = () => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 620;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    oscillator.stop(ctx.currentTime + 0.25);
    oscillator.onended = () => ctx.close();
  };

  const handleTyping = () => {
    emitTyping(selectedChannel._id, user.username);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(selectedChannel._id);
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChannel) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    emitStopTyping(selectedChannel._id);

    try {
      const response = await messageAPI.send({
        content: messageContent,
        channelId: selectedChannel._id,
      });

      // Emit through socket for real-time delivery
      sendMessage(selectedChannel._id, response.data.data);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
      setNewMessage(messageContent);
    }
  };

  const handleStartEditing = (message) => {
    setEditingMessageId(message._id);
    setEditContent(message.content);
    setDeleteTargetId(null);
  };

  const handleCancelEditing = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleSubmitEdit = async (messageId) => {
    if (!editContent.trim()) return;
    setSubmittingEdit(true);
    try {
      const response = await messageAPI.edit(messageId, editContent.trim());
      const updatedMessage = response.data.data;
      setMessages((prev) =>
        prev.map((message) => (message._id === messageId ? updatedMessage : message))
      );
      emitMessageUpdate(selectedChannel._id, updatedMessage);
      handleCancelEditing();
    } catch (error) {
      console.error('Failed to edit message:', error);
      alert('Could not update message');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleRequestDelete = (messageId) => {
    setDeleteTargetId((prev) => (prev === messageId ? null : messageId));
    setEditingMessageId(null);
  };

  const handleDeleteMessage = async () => {
    if (!deleteTargetId) return;
    setDeletingMessage(true);
    try {
      await messageAPI.delete(deleteTargetId);
      setMessages((prev) => prev.filter((message) => message._id !== deleteTargetId));
      emitMessageDelete(selectedChannel._id, deleteTargetId);
      setDeleteTargetId(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Could not delete message');
    } finally {
      setDeletingMessage(false);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (prev) {
        setSelectedMessageIds(new Set());
      }
      return !prev;
    });
  };

  const handleSelectMessage = (messageId) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedMessageIds(new Set(messages.map((m) => m._id)));
  };

  const handleBulkDeleteForMe = () => {
    if (!selectedChannel || selectedMessageIds.size === 0) return;
    const ids = Array.from(selectedMessageIds);
    try {
      appendHiddenMessages(ids);
      setMessages((prev) => prev.filter((message) => !selectedMessageIds.has(message._id)));
      setDeleteTargetId(null);
      clearSelection();
    } catch (error) {
      console.error('Failed to delete selected messages for me:', error);
      alert('Could not remove selected messages locally');
    }
  };

  const handleBulkDeleteForEveryone = async () => {
    if (!selectedChannel || selectedMessageIds.size === 0) return;
    if (!currentUserId) {
      alert('Please sign in again to delete your messages for everyone.');
      return;
    }

    const targetIds = messages
      .filter((message) => {
        const authorId = message?.author?._id || message?.author?.id;
        return selectedMessageIds.has(message._id) && authorId === currentUserId;
      })
      .map((message) => message._id);

    if (targetIds.length === 0) {
      alert('Only your own messages can be deleted for everyone.');
      return;
    }

    setBulkActionLoading(true);
    try {
      await Promise.all(targetIds.map((messageId) => messageAPI.delete(messageId)));
      setMessages((prev) => prev.filter((message) => !targetIds.includes(message._id)));
      targetIds.forEach((messageId) => emitMessageDelete(selectedChannel._id, messageId));
      setDeleteTargetId(null);
      clearSelection();
    } catch (error) {
      console.error('Failed to delete selected messages:', error);
      alert('Could not delete selected messages for everyone');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDeleteForMe = (messageId) => {
    try {
      appendHiddenMessages([messageId]);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete for me:', err);
      alert('Could not remove message locally');
    }
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const safeFormat = (options, fallbackFn) => {
      try {
        return messageDate.toLocaleString(locale, { ...options, timeZone: timezone });
      } catch {
        return fallbackFn();
      }
    };

    const timeStr = safeFormat(
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      },
      () => messageDate.toLocaleTimeString()
    );

    if (messageDate.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${timeStr}`;
    } else {
      const dateStr = safeFormat(
        {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        },
        () => messageDate.toLocaleDateString()
      );
      return `${dateStr} at ${timeStr}`;
    }
  };

  const selectedCount = selectedMessageIds.size;
  const selectedOwnCount = messages.reduce((count, message) => {
    if (!currentUserId) return count;
    const authorId = message?.author?._id || message?.author?.id;
    return selectedMessageIds.has(message._id) && authorId === currentUserId ? count + 1 : count;
  }, 0);

  if (!selectedChannel) {
    return (
      <div className="chat-area">
        <div className="empty-chat">
          <h2>Welcome to ConverseX! 🎉</h2>
          <p>Select a channel from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  const channelIdentity = getChannelIdentity(selectedChannel);

  return (
    <div className="chat-area">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <p className="chat-eyebrow">Now collaborating in</p>
          <div className="chat-title-row">
            <span className="channel-symbol" aria-hidden="true">
              {channelIdentity.symbol}
            </span>
            <h2>{channelIdentity.label}</h2>
            <span className="channel-pill text">{channelIdentity.badge}</span>
            {/* Community name intentionally omitted from header; it's shown in the LeftPanel */}
          </div>
          <p className="channel-description">
            {selectedChannel.description || channelIdentity.tagline || 'Share updates, decisions, and inspiration with your team.'}
          </p>
          <div className="channel-meta">
            <span>{messages.length} messages</span>
            <span>{memberCount ?? '—'} members</span>
            <span>{generalPrefs.language?.toUpperCase() || 'EN'} · {generalPrefs.timezone || 'Local time'}</span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => setShowInviteModal(true)}
          >
            Invite collaborators
          </button>
          <button
            type="button"
            className={`ghost-btn auto-toggle ${autoUpdates ? 'active' : ''}`}
            onClick={() => onAutoUpdatesChange(!autoUpdates)}
            title={autoUpdates ? 'Disable live updates' : 'Enable live updates'}
            aria-pressed={!autoUpdates}
          >
            {autoUpdates ? 'Auto updates on' : 'Auto updates off'}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setShowInviteModal(true)}
          >
            Add members
          </button>
          <button
            type="button"
            className={`ghost-btn selection-toggle ${selectionMode ? 'active' : ''}`}
            onClick={toggleSelectionMode}
            disabled={messages.length === 0}
          >
            {selectionMode ? 'Exit selection' : 'Select messages'}
          </button>
        </div>
      </div>

      {selectionMode && (
        <div className="message-selection-bar" role="region" aria-live="polite">
          <span className="selection-count">{selectedCount} selected</span>
          <div className="selection-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={handleSelectAll}
              disabled={messages.length === 0}
            >
              Select All
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={handleBulkDeleteForMe}
              disabled={selectedCount === 0}
            >
              Delete for me
            </button>
            <button
              type="button"
              className="danger-btn"
              onClick={handleBulkDeleteForEveryone}
              disabled={selectedOwnCount === 0 || bulkActionLoading}
            >
              {bulkActionLoading ? 'Deleting...' : 'Delete for everyone'}
            </button>
            <button type="button" className="ghost-btn" onClick={clearSelection}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {notificationBanner && (
        <div className="notification-banner" role="status">
          {notificationBanner}
        </div>
      )}

      {/* Messages Area */}
  <div className="messages-container" ref={messagesContainerRef}>
        {loading ? (
          <div className="loading-messages">
            <div className="loading-spinner"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet. Be the first to say something!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message, index) => {
              const showAvatar =
                index === 0 ||
                messages[index - 1].author._id !== message.author._id;
              const containsMention =
                allowMentionHighlights &&
                user?.username &&
                message.content.toLowerCase().includes(`@${user.username.toLowerCase()}`);
              // Robust ownership check: server/user objects sometimes use _id or id
              const currentUserId = user?.id || user?._id || null;
              const authorId = message?.author?._id || message?.author?.id || null;
              const isOwnMessage = currentUserId && authorId && currentUserId === authorId;
              const isEditing = editingMessageId === message._id;
              const isDeleting = deleteTargetId === message._id;
              const isSelected = selectedMessageIds.has(message._id);

              return (
                <div
                  key={message._id}
                  className={`message ${
                    isOwnMessage ? 'own-message' : ''
                  } ${containsMention ? 'mention' : ''} ${selectionMode ? 'selection-mode' : ''} ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={
                    selectionMode
                      ? () => handleSelectMessage(message._id)
                      : undefined
                  }
                  onKeyDown={
                    selectionMode
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelectMessage(message._id);
                          }
                        }
                      : undefined
                  }
                  tabIndex={selectionMode ? 0 : undefined}
                  role={selectionMode ? 'checkbox' : undefined}
                  aria-checked={selectionMode ? isSelected : undefined}
                >
                  {selectionMode && (
                    <label
                      className="message-select-checkbox"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectMessage(message._id)}
                      />
                    </label>
                  )}
                  {showAvatar && (
                    <img
                      src={message.author.avatar}
                      alt={message.author.username}
                      className="message-avatar"
                    />
                  )}
                  <div className={`message-content ${!showAvatar ? 'no-avatar' : ''}`}>
                    {showAvatar && (
                      <div className="message-header">
                        <span className="message-author">{message.author.username}</span>
                        <span className="message-time">{formatTime(message.createdAt)}</span>
                        {message.isEdited && !isEditing && (
                          <span className="message-edited">Edited</span>
                        )}
                      </div>
                    )}
                    {isEditing ? (
                      <div className="message-edit-card">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="message-edit-input"
                          rows={3}
                        />
                        <div className="message-edit-actions">
                          <button
                            type="button"
                            className="primary-btn"
                            disabled={submittingEdit}
                            onClick={() => handleSubmitEdit(message._id)}
                          >
                            {submittingEdit ? 'Saving...' : 'Save changes'}
                          </button>
                          <button type="button" className="ghost-btn" onClick={handleCancelEditing}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="message-text">
                        {message.content}
                        {containsMention && (
                          <span className="mention-pill">Mentioned you</span>
                        )}
                      </div>
                    )}
                    {isDeleting && (
                      <div className="message-delete-confirm">
                        <p>Delete this message?</p>
                        <div className="message-edit-actions">
                          <button
                            type="button"
                            className="danger-btn"
                            disabled={deletingMessage}
                            onClick={handleDeleteMessage}
                          >
                            {deletingMessage ? 'Deleting...' : 'Delete for everyone'}
                          </button>
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => handleDeleteForMe(message._id)}
                          >
                            Delete for me
                          </button>
                          <button type="button" className="ghost-btn" onClick={() => setDeleteTargetId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {isOwnMessage && !isEditing && !isDeleting && !selectionMode && (
                      <div className="message-actions">
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => handleStartEditing(message)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="action-btn danger"
                          onClick={() => handleRequestDelete(message._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {showReadReceipts && message.author._id === user.id && (() => {
                      // compute WhatsApp-like receipts
                      const totalRecipients = Math.max((memberCount || 0) - 1, 0); // exclude sender
                      const deliveredTo = message.deliveredTo || [];
                      const readBy = message.readBy || [];

                      // No recipients (1:1 with only sender) -> don't show receipts
                      if (totalRecipients === 0) return null;

                      // Read by everyone -> double green ticks
                      if (readBy.length >= totalRecipients && totalRecipients > 0) {
                        return (
                          <span className="message-receipt ticks double-read" aria-label="Read by everyone">
                            ✓✓
                          </span>
                        );
                      }

                      // Delivered to everyone (but not read by all) -> double grey ticks
                      if (deliveredTo.length >= totalRecipients && totalRecipients > 0) {
                        return (
                          <span className="message-receipt ticks double-delivered" aria-label="Delivered to everyone">
                            ✓✓
                          </span>
                        );
                      }

                      // Delivered to no one -> single grey tick
                      if (deliveredTo.length === 0) {
                        return (
                          <span className="message-receipt ticks single-delivered" aria-label="Delivered">
                            ✓
                          </span>
                        );
                      }

                      // Fallback: partial delivery -> single grey tick
                      return (
                        <span className="message-receipt ticks single-delivered" aria-label="Partially delivered">
                          ✓
                        </span>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* overlay scrollbar (always present visually) */}
        <div className="chat-scrollbar" ref={chatScrollbarRef} aria-hidden="true">
          <div className="chat-thumb" ref={chatThumbRef} />
        </div>

        {/* Typing Indicator */}
        {typingUser && (
          <div className="typing-indicator">
            <span>{typingUser} is typing...</span>
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="message-input-container">
        <input
          type="text"
          className="message-input"
          placeholder={`Message ${channelIdentity.symbol} ${channelIdentity.label}`}
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          maxLength={2000}
        />
        <button type="submit" className="send-button" disabled={!newMessage.trim()}>
          Send
        </button>
      </form>

      <AddMembersModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        community={selectedCommunity}
      />
    </div>
  );
};

export default ChatArea;

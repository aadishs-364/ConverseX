import { useState, useEffect, useCallback } from 'react';
import { meetingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './MeetingsPanel.css';

const MeetingsPanel = ({ selectedCommunity }) => {
  const [meetings, setMeetings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    reminder: 'none',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');
  const [detailMeeting, setDetailMeeting] = useState(null);
  const DRAFT_KEY = selectedCommunity ? `meetingDraft_${selectedCommunity._id}` : null;
  const { user, updateProfile } = useAuth();

  const loadMeetings = useCallback(async () => {
    if (!selectedCommunity) return;
    
    setLoading(true);
    try {
      const response = await meetingAPI.getByCommunity(selectedCommunity._id);
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCommunity]);

  useEffect(() => {
    if (selectedCommunity) {
      loadMeetings();
    }
    // load draft if exists
    if (DRAFT_KEY && typeof window !== 'undefined') {
      const draft = window.localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          setFormData(JSON.parse(draft));
        } catch {}
      }
    }
  }, [selectedCommunity, loadMeetings]);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    
    try {
      // Ensure startTime is ISO string
      const payload = {
        ...formData,
        community: selectedCommunity._id,
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
      };
      await meetingAPI.create(payload);
      
      setFormData({ title: '', description: '', startTime: '', endTime: '', reminder: 'none' });
      if (DRAFT_KEY && typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_KEY);
      setShowCreateModal(false);
      loadMeetings();
    } catch (error) {
      console.error('Failed to create meeting:', error);
      alert(error.response?.data?.error || 'Failed to create meeting');
    }
  };

  const openDatePicker = (e) => {
    e && e.stopPropagation();
    setTempStart(formData.startTime || new Date().toISOString().slice(0, 16));
    setShowDatePicker(true);
  };

  const openEndDatePicker = (e) => {
    e && e.stopPropagation();
    setTempEnd(formData.endTime || '');
    setShowEndDatePicker(true);
  };

  const saveDateFromPicker = () => {
    setFormData((prev) => ({ ...prev, startTime: tempStart }));
    setShowDatePicker(false);
  };

  const saveEndDateFromPicker = () => {
    setFormData((prev) => ({ ...prev, endTime: tempEnd }));
    setShowEndDatePicker(false);
  };

  const cancelDatePicker = () => {
    setTempStart('');
    setShowDatePicker(false);
  };

  const cancelEndDatePicker = () => {
    setTempEnd('');
    setShowEndDatePicker(false);
  };

  const handleOpenDetails = (meeting) => {
    setDetailMeeting(meeting);
  };

  const closeDetails = () => setDetailMeeting(null);

  const downloadICS = (meeting) => {
    try {
      const start = meeting.startTime ? new Date(meeting.startTime) : null;
      if (!start) {
        alert('Meeting does not have a valid start time');
        return;
      }
      // Default duration 1 hour
      const end = meeting.endTime ? new Date(meeting.endTime) : new Date(start.getTime() + 60 * 60 * 1000);

      const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ConverseX//EN\nBEGIN:VEVENT\nUID:${meeting._id}@conversex.local\nDTSTAMP:${fmt(new Date())}\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nSUMMARY:${meeting.title}\nDESCRIPTION:${(meeting.description || '').replace(/\n/g, '\\n')}\nEND:VEVENT\nEND:VCALENDAR`;

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(meeting.title || 'meeting').replace(/[^a-z0-9]/gi, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create calendar file', err);
      alert('Unable to create calendar file');
    }
  };

  const handleSaveDraft = () => {
    if (!DRAFT_KEY || typeof window === 'undefined') return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    alert('Draft saved. You can continue later.');
  };

  const handleJoinMeeting = async (meetingId, meetingLink) => {
    try {
      await meetingAPI.join(meetingId);
      if (typeof meetingLink === 'string' && meetingLink.trim()) {
        window.open(meetingLink, '_blank');
      }

      if (updateProfile) {
        const result = await updateProfile({ status: 'meeting' });
        if (!result.success) {
          console.warn('Failed to update status to meeting:', result.error);
        }
      }
    } catch (error) {
      console.error('Failed to join meeting:', error);
      alert('Failed to join meeting');
    }
  };

  const handleEndMeeting = async (meetingId) => {
    if (!meetingId) return;
    const ok = window.confirm('End this meeting for everyone? This action cannot be undone.');
    if (!ok) return;
    try {
      await meetingAPI.updateStatus(meetingId, 'cancelled');
      await loadMeetings();
      alert('Meeting ended');
    } catch (err) {
      console.error('Failed to end meeting:', err);
      const message = err.response?.data?.error || 'Unable to end meeting (are you the organizer?)';
      alert(message);
    }
  };

  const formatDateTime = (date) => {
    const meetingDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = meetingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (meetingDate.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (meetingDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${timeStr}`;
    } else {
      return `${meetingDate.toLocaleDateString()} at ${timeStr}`;
    }
  };

  if (!selectedCommunity) {
    return (
      <div className="meetings-panel">
        <div className="empty-state">
          <h3>📅 Meetings</h3>
          <p>Select a community to view meetings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meetings-panel">
      <div className="meetings-header">
        <h3>📅 Upcoming Meetings</h3>
        <button className="create-meeting-btn" onClick={() => setShowCreateModal(true)}>
          + Schedule Meeting
        </button>
      </div>

      <div className="meetings-list">
        {loading ? (
          <div className="loading">Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="empty-meetings">
            <p>No upcoming meetings</p>
            <p className="hint">Schedule one to get started!</p>
          </div>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting._id} className="meeting-card">
              <div className="meeting-header">
                <h4>{meeting.title}</h4>
                {/* compute status from startTime when server status seems wrong */}
                {(() => {
                  const now = new Date();
                  const start = meeting.startTime ? new Date(meeting.startTime) : null;
                  const computed = start && start > now ? 'scheduled' : meeting.status || 'scheduled';
                  return (
                    <span className={`meeting-status ${computed}`}>
                      {computed === 'scheduled' ? 'Scheduled' : computed.toUpperCase()}
                    </span>
                  );
                })()}
              </div>
              
              {meeting.description && (
                <p className="meeting-description">{meeting.description}</p>
              )}
              
              <div className="meeting-info">
                <div className="meeting-time">
                  🕐 {formatDateTime(meeting.startTime)}
                </div>
                <div className="meeting-organizer">
                  👤 Organized by {meeting.organizer?.username || 'Unknown'}
                </div>
                  {meeting.participants && meeting.participants.length > 0 && (
                    <div className="meeting-participants">
                      👥 {meeting.participants.length} participant(s)
                    </div>
                  )}
              </div>
              
                {(() => {
                  const now = new Date();
                  const start = meeting.startTime ? new Date(meeting.startTime) : null;
                  const isFuture = start && start > now;
                  return (
                    <>
                      <button
                        className="join-meeting-btn"
                        onClick={() => {
                          if (isFuture) {
                            // Open details modal for future meetings
                            handleOpenDetails(meeting);
                            return;
                          }
                          handleJoinMeeting(meeting._id, meeting.meetingLink);
                        }}
                        disabled={false}
                        title={isFuture ? 'View meeting details' : 'Join meeting'}
                      >
                        {isFuture ? '📅 View Details' : (meeting.status === 'ongoing' ? '🎥 Join Now' : '📅 View Details')}
                      </button>
                      <button
                        className="ghost-btn"
                        onClick={() => handleOpenDetails(meeting)}
                        style={{ marginLeft: 8 }}
                      >
                        Details
                      </button>

                      {user && (user._id === meeting.organizer?._id || user.id === meeting.organizer?._id) && (
                        <button
                          className="danger-btn"
                          style={{ marginLeft: 8 }}
                          onClick={() => handleEndMeeting(meeting._id)}
                        >
                          {meeting.status === 'ongoing' ? 'End Meeting' : 'Cancel Meeting'}
                        </button>
                      )}
                    </>
                  );
                })()}
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Meeting</h2>
              <button className="close-button" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateMeeting} className="modal-form">
              <div className="form-group">
                <label htmlFor="title">Meeting Title *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Team Standup, Project Review, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's this meeting about?"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="startTime">Start Time *</label>
                <div className="datetime-wrapper">
                  <input
                    type="text"
                    readOnly
                    id="startTime"
                    value={formData.startTime ? formatDateTime(formData.startTime) : ''}
                    placeholder="Select date & time"
                    onClick={openDatePicker}
                    className="datetime-input"
                    required
                  />
                  <button type="button" className="ghost-btn" onClick={openDatePicker} aria-label="Open date picker">📅</button>

                  {showDatePicker && (
                    <div className="date-picker-popover" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="datetime-local"
                        value={tempStart}
                        onChange={(e) => setTempStart(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <div className="popover-actions">
                        <button type="button" className="ghost-btn" onClick={cancelDatePicker}>Cancel</button>
                        <button type="button" className="primary-btn" onClick={saveDateFromPicker}>Save</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <div className="datetime-wrapper">
                  <input
                    type="text"
                    readOnly
                    id="endTime"
                    value={formData.endTime ? formatDateTime(formData.endTime) : ''}
                    placeholder="Select date & time"
                    onClick={openEndDatePicker}
                    className="datetime-input"
                  />
                  <button type="button" className="ghost-btn" onClick={openEndDatePicker} aria-label="Open date picker">📅</button>

                  {showEndDatePicker && (
                    <div className="date-picker-popover" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="datetime-local"
                        value={tempEnd}
                        onChange={(e) => setTempEnd(e.target.value)}
                        min={formData.startTime || new Date().toISOString().slice(0, 16)}
                      />
                      <div className="popover-actions">
                        <button type="button" className="ghost-btn" onClick={cancelEndDatePicker}>Cancel</button>
                        <button type="button" className="primary-btn" onClick={saveEndDateFromPicker}>Save</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reminder">Reminder</label>
                <select
                  id="reminder"
                  value={formData.reminder}
                  onChange={(e) => setFormData({ ...formData, reminder: e.target.value })}
                >
                  <option value="none">No reminder</option>
                  <option value="5">5 minutes before</option>
                  <option value="10">10 minutes before</option>
                  <option value="15">15 minutes before</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={handleSaveDraft}>
                  Save draft
                </button>
                <button type="button" className="cancel-button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="create-button">
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailMeeting && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{detailMeeting.title}</h2>
              <button className="close-button" onClick={closeDetails}>×</button>
            </div>

            <div className="modal-form" style={{ padding: 20 }}>
              <p className="meeting-description">{detailMeeting.description}</p>
              <div style={{ marginTop: 12 }}>
                <div>🕐 {formatDateTime(detailMeeting.startTime)}</div>
                <div>👤 Organized by {detailMeeting.organizer?.username || 'Unknown'}</div>
                <div>👥 {detailMeeting.participants?.length || 0} participant(s)</div>
              </div>

              <div className="modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="ghost-btn" onClick={() => downloadICS(detailMeeting)}>Add to calendar</button>
                <button type="button" className="cancel-button" onClick={closeDetails}>Close</button>
                {(() => {
                  const now = new Date();
                  const start = detailMeeting.startTime ? new Date(detailMeeting.startTime) : null;
                  const isFuture = start && start > now;
                  return (
                    <button
                      type="button"
                      className="create-button"
                      onClick={() => {
                        if (isFuture) {
                          alert('This meeting is scheduled for the future. You can join when it starts.');
                          return;
                        }
                        handleJoinMeeting(detailMeeting._id, detailMeeting.meetingLink);
                      }}
                    >
                      {isFuture ? 'View (Not started)' : (detailMeeting.status === 'ongoing' ? 'Join Now' : 'View')}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPanel;

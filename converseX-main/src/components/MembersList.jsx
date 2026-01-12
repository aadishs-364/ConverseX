import { useState, useEffect, useCallback } from 'react';
import { communityAPI } from '../services/api';
import './MembersList.css';

const MembersList = ({ selectedCommunity, compact = false }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const ACTIVE_STATUSES = ['online', 'busy', 'away', 'meeting'];
  const STATUS_LABELS = {
    online: 'Active now',
    busy: 'Busy',
    away: 'Away',
    meeting: 'In a meeting',
    offline: 'Offline',
  };

  const isActiveStatus = (status) => ACTIVE_STATUSES.includes(status);
  const getStatusLabel = (status) => STATUS_LABELS[status] || STATUS_LABELS.offline;

  const loadMembers = useCallback(async () => {
    if (!selectedCommunity) return;
    
    setLoading(true);
    try {
      const response = await communityAPI.getById(selectedCommunity._id);
      setMembers(response.data.community.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCommunity]);

  useEffect(() => {
    if (selectedCommunity) {
      loadMembers();
    }
  }, [selectedCommunity, loadMembers]);

  if (!selectedCommunity) {
    return compact ? null : (
      <div className="members-list">
        <div className="empty-state">
          <h3>👥 Members</h3>
          <p>Select a community to view members</p>
        </div>
      </div>
    );
  }

  const activeMembers = members.filter((m) => isActiveStatus(m.status));

  if (compact) {
    return (
      <div className="members-list compact">
        <div className="members-compact-header">
          <span className="members-compact-title">👥 Members</span>
          <span className="members-compact-count">{activeMembers.length} online</span>
        </div>
        <div className="members-compact-avatars">
          {activeMembers.slice(0, 5).map((member) => (
            <div key={member._id} className="compact-avatar-wrapper" title={member.username}>
              <img src={member.avatar} alt={member.username} className="compact-avatar" />
              <span className={`compact-status-dot ${member.status || 'offline'}`}></span>
            </div>
          ))}
          {activeMembers.length > 5 && (
            <div className="compact-avatar-overflow">+{activeMembers.length - 5}</div>
          )}
        </div>
      </div>
    );
  }

  const offlineMembers = members.filter((m) => !isActiveStatus(m.status));

  return (
    <div className="members-list">
      <div className="members-header">
        <h3>👥 Members</h3>
        <span className="members-count">{members.length} total</span>
      </div>

      <div className="members-content">
        {loading ? (
          <div className="loading">Loading members...</div>
        ) : (
          <>
            {activeMembers.length > 0 && (
              <div className="members-section">
                <div className="section-header">
                  <span className="status-indicator online"></span>
                  Active — {activeMembers.length}
                </div>
                {activeMembers.map((member) => (
                  <div key={member._id} className="member-item">
                    <div className="member-avatar-wrapper">
                      <img src={member.avatar} alt={member.username} className="member-avatar" />
                      <span
                        className={`status-dot ${member.status || 'offline'}`}
                        title={getStatusLabel(member.status)}
                      ></span>
                    </div>
                    <div className="member-info">
                      <span className="member-name">{member.username}</span>
                      <span className="member-status">{getStatusLabel(member.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {offlineMembers.length > 0 && (
              <div className="members-section">
                <div className="section-header">
                  <span className="status-indicator offline"></span>
                  Offline — {offlineMembers.length}
                </div>
                {offlineMembers.map((member) => (
                  <div key={member._id} className="member-item offline">
                    <div className="member-avatar-wrapper">
                      <img src={member.avatar} alt={member.username} className="member-avatar" />
                      <span
                        className={`status-dot ${member.status || 'offline'}`}
                        title={getStatusLabel(member.status)}
                      ></span>
                    </div>
                    <div className="member-info">
                      <span className="member-name">{member.username}</span>
                      <span className="member-status">{getStatusLabel(member.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MembersList;

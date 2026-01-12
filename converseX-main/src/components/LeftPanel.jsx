import { NavLink, useLocation } from 'react-router-dom';
import MeetingsPanel from './MeetingsPanel';
import './LeftPanel.css';

const tabs = [
  { id: 'home', label: 'Home', path: '/dashboard/home', icon: '🏠' },
  { id: 'meetings', label: 'Meetings', path: '/dashboard/meetings', icon: '📅' },
  { id: 'people', label: 'People', path: '/dashboard/people', icon: '👥' },
  { id: 'recordings', label: 'Recordings', path: '/dashboard/recordings', icon: '📼' },
  { id: 'room', label: 'Personal Room', path: '/dashboard/room', icon: '🎯' },
];

const LeftPanel = ({
  communities,
  selectedCommunity,
  channels,
  selectedChannel,
  onSelectCommunity,
  onSelectChannel,
  onCreateCommunity,
}) => {
  const location = useLocation();

  return (
    <aside className="left-panel" aria-label="Left navigation">
      {/* Add Community button at top */}
      <div className="left-panel-header">
        <h3 className="panel-section-title">Communities</h3>
        <button 
          className="add-community-btn" 
          onClick={onCreateCommunity}
          title="Create Community"
        >
          +
        </button>
      </div>

      <nav className="left-panel-tabs">
        <div className="tabs-row vertical">
          {tabs.map((t) => (
            <NavLink
              key={t.id}
              to={t.path}
              className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
            >
              <span className="tab-icon" aria-hidden>{t.icon}</span>
              <span className="tab-label">{t.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="tab-content">
          <div className="panel-route-content">
            {/* Home suboption: show community card similar to image 3 */}
            {location.pathname.startsWith('/dashboard/home') && (
              <div className="home-suboption">
                <h4 className="suboption-title">Communities</h4>
                <div className="community-card">
                  <div className="community-card-left">
                    {/* small icons column (reuse communities list) */}
                    <div className="community-icons">
                      {communities && communities.length > 0 ? (
                        communities.map((c) => (
                          <div
                            key={c._id}
                            className={`community-mini ${selectedCommunity?._id === c._id ? 'active' : ''}`}
                            onClick={() => onSelectCommunity(c)}
                            title={c.name}
                          >
                            {c.icon || '•'}
                          </div>
                        ))
                      ) : (
                        <div className="community-mini empty">+</div>
                      )}
                    </div>
                  </div>

                  <div className="community-card-main">
                    {selectedCommunity ? (
                      <>
                        <div className="community-card-header">
                          <h5>{selectedCommunity.name}</h5>
                        </div>

                        <div className="community-channels">
                          <div className="channels-title">Text channels</div>
                          {channels && channels.length > 0 ? (
                            channels
                              .filter((ch) => ch.type === 'text')
                              .map((ch) => (
                                <div key={ch._id} className="channel-preview">
                                  <div className="channel-glyph-small">{ch.name?.[0]?.toUpperCase()}</div>
                                  <div className="channel-meta">
                                    <div className="channel-name-small">{ch.name}</div>
                                    <div className="channel-desc-small">{ch.description || 'Discussion lounge'}</div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="no-channels">No channels</div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="no-selection">Select a community</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Meetings panel in left column when route matches */}
            {location.pathname.startsWith('/dashboard/meetings') && (
              <div className="panel-meetings">
                <div className="panel-heading">
                  <p className="rail-eyebrow">Schedule</p>
                  <h3>Meetings</h3>
                </div>
                <MeetingsPanel selectedCommunity={selectedCommunity} />
              </div>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default LeftPanel;

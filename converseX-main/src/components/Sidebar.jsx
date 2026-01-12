import './Sidebar.css';
import { getChannelIdentity } from '../utils/channelDisplay';

const Sidebar = ({
  communities,
  selectedCommunity,
  channels,
  selectedChannel,
  onSelectCommunity,
  onSelectChannel,
  onCreateCommunity,
}) => {
  return (
    <div className="sidebar">
      {/* Community List */}
      <div className="community-list">
        <div className="community-header">
          <h3>Communities</h3>
          <button className="icon-button" onClick={onCreateCommunity} title="Create Community">
            +
          </button>
        </div>
        <div className="community-items">
          {communities.length === 0 ? (
            <p className="empty-message">No communities yet. Create one!</p>
          ) : (
            communities.map((community) => (
              <div
                key={community._id}
                className={`community-item ${
                  selectedCommunity?._id === community._id ? 'active' : ''
                }`}
                onClick={() => onSelectCommunity(community)}
                title={community.name}
              >
                <span className="community-icon">{community.icon}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Channel List */}
      <div className="channel-list">
        {selectedCommunity ? (
          <>
            <div className="channel-header">
              <h2>{selectedCommunity.name}</h2>
            </div>
            <div className="channel-items">
              <div className="channel-category">
                <span className="channel-category-title">TEXT CHANNELS</span>
              </div>
              {channels.length === 0 ? (
                <p className="empty-message">No channels</p>
              ) : (
                channels
                  .filter((ch) => ch.type === 'text')
                  .map((channel) => {
                    const identity = getChannelIdentity(channel);
                    return (
                      <div
                        key={channel._id}
                        className={`channel-item ${
                          selectedChannel?._id === channel._id ? 'active' : ''
                        }`}
                        onClick={() => onSelectChannel(channel)}
                      >
                        <span className="channel-glyph" aria-hidden="true">
                          {identity.symbol}
                        </span>
                        <div className="channel-name-group">
                          <span className="channel-name">{identity.label}</span>
                          {identity.badge && (
                            <span className="channel-tagline">{identity.badge}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Select a community to view channels</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Sidebar;

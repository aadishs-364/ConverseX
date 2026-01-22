import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { communityAPI } from '../services/api';
import './Auth.css';

const JoinCommunity = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [community, setCommunity] = useState(null);

  useEffect(() => {
    const fetchCommunity = async () => {
      if (!isAuthenticated) {
        // Store the join link and redirect to login
        localStorage.setItem('pendingCommunityJoin', communityId);
        navigate('/login');
        return;
      }

      try {
        // Try to get community details
        const response = await communityAPI.getCommunity(communityId);
        setCommunity(response.data.community);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 403) {
          // User is not a member, try to join
          await joinCommunity();
        } else {
          setError('Community not found');
          setLoading(false);
        }
      }
    };

    fetchCommunity();
  }, [communityId, isAuthenticated, navigate]);

  const joinCommunity = async () => {
    try {
      setLoading(true);
      await communityAPI.joinCommunity(communityId);
      // Redirect to dashboard after successful join
      navigate('/dashboard', { state: { joinedCommunity: communityId } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join community');
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    await joinCommunity();
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading community...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-left-section">
          <div className="auth-card">
            <div className="auth-header">
              <div className="welcome-icon">❌</div>
              <h1>Error</h1>
              <p>{error}</p>
            </div>
            <button 
              className="submit-button" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (community) {
    return (
      <div className="auth-container">
        <div className="auth-left-section">
          <div className="auth-card">
            <div className="auth-header">
              <div className="welcome-icon">{community.icon || '🌐'}</div>
              <h1>Join {community.name}</h1>
              <p>{community.description || 'Join this community to start chatting'}</p>
            </div>
            <div className="form-group">
              <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                You've been invited to join <strong>{community.name}</strong>
              </p>
            </div>
            <button 
              className="submit-button" 
              onClick={handleJoin}
            >
              Join Community
            </button>
            <button 
              className="submit-button" 
              style={{ background: 'transparent', border: '1px solid #666', marginTop: '10px' }}
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinCommunity;

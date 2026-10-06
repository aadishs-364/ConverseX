const SPECIAL_CHANNELS = {
  general: {
    label: 'Discussion Deck',
    symbol: '🚀',
    tagline: 'Where conversations spark momentum.',
    badge: 'DISCUSSION LOUNGE'
  }
};

export const getChannelIdentity = (channel) => {
  if (!channel) {
    return {
      label: 'Channel',
      symbol: '✦',
      tagline: 'Collaborate with your team here.',
      badge: 'TEAM SPACE'
    };
  }

  const key = channel.name?.toLowerCase?.();
  const special = key && SPECIAL_CHANNELS[key];

  return {
    label: special?.label || channel.displayName || channel.name,
    symbol: special?.symbol || '◎',
    tagline: special?.tagline || channel.description || 'Share updates, wins, and next steps together.',
    badge: special?.badge || 'TEXT SPACE'
  };
};

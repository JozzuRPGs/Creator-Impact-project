// Lightweight wrapper around Ably Realtime (loaded via CDN in index.html)
// Exposes connect(room), onEvent, and publish(type, payload)

const Remote = (() => {
  const state = { client: null, channel: null, room: null };

  const connect = async (room) => {
    if (!window.Ably) throw new Error('Ably SDK not loaded');
    if (state.channel) await disconnect();
    const client = new Ably.Realtime.Promise({ authUrl: '/api/ably-token' });
    await client.connection.once('connected');
    const channelName = `creatorclash-${room}`;
    const channel = client.channels.get(channelName);
    state.client = client; state.channel = channel; state.room = room;
    return channelName;
  };

  const disconnect = async () => {
    try {
      if (state.channel) { await state.channel.detach().catch(() => {}); }
      if (state.client) { await state.client.close().catch(() => {}); }
    } finally {
      state.channel = null; state.client = null; state.room = null;
    }
  };

  const subscribe = async (handler) => {
    if (!state.channel) throw new Error('No channel');
    await state.channel.subscribe((msg) => {
      try {
        const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
        handler && handler(data, msg);
      } catch (e) {
        // ignore parse errors
      }
    });
  };

  const publish = async (type, payload = {}) => {
    if (!state.channel) throw new Error('No channel');
    const data = { type, payload, t: Date.now() };
    await state.channel.publish(type, data);
  };

  return { connect, disconnect, subscribe, publish, _state: state };
})();

export default Remote;

// Singleton that holds the WebSocket server instance.
// Controllers import `broadcast()` from here — no circular imports.
let _wss = null;

export const setWss = (wss) => {
  _wss = wss;
};

export const broadcast = (data) => {
  if (!_wss) return;
  const msg = JSON.stringify(data);
  _wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg); // 1 = OPEN
  });
};

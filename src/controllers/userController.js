export const me = async (req, res) => {
  const authStatus = {
    authenticated: req.isAuthenticated() || !!req.user,
    sessionID: req.sessionID,
    hasSession: !!req.session,
    user: req.user || null,
    timestamp: new Date().toISOString(),
  };

  if (authStatus.authenticated) {
    return res.json({
      success: true,
      ...authStatus,
    });
  }

  return res.status(401).json({
    success: false,
    ...authStatus,
    message: 'Not authenticated',
  });
};

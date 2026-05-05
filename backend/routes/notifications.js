const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications — fetch user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) {
      // Table may not exist yet — return empty gracefully
      if (error.message?.includes('notifications')) {
        return res.json({ notifications: [], unread: 0 });
      }
      throw error;
    }
    const unread = (data || []).filter(n => !n.read).length;
    res.json({ notifications: data || [], unread });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user.id)
      .eq('read', false);
    if (error) throw error;
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id — delete one
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/send — internal helper to create a notification
// Used by other routes (assignments, payments, attendance)
router.post('/send', authenticate, async (req, res) => {
  try {
    const { user_id, title, message, type, link } = req.body;
    await createNotification({ user_id, title, message, type, link });
    res.json({ message: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// ── Exported helper used by other routes ──────────────────────────────────────
async function createNotification({ user_id, title, message, type = 'info', link = null }) {
  try {
    await supabase.from('notifications').insert([{
      user_id, title, message, type, link, read: false
    }]);
  } catch (e) {
    // non-fatal — don't break the main operation
  }
}

module.exports.createNotification = createNotification;

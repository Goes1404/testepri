const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/notifications - List all notifications for current user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ notifications: notifications || [] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: updatedNotification, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json(updatedNotification);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: updatedNotifications, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      message: 'Todas as notificações marcadas como lidas.',
      count: updatedNotifications ? updatedNotifications.length : 0
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

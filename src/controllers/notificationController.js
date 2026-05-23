import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getMyNotifications = asyncHandler(async (req, res, next) => {
  const result = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
});

export const markAsRead = asyncHandler(async (req, res, next) => {
  await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.status(200).json({ success: true, message: 'Notification marked as read' });
});

export const createNotification = async (userId, type, title, message) => {
  await query(
    'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
    [userId, type, title, message]
  );
};

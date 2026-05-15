import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/APIError.js';

export const getMyRooms = asyncHandler(async (req, res, next) => {
  // Simple rooms list for now
  const result = await query(`
    SELECT cr.*, 
    (SELECT text FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM chat_rooms cr
  `);
  res.status(200).json({ success: true, data: result.rows });
});

export const getMessages = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const result = await query(
    'SELECT cm.*, u.name as sender_name FROM chat_messages cm JOIN users u ON cm.sender_id = u.id WHERE room_id = $1 ORDER BY cm.created_at ASC',
    [roomId]
  );
  res.status(200).json({ success: true, data: result.rows });
});

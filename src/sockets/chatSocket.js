import { query } from '../config/db.js';

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_room', (roomId) => {
      socket.join(`room_${roomId}`);
    });

    socket.on('send_message', async (data) => {
      const { room_id, sender_id, text } = data;
      try {
        const result = await query(
          'INSERT INTO chat_messages (room_id, sender_id, text) VALUES ($1, $2, $3) RETURNING *',
          [room_id, sender_id, text]
        );
        const newMessage = result.rows[0];
        io.to(`room_${room_id}`).emit('receive_message', newMessage);
      } catch (err) {
        console.error('Socket Message Error:', err);
      }
    });
  });
};

export default chatSocket;

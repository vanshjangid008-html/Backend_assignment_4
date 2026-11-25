const appEvents = require('../events/appEvents');

const initializeChatSocket = (io) => {
  io.on('connection', (socket) => {
    // Log user connection exactly matching assignment Fig 3
    console.log(`User connected: ${socket.id}`);

    // Automatically join default room or wait for join event
    socket.on('join_room', (data) => {
      const room = typeof data === 'string' ? data : (data && data.room) || 'general';
      const username = (data && data.username) || socket.id;

      socket.join(room);
      socket.currentRoom = room;
      socket.username = username;

      // Log room join matching assignment Fig 3
      console.log(`${socket.id} joined room ${room}`);

      // Broadcast room join notification to room members
      io.to(room).emit('user_joined', {
        userId: socket.id,
        username,
        room,
        timestamp: new Date().toISOString()
      });
    });

    // Also support alias 'join'
    socket.on('join', (roomName) => {
      socket.join(roomName || 'general');
      socket.currentRoom = roomName || 'general';
      console.log(`${socket.id} joined room ${roomName || 'general'}`);
    });

    // Handle incoming chat messages
    socket.on('send_message', (data) => {
      const room = data.room || socket.currentRoom || 'general';
      const username = data.username || socket.username || 'Anonymous';
      const message = data.message || '';

      // Log chat message matching assignment Fig 3: [general] Aditi: Hey team...
      console.log(`[${room}] ${username}: ${message}`);

      // Emit through Node.js EventEmitter for event-driven backend integration
      appEvents.emit('chat:message', { room, username, message });

      // Broadcast message to everyone in the room
      io.to(room).emit('receive_message', {
        id: socket.id,
        room,
        username,
        message,
        timestamp: new Date().toISOString()
      });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (socket.currentRoom) {
        io.to(socket.currentRoom).emit('user_left', {
          userId: socket.id,
          username: socket.username || socket.id,
          room: socket.currentRoom
        });
      }
    });
  });
};

module.exports = initializeChatSocket;

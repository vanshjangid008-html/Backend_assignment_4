const EventEmitter = require('events');

class AppEventEmitter extends EventEmitter {}

const appEvents = new AppEventEmitter();

// Event listeners for audit logging and event-driven features
appEvents.on('user:registered', (data) => {
  console.log(`[event:user:registered] New user registered -> id: ${data.id || data._id}, username: ${data.username}, email: ${data.email}`);
});

appEvents.on('user:login', (data) => {
  console.log(`[event:user:login] User logged in -> id: ${data.id || data._id}, username: ${data.username}`);
});

appEvents.on('note:created', (data) => {
  console.log(`[event:note:created] Note created -> id: ${data._id}, title: "${data.title}", owner: ${data.owner}`);
});

appEvents.on('note:updated', (data) => {
  console.log(`[event:note:updated] Note updated -> id: ${data._id}, title: "${data.title}"`);
});

appEvents.on('note:deleted', (data) => {
  console.log(`[event:note:deleted] Note deleted -> id: ${data._id}`);
});

appEvents.on('chat:message', (data) => {
  console.log(`[event:chat:message] [${data.room}] ${data.username}: ${data.message}`);
});

module.exports = appEvents;

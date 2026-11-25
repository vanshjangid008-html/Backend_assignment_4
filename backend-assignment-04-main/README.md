# i7Lab 4: Secure Connect and Communication Platform

> **Course:** Web Dev III  
> **Unit Covered:** Unit – 4  
> **Marks:** 2.5 / 2.5  
> **Mode:** 100% In-Class (Lab Practicals)

A secure backend system and real-time communication platform built with Node.js, Express, JWT, bcrypt, Socket.IO, EventEmitter, and MongoDB (with local storage fallback).

---

## 📋 Features & Learning Objectives

1. **Authentication & Password Security:**
   - User Registration (`POST /api/auth/signup`) with `bcrypt` salt hashing (10 rounds).
   - User Login (`POST /api/auth/login`) with credential verification and signed JWT token issuance.
2. **Stateless JWT Sessions & Authorization:**
   - Protected route middleware (`protect`) verifying Bearer tokens and cookies.
   - Unauthorized attempts without token return `403 Forbidden` (`{"message": "No token provided"}`).
   - Invalid or expired tokens return `401 Unauthorized` (`{"message": "Invalid or expired token"}`).
3. **Role-Based Access Control (RBAC):**
   - Role management (`user` vs `admin`).
   - Admin route access control (`authorize('admin')`).
4. **Secure Notes API (CRUD):**
   - `POST /api/notes` - Create personal note linked to authenticated owner.
   - `GET /api/notes` - List user-specific notes (or all notes for admin).
   - `GET /api/notes/:id` - Fetch single note with owner authorization check.
   - `PUT /api/notes/:id` - Update note with ownership validation.
   - `DELETE /api/notes/:id` - Delete note with ownership validation.
5. **Real-Time Communication (Socket.IO):**
   - Room-based bidirectional chat (`join_room`, `send_message`, `receive_message`).
   - Formatted server-side console logging matching assignment specifications:
     ```text
     User connected: <socketId>
     <socketId> joined room general
     [general] Aditi: Hey team, backend is ready 🚀
     [general] Rohan: Testing chat now...
     [general] Aditi: Messages arriving in real time ⚡
     ```
6. **Event-Driven Architecture (Node.js EventEmitter):**
   - Centralized `appEvents` emitting domain events:
     - `user:registered`
     - `user:login`
     - `note:created`
     - `note:updated`
     - `note:deleted`
     - `chat:message`
7. **Zero-Configuration Dual Persistence:**
   - Seamlessly connects to MongoDB if available.
   - Automatically falls back to persistent local storage with 24-character hexadecimal IDs if MongoDB is absent.

---

## 🛠️ Technology Stack

- **Node.js** – Server-side JavaScript runtime
- **Express.js** – Web framework and API routing
- **jsonwebtoken (JWT)** – Stateless authentication tokens
- **bcrypt / bcryptjs** – One-way cryptographic password hashing
- **Socket.IO** – Real-time event-driven bidirectional WebSocket communication
- **events (EventEmitter)** – Decoupled event-driven backend lifecycle triggers
- **dotenv** – Environment configuration management
- **MongoDB / Mongoose** – Data persistence (with local fallback store)

---

## 📂 Project Structure

```text
Assignment - 4/
├── config/
│   └── db.js                 # Database connection & persistence adapter
├── controllers/
│   ├── authController.js     # Signup, login, profile, RBAC controllers
│   └── noteController.js     # Notes CRUD controllers
├── events/
│   └── appEvents.js          # Node.js EventEmitter setup and listeners
├── middleware/
│   └── authMiddleware.js     # JWT verification & RBAC authorization
├── models/
│   ├── User.js               # User repository & Mongoose schema
│   └── Note.js               # Note repository & Mongoose schema
├── public/
│   └── index.html            # Interactive web client for testing all features
├── routes/
│   ├── authRoutes.js         # /api/auth routes
│   └── noteRoutes.js         # /api/notes routes
├── sockets/
│   └── chatSocket.js         # Socket.IO connection & room handler
├── .env                      # Environment variables
├── .env.example              # Example environment template
├── package.json              # Project metadata & dependencies
├── server.js                 # Application entry point
└── test-suite.js             # Automated 10/10 test suite
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create or verify `.env`:
```env
PORT=5000
JWT_SECRET=webdev3_jwt_secret_key_2026_super_secure
JWT_EXPIRES_IN=24h
MONGO_URI=mongodb://localhost:27017/secure_platform
NODE_ENV=development
```

### 3. Start the Server
```bash
npm start
```
Console output:
```text
[server] listening on http://localhost:5000
```

### 4. Interactive Web Client
Open your browser to:
```text
http://localhost:5000
```
This UI allows you to test:
- User signup and login
- JWT token handling
- Protected Notes CRUD operations
- Live multi-user room chat via Socket.IO
- Testing 403 Forbidden without token

---

## 📡 API Reference & Expected Output

### 1. User Signup
**Request:**
```http
POST /api/auth/signup HTTP/1.1
Content-Type: application/json

{
  "username": "victor",
  "email": "victor@example.com",
  "password": "password123"
}
```
**Response (201 Created):**
```json
{
  "message": "User registered",
  "id": "f7cbca9b1af2a98e4bf03131",
  "username": "victor",
  "email": "victor@example.com"
}
```

---

### 2. User Login
**Request:**
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "victor@example.com",
  "password": "password123"
}
```
**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Access Protected Route Without Token
**Request:**
```http
GET /api/notes HTTP/1.1
```
**Response (403 Forbidden):**
```json
{
  "message": "No token provided"
}
```

---

### 4. Create Note (Authenticated)
**Request:**
```http
POST /api/notes HTTP/1.1
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "title": "My First Note",
  "content": "This is my first note of web dev -III"
}
```
**Response (201 Created):**
```json
{
  "_id": "b58b58fcc962dd6f6adebd3b",
  "title": "My First Note",
  "content": "This is my first note of web dev -III",
  "owner": "f7cbca9b1af2a98e4bf03131",
  "createdAt": "2026-07-10T10:02:50.134Z",
  "updatedAt": "2026-07-10T10:02:50.135Z"
}
```

---

### 5. Fetch Notes (Authenticated)
**Request:**
```http
GET /api/notes HTTP/1.1
Authorization: Bearer <jwt_token>
```
**Response (200 OK):**
```json
[
  {
    "_id": "b58b58fcc962dd6f6adebd3b",
    "title": "My First Note",
    "content": "This is my first note of web dev -III",
    "owner": "f7cbca9b1af2a98e4bf03131",
    "createdAt": "2026-07-10T10:02:50.134Z",
    "updatedAt": "2026-07-10T10:02:50.135Z"
  }
]
```

---

## 💬 Real-Time Chat (Socket.IO)

### Socket Events:
| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_room` | Client ➔ Server | `{ room: 'general', username: 'Aditi' }` | Joins a chat room |
| `send_message` | Client ➔ Server | `{ room: 'general', username: 'Aditi', message: '...' }` | Sends message to room |
| `receive_message` | Server ➔ Room Clients | `{ room, username, message, timestamp }` | Broadcasts message to room |

### Server Console Output (Figure 3):
```text
$ node server.js
[server] listening on http://localhost:5000
User connected: sK92_xT31Qp
sK92_xT31Qp joined room general
User connected: pL04_vB88Rk
pL04_vB88Rk joined room general

[general] Aditi: Hey team, backend is ready 🚀
[general] Rohan: Testing chat now...
[general] Aditi: Messages arriving in real time ⚡
```

---

## 🧪 Automated Testing

Run the automated test suite:
```bash
npm test
```
The test suite starts or tests against the running server, executing 10 automated integration tests covering signup, login, 403 unauthorized checks, CRUD operations on notes, and real-time Socket.IO chat sequence validation.

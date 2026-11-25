const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let isConnectedToMongo = false;
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const usersFile = path.join(dataDir, 'users.json');
const notesFile = path.join(dataDir, 'notes.json');

if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
if (!fs.existsSync(notesFile)) fs.writeFileSync(notesFile, JSON.stringify([], null, 2));

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/secure_platform';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    isConnectedToMongo = true;
    console.log(`[database] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    isConnectedToMongo = false;
    console.log('[database] MongoDB connection unavailable. Falling back to local persistent JSON store.');
  }
};

const readLocalData = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeLocalData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const generateObjectId = () => {
  return crypto.randomBytes(12).toString('hex');
};

module.exports = {
  connectDB,
  isMongo: () => isConnectedToMongo,
  readLocalData,
  writeLocalData,
  usersFile,
  notesFile,
  generateObjectId
};

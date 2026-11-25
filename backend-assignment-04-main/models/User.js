const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isMongo, readLocalData, writeLocalData, usersFile, generateObjectId } = require('../config/db');

// Mongoose Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongoUser = mongoose.model('User', userSchema);

// Unified User repository supporting both MongoDB & local persistence
class UserRepository {
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  static async comparePassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }

  static async findByEmail(email) {
    if (isMongo()) {
      return await MongoUser.findOne({ email: email.toLowerCase() });
    }
    const users = readLocalData(usersFile);
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async findById(id) {
    if (isMongo()) {
      return await MongoUser.findById(id);
    }
    const users = readLocalData(usersFile);
    return users.find((u) => u._id === id || u.id === id) || null;
  }

  static async find(filter = {}) {
    if (isMongo()) {
      return await MongoUser.find(filter).select('-password');
    }
    const users = readLocalData(usersFile);
    return users.map(({ password, ...u }) => u);
  }

  static async create({ username, email, password, role = 'user' }) {
    if (isMongo()) {
      const user = await MongoUser.create({
        username,
        email: email.toLowerCase(),
        password,
        role
      });
      return user;
    }

    const users = readLocalData(usersFile);
    const hashedPassword = await this.hashPassword(password);
    const now = new Date().toISOString();
    const newUser = {
      _id: generateObjectId(),
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      createdAt: now,
      updatedAt: now
    };
    users.push(newUser);
    writeLocalData(usersFile, users);
    return newUser;
  }
}

module.exports = UserRepository;

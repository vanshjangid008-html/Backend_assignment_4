const mongoose = require('mongoose');
const { isMongo, readLocalData, writeLocalData, notesFile, generateObjectId } = require('../config/db');

// Mongoose Schema
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const MongoNote = mongoose.model('Note', noteSchema);

// Unified Note repository supporting MongoDB and local storage
class NoteRepository {
  static async find(filter = {}) {
    if (isMongo()) {
      return await MongoNote.find(filter).sort({ createdAt: -1 });
    }
    const notes = readLocalData(notesFile);
    return notes.filter((note) => {
      for (const key in filter) {
        if (note[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  static async findById(id) {
    if (isMongo()) {
      return await MongoNote.findById(id);
    }
    const notes = readLocalData(notesFile);
    return notes.find((n) => n._id === id || n.id === id) || null;
  }

  static async create({ title, content, owner }) {
    if (isMongo()) {
      return await MongoNote.create({ title, content, owner });
    }
    const notes = readLocalData(notesFile);
    const now = new Date().toISOString();
    const newNote = {
      _id: generateObjectId(),
      title,
      content,
      owner: owner.toString(),
      createdAt: now,
      updatedAt: now
    };
    notes.push(newNote);
    writeLocalData(notesFile, notes);
    return newNote;
  }

  static async findByIdAndUpdate(id, updateData) {
    if (isMongo()) {
      return await MongoNote.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }
    const notes = readLocalData(notesFile);
    const index = notes.findIndex((n) => n._id === id || n.id === id);
    if (index === -1) return null;

    notes[index] = {
      ...notes[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    writeLocalData(notesFile, notes);
    return notes[index];
  }

  static async findByIdAndDelete(id) {
    if (isMongo()) {
      return await MongoNote.findByIdAndDelete(id);
    }
    const notes = readLocalData(notesFile);
    const index = notes.findIndex((n) => n._id === id || n.id === id);
    if (index === -1) return null;

    const [deleted] = notes.splice(index, 1);
    writeLocalData(notesFile, notes);
    return deleted;
  }
}

module.exports = NoteRepository;

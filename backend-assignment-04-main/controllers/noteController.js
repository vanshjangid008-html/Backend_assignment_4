const Note = require('../models/Note');
const appEvents = require('../events/appEvents');

// @desc    Get all notes for authenticated user (or all notes if admin)
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== 'admin') {
      filter.owner = req.user.id;
    }

    const notes = await Note.find(filter);
    return res.status(200).json(notes);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving notes', error: error.message });
  }
};

// @desc    Get single note by ID
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const noteOwner = note.owner ? note.owner.toString() : '';
    if (noteOwner !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to view this note' });
    }

    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving note', error: error.message });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Please provide both title and content' });
    }

    const newNote = await Note.create({
      title,
      content,
      owner: req.user.id
    });

    // Emit event for event-driven logging
    appEvents.emit('note:created', newNote);

    return res.status(201).json(newNote);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating note', error: error.message });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const noteOwner = note.owner ? note.owner.toString() : '';
    if (noteOwner !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to update this note' });
    }

    const { title, content } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const updatedNote = await Note.findByIdAndUpdate(req.params.id, updateData);

    // Emit event
    appEvents.emit('note:updated', updatedNote);

    return res.status(200).json(updatedNote);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating note', error: error.message });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const noteOwner = note.owner ? note.owner.toString() : '';
    if (noteOwner !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this note' });
    }

    const deleted = await Note.findByIdAndDelete(req.params.id);

    // Emit event
    appEvents.emit('note:deleted', deleted || { _id: req.params.id });

    return res.status(200).json({ message: 'Note deleted successfully', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
};

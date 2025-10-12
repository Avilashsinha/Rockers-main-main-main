// Simple in-memory store
let notesStore = [];

export function getNotes() {
  try {
    return notesStore.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error in getNotes:', error);
    return [];
  }
}

export function addNote(note) {
  try {
    notesStore.push(note);
    console.log('Note added:', note.title, 'Total notes:', notesStore.length);
    return note;
  } catch (error) {
    console.error('Error in addNote:', error);
    return null;
  }
}

export function deleteNote(id) {
  try {
    const noteIndex = notesStore.findIndex(note => note.id === id);
    if (noteIndex === -1) {
      return null;
    }
    const note = notesStore[noteIndex];
    notesStore.splice(noteIndex, 1);
    return note;
  } catch (error) {
    console.error('Error in deleteNote:', error);
    return null;
  }
}

export function findNote(id) {
  try {
    return notesStore.find(note => note.id === id);
  } catch (error) {
    console.error('Error in findNote:', error);
    return null;
  }
}
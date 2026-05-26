/**
 * Firestore Service
 * Handles all Firestore database operations for StudyGenie AI
 */

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: Date;
  bio?: string;
}

export interface ChatHistory {
  id: string;
  userId: string;
  message: string;
  response: string;
  createdAt: Date;
}

/**
 * Save user profile to Firestore
 */
export const saveUserProfile = async (userProfile: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, "users", userProfile.uid!);
    await setDoc(
      userRef,
      {
        ...userProfile,
        createdAt: Timestamp.now(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDocs(collection(db, "users"));
    const userSnapshot = userDoc.docs.find((doc) => doc.id === userId);

    if (userSnapshot) {
      return {
        ...(userSnapshot.data() as UserProfile),
      };
    }
    throw new Error("User not found");
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

/**
 * Add a new note
 */
export const addNote = async (
  userId: string,
  title: string,
  content: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "notes"), {
      userId,
      title,
      content,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding note:", error);
    throw error;
  }
};

/**
 * Get all notes for a user
 */
export const getUserNotes = async (userId: string): Promise<Note[]> => {
  try {
    const q = query(collection(db, "notes"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const notes: Note[] = [];
    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...(doc.data() as Omit<Note, "id">),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      });
    });

    return notes.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error("Error getting user notes:", error);
    throw error;
  }
};

/**
 * Update a note
 */
export const updateNote = async (
  noteId: string,
  title: string,
  content: string
): Promise<void> => {
  try {
    const noteRef = doc(db, "notes", noteId);
    await updateDoc(noteRef, {
      title,
      content,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating note:", error);
    throw error;
  }
};

/**
 * Delete a note
 */
export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "notes", noteId));
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};

/**
 * Save chat history
 */
export const saveChatHistory = async (
  userId: string,
  message: string,
  response: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "chatHistory"), {
      userId,
      message,
      response,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving chat history:", error);
    throw error;
  }
};

/**
 * Get chat history for a user
 */
export const getChatHistory = async (userId: string): Promise<ChatHistory[]> => {
  try {
    const q = query(
      collection(db, "chatHistory"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    const history: ChatHistory[] = [];
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...(doc.data() as Omit<ChatHistory, "id">),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      });
    });

    return history.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error getting chat history:", error);
    throw error;
  }
};

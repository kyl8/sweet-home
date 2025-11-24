import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  query,
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';

const validateUserOwnership = (data, userId) => {
  if (!userId || data.userId !== userId) {
    throw new Error('Unauthorized: User does not own this resource');
  }
};

export const firestoreService = {
  addDocument: async (collectionName, data, userId) => {
    try {
      const docData = {
        ...data,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      logger.info(`Documento adicionado para ${collectionName}`, { docId: docRef.id });
      return { id: docRef.id, ...docData };
    } catch (error) {
      logger.error(`Falha ao adicionar documento para ${collectionName}`, { error: error.message });
      throw error;
    }
  },

  updateDocument: async (collectionName, docId, data, userId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      await updateDoc(docRef, updateData);
      logger.info(`Documento atualizado em ${collectionName}`, { docId });
      return { id: docId, ...updateData };
    } catch (error) {
      logger.error(`Falha ao atualizar documento em ${collectionName}`, { error: error.message });
      throw error;
    }
  },

  deleteDocument: async (collectionName, docId, userId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      logger.info(`Documento deletado de ${collectionName}`, { docId });
    } catch (error) {
      logger.error(`Falha ao deletar documento de ${collectionName}`, { error: error.message });
      throw error;
    }
  },

  subscribeToCollection: (collectionName, callback, errorCallback) => {
    try {
      return onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(data);
        },
        (error) => {
          logger.error(`Erro ao escutar ${collectionName}`, { error: error.message });
          errorCallback(error);
        }
      );
    } catch (error) {
      logger.error(`Falha ao assinar ${collectionName}`, { error: error.message });
      throw error;
    }
  },

  getDocuments: async (collectionName) => {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error(`Falha ao buscar documentos de ${collectionName}`, { error: error.message });
      throw error;
    }
  }
};

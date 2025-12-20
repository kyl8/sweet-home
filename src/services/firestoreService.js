import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  serverTimestamp,
  setDoc, 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';
import { offlineStorageService } from './offlineStorageService';

const cleanUndefinedFields = (data) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

export const firestoreService = {
  addDocument: async (collectionName, data, userId) => {
    try {
      if (collectionName === FIRESTORE_COLLECTIONS.SALES) {
        if (!data.items || data.items.length === 0) {
          logger.error('Tentativa de salvar venda sem itens', { data });
          throw new Error('Venda deve conter ao menos um item');
        }
        if (!data.totalAmount || data.totalAmount <= 0) {
          logger.error('Tentativa de salvar venda com total inválido', { totalAmount: data.totalAmount });
          throw new Error('Total da venda deve ser maior que zero');
        }
        if (!data.operatorId || !data.operatorName) {
          logger.error('Tentativa de salvar venda sem operador', { data });
          throw new Error('Operador não identificado na venda');
        }
      }
      
      if (!data.name && !data.sweetName && !data.payer && !data.receiver && !data.items) {
        logger.error('Tentativa de salvar documento sem dados essenciais', { data });
        throw new Error('Dados insuficientes para criar documento');
      }

      const cleanedData = cleanUndefinedFields(data);
      
      const docData = {
        ...cleanedData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      
      await offlineStorageService.saveToStore(collectionName, { 
        id: docRef.id, 
        ...cleanedData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      logger.info(`Documento adicionado`, { collectionName, docId: docRef.id });
      return { id: docRef.id, ...cleanedData };
    } catch (error) {
      logger.error(`Falha ao adicionar documento`, { 
        collectionName,
        error: error.message
      });
      const shouldQueue = (error) => {
        const msg = (error?.message || '').toLowerCase();
        return msg.includes('network') || msg.includes('offline') || msg.includes('unavailable');
      };
      if (shouldQueue(error)) {
        const cleanedData = cleanUndefinedFields(data);
        await offlineStorageService.addPendingOperation({
          type: 'add',
          collection: collectionName,
          action: 'add',
          data: { ...cleanedData, userId }
        });
      }
      throw error;
    }
  },

  updateDocument: async (collectionName, docId, data, userId) => {
    try {
      const normalizedId = String(docId);
      const docRef = doc(db, collectionName, normalizedId);
      
      const cleanedData = cleanUndefinedFields(data);
      const updateData = {
        ...cleanedData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      const existingDoc = await offlineStorageService.getFromStore(collectionName, normalizedId);
      const updatedDoc = { 
        ...existingDoc, 
        ...cleanedData,
        id: normalizedId,
        updatedAt: new Date().toISOString()
      };
      await offlineStorageService.saveToStore(collectionName, updatedDoc);
      
      logger.info(`Documento atualizado`, { collectionName, docId: normalizedId });
      return { id: normalizedId, ...updatedDoc };
    } catch (error) {
      logger.error(`Falha ao atualizar documento`, { 
        collectionName,
        error: error.message 
      });
      const shouldQueue = (error) => {
        const msg = (error?.message || '').toLowerCase();
        return msg.includes('network') || msg.includes('offline') || msg.includes('unavailable');
      };
      if (shouldQueue(error)) {
        const cleanedData = cleanUndefinedFields(data);
        await offlineStorageService.addPendingOperation({
          type: 'update',
          collection: collectionName,
          action: 'update',
          data: { id: String(docId), ...cleanedData }
        });
      }
      throw error;
    }
  },

  deleteDocument: async (collectionName, docId, userId) => {
    try {
      const normalizedId = String(docId);
      const docRef = doc(db, collectionName, normalizedId);
      await deleteDoc(docRef);
      
      await offlineStorageService.deleteFromStore(collectionName, normalizedId);
      
      logger.info(`Documento deletado de ${collectionName}`, { docId: normalizedId });
    } catch (error) {
      logger.error(`Falha ao deletar documento de ${collectionName}`, { error: error.message });
      const shouldQueue = (error) => {
        const msg = (error?.message || '').toLowerCase();
        return msg.includes('network') || msg.includes('offline') || msg.includes('unavailable');
      };
      if (shouldQueue(error)) {
        await offlineStorageService.addPendingOperation({
          type: 'delete',
          collection: collectionName,
          action: 'delete',
          data: { id: String(docId) }
        });
      }
      throw error;
    }
  },

  subscribeToCollection: (collectionName, callback, errorCallback) => {
    if (!db) {
      logger.error('Firestore não inicializado');
      errorCallback(new Error('Firestore indisponível'));
      return () => {};
    }
    try {
      return onSnapshot(
        collection(db, collectionName),
        async (snapshot) => {
          const validDocs = snapshot.docs
            .map(doc => ({ id: doc.id, ...cleanUndefinedFields(doc.data()) }))
            .filter(doc => {
              if (!doc.id || doc.id === 'undefined' || doc.id === 'null') {
                logger.warn('Documento sem ID encontrado no Firestore', { 
                  collection: collectionName 
                });
                return false;
              }
              return true;
            });
          
          await Promise.all(validDocs.map(item => 
            offlineStorageService.saveToStore(collectionName, item)
          ));
          
          callback(validDocs);
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
    if (!db) {
      logger.error('Firestore não inicializado para getDocuments');
      return await offlineStorageService.getAllFromStore(collectionName);
    }
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...cleanUndefinedFields(doc.data()) }));
      
      await Promise.all(data.map(item => 
        offlineStorageService.saveToStore(collectionName, item)
      ));
      
      return data;
    } catch (error) {
      logger.error(`Falha ao buscar documentos de ${collectionName}`, { error: error.message });
      return await offlineStorageService.getAllFromStore(collectionName);
    }
  },

  upsertDocument: async (collectionName, docId, data, userId) => {
    try {
      if (!docId) {
        throw new Error('ID do documento não fornecido');
      }

      const normalizedId = String(docId);
      
      logger.info('Iniciando upsert', { 
        collection: collectionName,
        docId: normalizedId,
        docIdOriginal: docId
      });
      
      const docRef = doc(db, collectionName, normalizedId);
      const cleanedData = cleanUndefinedFields(data);
      const upsertData = {
        ...cleanedData,
        userId,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, upsertData, { merge: true });
      
      const existingDoc = await offlineStorageService.getFromStore(collectionName, normalizedId);
      const mergedOffline = { 
        ...(existingDoc || {}), 
        ...cleanedData, 
        id: normalizedId, 
        updatedAt: new Date().toISOString(), 
        userId 
      };
      await offlineStorageService.saveToStore(collectionName, mergedOffline);
      
      logger.info(`Documento upsert em ${collectionName}`, { docId: normalizedId });
      return { id: normalizedId, ...mergedOffline };
    } catch (error) {
      logger.error(`Falha no upsert em ${collectionName}`, { 
        error: error.message,
        docId,
        stack: error.stack 
      });
      
      const shouldQueue = (error) => {
        const msg = (error?.message || '').toLowerCase();
        return msg.includes('network') || msg.includes('offline') || msg.includes('unavailable');
      };
      
      if (shouldQueue(error)) {
        const cleanedData = cleanUndefinedFields(data);
        await offlineStorageService.addPendingOperation({
          type: 'update',
          collection: collectionName,
          action: 'update',
          data: { id: String(docId), ...cleanedData }
        });
      }
      
      throw error;
    }
  },
};

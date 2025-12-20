import { openDB } from 'idb';
import { logger } from '../utils/logger';

const DB_NAME = 'SweetHomeDB';
const DB_VERSION = 1;

export const offlineStorageService = {
  initDB: async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('sweets')) {
          db.createObjectStore('sweets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('ingredients')) {
          db.createObjectStore('ingredients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('kitchenware')) {
          db.createObjectStore('kitchenware', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sales')) {
          db.createObjectStore('sales', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('recipes')) {
          db.createObjectStore('recipes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pendingOperations')) {
          db.createObjectStore('pendingOperations', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  },

  saveToStore: async (storeName, data) => {
    const db = await offlineStorageService.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  getFromStore: async (storeName, id) => {
    const db = await offlineStorageService.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  getAllFromStore: async (storeName) => {
    const db = await offlineStorageService.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  deleteFromStore: async (storeName, id) => {
    const db = await offlineStorageService.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  getPendingOperations: async () => {
    const db = await offlineStorageService.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readonly');
      const store = transaction.objectStore('pendingOperations');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  addPendingOperation: async (operation) => {
    const db = await offlineStorageService.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      const request = store.add(operation);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  removePendingOperation: async (id) => {
    const db = await offlineStorageService.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  syncData: async (firestoreService, userId) => {
    const operations = await offlineStorageService.getPendingOperations();
    let synced = 0;
    let removedFailed = 0;

    for (const op of operations) {
      try {
        if (op.type === 'add') {
          await firestoreService.addDocument(op.collection, op.data, userId);
        } else if (op.type === 'update') {
          await firestoreService.updateDocument(op.collection, op.docId, op.data, userId);
        } else if (op.type === 'delete') {
          await firestoreService.deleteDocument(op.collection, op.docId, userId);
        }
        
        await offlineStorageService.removePendingOperation(op.id);
        synced++;
      } catch (error) {
        removedFailed++;
        await offlineStorageService.removePendingOperation(op.id);
      }
    }

    return { synced, removedFailed, restantes: 0 };
  }
};

import { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';

export const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = firestoreService.subscribeToCollection(
      collectionName,
      (fetchedData) => {
        setData(fetchedData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName]);

  return { data, loading, error };
};

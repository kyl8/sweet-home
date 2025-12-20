import { useState, useEffect, useRef } from 'react';
import { firestoreService } from '../services/firestoreService';
import { offlineStorageService } from '../services/offlineStorageService';
import { logger } from '../utils/logger';

export const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let unsubscribe = null;
    let cancelled = false;

    const startTimeout = () => {
      timeoutRef.current = setTimeout(() => {
        if (!cancelled) {
          logger.warn(`Timeout ao carregar coleção ${collectionName}`);
          setLoading(false);
        }
      }, 8000);
    };

    const clearTimeoutRef = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const loadData = async () => {
      setLoading(true);
      setError(null);
      startTimeout();

      try {
        const offlineData = await offlineStorageService.getAllFromStore(collectionName);
        if (offlineData && offlineData.length > 0 && !cancelled) {
          const validData = offlineData.filter(doc => {
            if (!doc.id || doc.id === 'undefined' || doc.id === 'null') {
              logger.warn('Documento sem ID válido detectado (cache)', { doc });
              return false;
            }
            if (!doc.name && !doc.sweetName) {
              logger.warn('Documento sem nome detectado (cache)', { doc });
              return false;
            }
            return true;
          });
          setData(validData);
        }

        unsubscribe = firestoreService.subscribeToCollection(
          collectionName,
          (fetched) => {
            if (cancelled) return;
            clearTimeoutRef();
            
            const validDocs = fetched.filter(doc => {
              if (!doc.id || doc.id === 'undefined' || doc.id === 'null') {
                logger.warn('Documento sem ID válido detectado', { 
                  collection: collectionName,
                  doc 
                });
                return false;
              }
              
              const hasEssentialData = doc.name || doc.sweetName || doc.payer || doc.receiver;
              if (!hasEssentialData) {
                logger.warn('Documento sem dados essenciais detectado', { 
                  collection: collectionName,
                  docId: doc.id 
                });
                return false;
              }
              
              return true;
            });

            logger.info(`Dados carregados de ${collectionName}`, { 
              total: fetched.length,
              valid: validDocs.length,
              sampleId: validDocs[0]?.id 
            });

            setData(validDocs);
            setLoading(false);
          },
          (err) => {
            if (cancelled) return;
            logger.warn(`Falha no realtime para ${collectionName}, usando cache`);
            clearTimeoutRef();
            setError(null);
            setLoading(false);
          }
        );
      } catch (err) {
        if (cancelled) return;
        logger.error(`Erro fatal ao carregar ${collectionName}`, { error: err.message });
        clearTimeoutRef();
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
      clearTimeoutRef();
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName]);

  return { data, loading, error };
};

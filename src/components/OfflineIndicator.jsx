import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineStorageService } from '../services/offlineStorageService';
import { firestoreService } from '../services/firestoreService';
import { logger } from '../utils/logger';

const OfflineIndicator = ({ onSyncComplete }) => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [rawPending, setRawPending] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const refreshCount = async () => {
    try {
      const operations = await offlineStorageService.getPendingOperations();
      setPendingCount(operations.length);
      setRawPending(operations.length);
      if (operations.length === 0) setSyncError(null);
    } catch {}
  };

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing && (!lastSyncTime || Date.now() - lastSyncTime > 8000)) {
      handleSync();
    }
  }, [isOnline, pendingCount]);

  const handleSync = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    setLastSyncTime(Date.now());
    setSyncError(null);
    try {
      const result = await offlineStorageService.syncData(firestoreService, 'system');
      await refreshCount();
      if (result.synced > 0 && onSyncComplete) onSyncComplete();
      if (result.removedFailed > 0) {
        logger.info('Operações falhas removidas', { removidas: result.removedFailed });
      }
      if (result.restantes === 0) {
        setTimeout(() => setDismissed(true), 300);
      }
    } catch (e) {
      setSyncError(null);
      await refreshCount();
    } finally {
      setIsSyncing(false);
    }
  };

  if (dismissed || pendingCount === 0) return null;

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-4 py-3 z-50 shadow-lg"
        >
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold">Modo Offline</span>
              <span className="ml-2 px-2 py-1 bg-orange-600 rounded-full text-sm font-semibold">
                {pendingCount} pendência(s)
              </span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition"
            >
              Fechar ✕
            </button>
          </div>
        </motion.div>
      )}

      {isOnline && pendingCount > 0 && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 px-4 py-3 z-50 shadow-lg bg-blue-500 text-white"
        >
          <div className="container mx-auto flex items-center justify-between gap-4">
            <span className="font-semibold">
              {isSyncing ? `Sincronizando... (${pendingCount} restante(s))` : `${pendingCount} para sincronizar`}
            </span>
            <div className="flex gap-2">
              {!isSyncing && (
                <button
                  onClick={handleSync}
                  className="px-4 py-1 bg-white text-blue-500 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors"
                >
                  Sincronizar Agora
                </button>
              )}
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition"
              >
                Fechar ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;

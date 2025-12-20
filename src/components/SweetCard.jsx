import React, { useMemo, useRef, useState, useEffect } from 'react';
import { InfoOutlined } from '@mui/icons-material';
import ObservationsModal from './modals/ObservationsModal';
import { firestoreService } from '../services/firestoreService';
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';
import { useToast } from '../hooks/useToast';

const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const getExpiryStatusClass = (dateString) => {
  if (!dateString) return 'text-gray-500';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiryDate = new Date(dateString);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'text-red-600 font-bold';
  if (diffDays <= 7) return 'text-yellow-600 font-semibold';
  return 'text-green-600';
};

const generateColorFromName = (name) => {
  const colors = [
    'FF5733', '33FF57', '3357FF', 'FF33A1', 'A133FF', '33FFF5',
    'FFC300', 'DAF7A6', '900C3F', '581845', 'C70039', '28B463',
    '1F618D', '7D3C98', 'F4D03F', '45B39D', 'E74C3C', '16A085',
    '2ECC71', '3498DB', '9B59B6', '34495E', 'F39C12', 'D35400'
  ];
  
  if (!name || typeof name !== 'string') {
    return colors[0];
  }
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const SweetCard = ({ sweet, onEdit, onDelete }) => {
  const toast = useToast();
  
  if (!sweet || typeof sweet.id === 'undefined') {
    logger.error('SweetCard recebeu doce invalido', { sweet });
    return null;
  }

  const safeName = (sweet?.name && typeof sweet.name === 'string') ? sweet.name : 'Sem Nome';
  const safeStock = typeof sweet?.stock === 'number' ? sweet.stock : 0;
  const safePrice = typeof sweet?.price === 'number' ? sweet.price : 0;
  const safeExpiryDate = (sweet?.expiry_date && typeof sweet.expiry_date === 'string') ? sweet.expiry_date : null;
  
  const expiryStatusClass = useMemo(() => getExpiryStatusClass(safeExpiryDate), [safeExpiryDate]);
  const formattedDate = useMemo(() => formatDateForDisplay(safeExpiryDate), [safeExpiryDate]);
  const placeholderColor = useMemo(() => generateColorFromName(safeName), [safeName]);
  
  const [showObsModal, setShowObsModal] = useState(false);
  const [observations, setObservations] = useState((sweet?.observations && typeof sweet.observations === 'string') ? sweet.observations : '');
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const iconRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const handleDeleteClick = async () => {
    const name = safeName;
    const result = await toast.confirm(
      'Confirmar exclusao',
      `Tem certeza que deseja excluir "${name}"?`,
      'Sim, excluir',
      'Cancelar'
    );
    
    if (result.isConfirmed) {
      onDelete?.(sweet.id);
    }
  };

  const handleSaveObs = async (newText) => {
    try {
      if (typeof newText !== 'string') {
        throw new Error('Observacoes invalidas');
      }

      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const userId = userData?.id || 'anonymous';
      const sweetId = String(sweet.id);
      
      logger.info('Salvando observacoes', { 
        sweetId: sweetId, 
        sweetName: safeName 
      });
      
      await firestoreService.upsertDocument(
        FIRESTORE_COLLECTIONS.SWEETS,
        sweetId, 
        { observations: newText },
        userId
      );
      
      setObservations(newText);
      toast.success('Observacoes salvas com sucesso!');
      logger.info('Observacoes atualizadas', { sweetId: sweetId });
    } catch (error) {
      logger.error('Erro ao salvar observacoes', { 
        error: error.message,
        sweetId: sweet.id
      });
      toast.error('Erro ao salvar observacoes', error.message);
    }
  };

  const handleIconMouseEnter = () => {
    if (!iconRef.current) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowObsModal(true);
  };

  const handleIconMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowObsModal(false);
    }, 300);
  };

  const handleModalMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleModalMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowObsModal(false);
    }, 200);
  };

  const handleImageLoad = () => {
    setIsLoadingImage(false);
  };

  const handleImageError = (e) => {
    setIsLoadingImage(false);
    e.target.src = `https://placehold.co/400x300/${placeholderColor}/ffffff?text=${encodeURIComponent(safeName)}`;
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const imageUrl = (sweet?.image && typeof sweet.image === 'string') 
    ? sweet.image 
    : `https://placehold.co/400x300/${placeholderColor}/ffffff?text=${encodeURIComponent(safeName)}`;

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col justify-between">
        <div>
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
            {isLoadingImage && (
              <div className="w-full h-full bg-gray-300 animate-pulse"></div>
            )}
            <img
              className="w-full h-48 object-cover"
              src={imageUrl}
              alt={`Imagem de ${safeName}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-gray-800">{safeName}</h3>
              {observations && iconRef.current && (
                <span
                  ref={iconRef}
                  onMouseEnter={handleIconMouseEnter}
                  onMouseLeave={handleIconMouseLeave}
                  className="cursor-pointer"
                >
                  <InfoOutlined className="text-blue-500" />
                </span>
              )}
            </div>

            <p className="text-gray-600">
              <span className="font-semibold">Estoque:</span> {safeStock} unidades
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Validade:</span>{' '}
              <span className={expiryStatusClass}>{formattedDate}</span>
            </p>
            <p className="text-green-600 font-bold text-lg mt-2">
              R$ {safePrice.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 flex justify-end gap-3">
          <button
            onClick={() => onEdit(sweet)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteClick}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>

      {showObsModal && iconRef.current && (
        <div
          onMouseEnter={handleModalMouseEnter}
          onMouseLeave={handleModalMouseLeave}
        >
          <ObservationsModal
            initialText={observations}
            onSave={handleSaveObs}
            onClose={() => setShowObsModal(false)}
            anchorRect={iconRef.current.getBoundingClientRect()}
          />
        </div>
      )}
    </>
  );
};

export default SweetCard;
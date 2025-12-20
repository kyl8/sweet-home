import React, { useRef, useState, useEffect } from 'react';
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


const formatStockForDisplay = (stockInBaseUnit, displayUnit, displayUnitFactor) => {
    if (!displayUnitFactor || displayUnitFactor === 0) {
        return `${stockInBaseUnit || 0} ${displayUnit || 'un'}`;
    }
    const displayQuantity = stockInBaseUnit / displayUnitFactor;
    const formattedQuantity = Number.isInteger(displayQuantity) ? displayQuantity : displayQuantity.toFixed(2);
    const pluralUnit = parseFloat(formattedQuantity) !== 1 ? `${displayUnit}(s)` : displayUnit;
    return `${formattedQuantity} ${pluralUnit}`;
};

const IngredientCard = ({ ingredient, onDelete, onEdit }) => {
    const toast = useToast();
    const expiryStatusClass = getExpiryStatusClass(ingredient.expiryDate);
    const formattedExpiryDate = formatDateForDisplay(ingredient.expiryDate);
    const formattedPurchaseDate = formatDateForDisplay(ingredient.purchaseDate); 
    const formattedStock = formatStockForDisplay(
        ingredient.stockInBaseUnit, 
        ingredient.displayUnit, 
        ingredient.displayUnitFactor
    );

    const [showObsModal, setShowObsModal] = useState(false);
    const [observations, setObservations] = useState(ingredient.observations || '');
    const iconRef = useRef(null);
    const closeTimeoutRef = useRef(null);

    const handleSaveObs = async (newText) => {
        try {
            const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
            
            await firestoreService.upsertDocument(
                FIRESTORE_COLLECTIONS.INGREDIENTS,
                ingredient.id,
                { observations: newText },
                userData?.id || 'anonymous'
            );
            
            setObservations(newText);
            toast.success('Observações salvas com sucesso!');
            logger.info('Observações atualizadas com sucesso', { ingredientId: ingredient.id });
        } catch (error) {
            logger.error('Erro ao salvar observações', { error: error.message });
            toast.error('Erro ao salvar observações', error.message);
        }
    };

    const handleIconMouseEnter = () => {
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

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col justify-between">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">{ingredient.name}</h3>
                            {ingredient.brand && (
                                <p className="text-md font-semibold text-gray-500 -mt-1">{ingredient.brand}</p>
                            )}
                        </div>
                        {observations && (
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

                    <div className="space-y-3 text-gray-600 text-lg mt-2">
                        <p>
                            Estoque: <span className="font-semibold">{formattedStock}</span>
                            <span className="text-sm text-gray-500 ml-2">({ingredient.stockInBaseUnit || 0} {ingredient.baseUnit})</span>
                        </p>
                        
                        {Number(ingredient.displayUnitPrice || 0) > 0 && (
                            <p className="text-blue-700">
                                Custo: <span className="font-semibold">
                                    R$ {Number(ingredient.displayUnitPrice || 0).toFixed(2).replace('.', ',')}
                                </span> por {ingredient.displayUnit}
                                <span className="text-sm text-gray-500 ml-2">
                                    (R$ {Number(ingredient.costPerBaseUnit || 0).toFixed(4).replace('.', ',')}/{ingredient.baseUnit || 'g'})
                                </span>
                            </p>
                        )}
                        {ingredient.purchaseDate && (
                             <p>
                                Compra: <span className="font-semibold">{formattedPurchaseDate}</span>
                            </p>
                        )}
                        {ingredient.expiryDate && (
                            <p>
                                Validade: <span className={expiryStatusClass}>{formattedExpiryDate}</span>
                            </p>
                        )}
                        
                        {ingredient.observations && (
                            <p className="text-gray-500 text-sm italic">
                                📝 {ingredient.observations}
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="bg-gray-50 p-4 mt-4 flex justify-end space-x-3">
                    <button
                        onClick={() => onEdit(ingredient)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                    >
                        Editar
                    </button>
                    <button 
                        onClick={() => onDelete(ingredient.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                    >
                        Excluir
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

export default IngredientCard;
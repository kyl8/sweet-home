import React, { useRef, useState, useEffect } from 'react';
import { InfoOutlined } from '@mui/icons-material';
import ObservationsModal from './modals/ObservationsModal';
import { firestoreService } from '../services/firestoreService';
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';
import { useToast } from '../hooks/useToast';

const getConditionBadge = (condition) => {
    switch (condition) {
        case 'Novo':
            return { text: 'Novo', className: 'bg-green-100 text-green-800' };
        case 'Bom':
            return { text: 'Bom', className: 'bg-blue-100 text-blue-800' };
        case 'Desgastado':
            return { text: 'Desgastado', className: 'bg-yellow-100 text-yellow-800' };
        default:
            return { text: condition, className: 'bg-gray-100 text-gray-800' };
    }
};

const KitchenwareCard = ({ utensil, onEdit, onDelete }) => {
    const toast = useToast();
    const conditionBadge = getConditionBadge(utensil.condition);
    const [showObsModal, setShowObsModal] = useState(false);
    const [observations, setObservations] = useState(utensil.observations || '');
    const iconRef = useRef(null);
    const closeTimeoutRef = useRef(null);

    const handleSaveObs = async (newText) => {
        try {
            const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
            
            await firestoreService.upsertDocument(
                FIRESTORE_COLLECTIONS.KITCHENWARE,
                utensil.id,
                { observations: newText },
                userData?.id || 'anonymous'
            );
            
            setObservations(newText);
            toast.success('Observações salvas com sucesso!');
            logger.info('Observações atualizadas com sucesso', { utensilId: utensil.id });
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
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-2xl font-bold text-gray-800">{utensil.name}</h3>
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

                    <div className="space-y-3 text-gray-600 text-lg">
                        <p>
                            Quantidade: <span className="font-semibold">{utensil.quantity}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            Condição:
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${conditionBadge.className}`}>
                                {conditionBadge.text}
                            </span>
                        </p>

                        {utensil.observations && (
                            <p className="text-gray-500 text-sm italic">
                                📝 {utensil.observations}
                            </p>
                        )}
                    </div>
                </div>
                <div className="bg-gray-50 p-4 flex justify-end gap-3">
                    <button
                        onClick={() => onEdit(utensil)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => onDelete(utensil.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
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

export default KitchenwareCard;
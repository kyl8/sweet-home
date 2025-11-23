import React from 'react';
import { InfoOutlined } from '@mui/icons-material';


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
    const conditionBadge = getConditionBadge(utensil.condition);

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col justify-between">
            <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-2xl font-bold text-gray-800">{utensil.name}</h3>
                    {utensil.observations && (
                        <div title={utensil.observations}>
                            <InfoOutlined className="text-blue-500" />
                        </div>
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
    );
};

export default KitchenwareCard;
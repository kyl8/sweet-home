import React from 'react';
import { InfoOutlined } from '@mui/icons-material'; 

const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const getExpiryStatusClass = (dateString) => {
    if (!dateString) return 'text-gray-500';
    const today = new Date('2025-08-08T00:00:00-03:00');
    const expiryDate = new Date(`${dateString}T00:00:00-03:00`);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'text-red-600 font-bold';
    if (diffDays <= 7) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
};

const SweetCard = ({ sweet, onEdit, onDelete }) => {
    const expiryStatusClass = getExpiryStatusClass(sweet.expiry_date);
    const formattedDate = formatDateForDisplay(sweet.expiry_date);

    const generateRandomHexColor = () => {
        const colors = [
            'FF5733', '33FF57', '3357FF', 'FF33A1', 'A133FF', '33FFF5',
            'FFC300', 'DAF7A6', '900C3F', '581845', 'C70039', 'FF5733',
            '28B463', '1F618D', '7D3C98', 'F4D03F', '45B39D', 'E74C3C',
            '16A085', '2ECC71', '3498DB', '9B59B6', '34495E', 'F39C12',
            'D35400', 'C0392B', 'BDC3C7', '7F8C8D', '1ABC9C', '8E44AD',
            '2980B9', 'E67E22', 'E74C3C', '95A5A6', '2C3E50', '27AE60'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col justify-between">
            <div>
                <img 
                    className="w-full h-48 object-cover" 
                    src={sweet.image || `https://placehold.co/400x300/${encodeURIComponent(generateRandomHexColor())}/ffffff?text=${encodeURIComponent(sweet.name)}`}
                    alt={`Imagem de ${sweet.name}`} 
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300/cccccc/ffffff?text=Imagem+Indispon%C3%ADvel'; }}
                />
                <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{sweet.name}</h3>
                        {sweet.observations && (
                            <div title={sweet.observations}>
                                <InfoOutlined className="text-blue-500" />
                            </div>
                        )}
                    </div>
                    
                    <p className="text-gray-600">
                        <span className="font-semibold">Estoque:</span> {sweet.stock} unidades
                    </p>
                    <p className="text-gray-600">
                        <span className="font-semibold">Data de Validade:</span>{' '}
                        <span className={expiryStatusClass}>{formattedDate}</span>
                    </p>
                    <p className="text-green-600 font-bold text-lg mt-2">
                        R$ {Number(sweet.price).toFixed(2).replace('.', ',')}
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3">
                <button
                    onClick={() => onEdit(sweet)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                    Editar
                </button>
                <button
                    onClick={() => onDelete(sweet.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                    Excluir
                </button>
            </div>
        </div>
    );
};

export default SweetCard;
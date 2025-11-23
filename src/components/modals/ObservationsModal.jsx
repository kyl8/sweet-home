import React, { useState } from 'react';

const ObservationsModal = ({ initialText, onSave, onClose }) => {
    const [text, setText] = useState(initialText);

    const handleSave = () => {
        onSave(text); 
        onClose();    
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={onClose} 
        >
            <div 
                className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg mx-4"
                onClick={e => e.stopPropagation()} 
            >
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Observações</h3>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows="6"
                    placeholder="Adicione notas, detalhes de armazenamento, fornecedor, etc."
                    className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-400"
                ></textarea>
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-300"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                    >
                        Salvar Observações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ObservationsModal;
import React from 'react';
import { motion } from 'framer-motion';

const ReceiptModal = ({ isOpen, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
        >
            <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 text-center max-w-sm w-full mx-4"
            >
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Deseja gerar o comprovante da venda?</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => onConfirm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl w-full">Não</button>
                    <button onClick={() => onConfirm(true)} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl w-full">Sim</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ReceiptModal;
import React from 'react';
import { motion } from 'framer-motion';
const QRCodeModal = ({ isOpen, onClose, onConfirm }) => {
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
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Pagamento via QR Code</h2>
                <p className="text-gray-600 mb-6">Aponte a câmera do celular do cliente para o código abaixo.</p>
                <div className="p-4 bg-gray-100 rounded-lg inline-block">
                    <img
                        src="https://placehold.co/200x200/e2e8f0/333333?text=SEU+QR+CODE+PIX+AQUI"
                        alt="QR Code Fixo para Pagamento"
                        width={200}
                        height={200}
                    />
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl w-full">Cancelar Venda</button>
                    <button onClick={onConfirm} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl w-full">Venda Paga</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default QRCodeModal;
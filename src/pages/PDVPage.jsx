import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus, FiShoppingCart } from 'react-icons/fi';
import QRCodeModal from '../components/modals/QRCodeModal';
import ReceiptModal from '../components/modals/ReceiptModal';

const PDVPage = ({ sweets, onNavigate, userData }) => {
    const [cart, setCart] = useState([]);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const handleAddToCart = (sweetToAdd) => {
        const existingItem = cart.find(item => item.id === sweetToAdd.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.id === sweetToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...sweetToAdd, quantity: 1 }]);
        }
    };

    const handleUpdateQuantity = (sweetId, amount) => {
        setCart(cart.map(item => {
            if (item.id === sweetId) {
                const newQuantity = item.quantity + amount;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const orderTotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [cart]);
    const handleInitiateSale = () => {
        if (cart.length === 0) {
            alert("O carrinho está vazio!");
            return;
        }
        setIsQrModalOpen(true);
    };

    const handleConfirmSale = () => {
        setIsQrModalOpen(false);
        setIsReceiptModalOpen(true);
    };

    const handleFinalizeAndReceipt = (shouldGenerateReceipt) => {
        const summary = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
        if (shouldGenerateReceipt) {
            alert(`Venda finalizada com comprovante!\n\nItens: ${summary}\nTotal: R$ ${orderTotal.toFixed(2).replace('.', ',')}`);
        } else {
            alert(`Venda finalizada sem comprovante!\n\nTotal: R$ ${orderTotal.toFixed(2).replace('.', ',')}`);
        }
        setIsReceiptModalOpen(false);
        setCart([]);
    };
    
    const handleCancelSale = () => {
        setIsQrModalOpen(false);
        setIsReceiptModalOpen(false);
    };
    const gridContainerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const gridItemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

    return (
        <div className="min-h-full bg-gray-50">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="lg:flex lg:gap-8 lg:items-start">

                    <div className="w-full lg:w-2/3">
                        <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
                            Ponto de Venda
                        </motion.h2>
                        <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5" variants={gridContainerVariants} initial="hidden" animate="show">
                            {sweets.map(sweet => (
                                <motion.div key={sweet.id} onClick={() => handleAddToCart(sweet)} className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 flex flex-col items-center text-center cursor-pointer transition-shadow duration-300" variants={gridItemVariants} whileHover={{ scale: 1.05, y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.95 }}>
                                    <img src={sweet.image} alt={sweet.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg mb-3" />
                                    <h3 className="font-bold text-gray-800 flex-grow text-sm md:text-base">{sweet.name}</h3>
                                    <p className="text-pink-500 font-semibold mt-1 text-base md:text-lg">R$ {sweet.price.toFixed(2).replace('.', ',')}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    <motion.div className="w-full lg:w-1/3 lg:max-w-md xl:max-w-lg lg:max-h-[80vh] mt-8 lg:mt-0 lg:sticky lg:top-8 bg-white rounded-2xl shadow-2xl shadow-gray-200 p-6 flex flex-col" style={{ height: 'calc(80vh - 4rem)' }} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.7, ease: "easeInOut" }}>
                        <div className="border-b border-gray-200 pb-4 mb-4 flex-shrink-0">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-800">Resumo do Pedido</h3>
                            <p className="text-gray-500 font-medium text-sm md:text-base">Operador: {userData?.username || 'Visitante'}</p>
                        </div>
                        <div className="flex-grow overflow-y-auto -mr-3 pr-3">
                            <AnimatePresence>
                                {cart.length === 0 ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <FiShoppingCart size={60} />
                                        <p className="mt-4 font-medium">Seu carrinho está vazio.</p>
                                    </motion.div>
                                ) : (
                                    cart.map(item => (
                                        <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm md:text-base">{item.name}</p>
                                                <p className="text-gray-500 text-xs md:text-sm">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleUpdateQuantity(item.id, -1)} className="bg-gray-100 text-gray-600 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold hover:bg-gray-200 transition-colors"><FiMinus /></motion.button>
                                                <span className="font-bold w-4 text-center text-sm md:text-base">{item.quantity}</span>
                                                <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleUpdateQuantity(item.id, 1)} className="bg-gray-100 text-gray-600 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold hover:bg-gray-200 transition-colors"><FiPlus /></motion.button>
                                            </div>
                                            <p className="font-bold w-20 md:w-24 text-right text-gray-800 text-sm md:text-base">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="border-t border-gray-200 pt-5 mt-4 flex-shrink-0">
                            <div className="flex justify-between items-center font-bold text-xl md:text-2xl mb-6 text-gray-800">
                                <span>TOTAL</span>
                                <span>R$ {orderTotal.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <motion.button onClick={handleInitiateSale} disabled={cart.length === 0} className="w-full bg-pink-500 text-white font-bold py-3 text-lg md:py-4 md:text-xl rounded-xl transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed" whileHover={{ scale: cart.length > 0 ? 1.03 : 1, boxShadow: cart.length > 0 ? "0px 8px 25px rgba(236, 72, 153, 0.4)" : "none" }} whileTap={{ scale: cart.length > 0 ? 0.98 : 1 }}>
                                Efetuar Pagamento
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>
            <AnimatePresence>
                <QRCodeModal 
                    isOpen={isQrModalOpen}
                    onClose={handleCancelSale}
                    onConfirm={handleConfirmSale}
                />
            </AnimatePresence>
            <AnimatePresence>
                <ReceiptModal 
                    isOpen={isReceiptModalOpen}
                    onConfirm={handleFinalizeAndReceipt}
                />
            </AnimatePresence>
        </div>
    );
};

export default PDVPage;
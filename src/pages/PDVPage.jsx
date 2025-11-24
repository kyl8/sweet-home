import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus, FiShoppingCart, FiTrash2 } from 'react-icons/fi'; // <-- adicionado FiTrash2
import { useToast } from '../hooks/useToast';
import { salesService } from '../services/salesService';
import { useFirestore } from '../hooks/useFirestore';
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';
import QRCodeModal from '../components/modals/QRCodeModal';
import ReceiptModal from '../components/modals/ReceiptModal';
import LoadingPage from '../components/LoadingPage';

const PDVPage = ({ sweets, onNavigate, userData }) => {
    const toast = useToast();
    const { data: recipes } = useFirestore(FIRESTORE_COLLECTIONS.RECIPES);
    const { data: ingredients } = useFirestore(FIRESTORE_COLLECTIONS.INGREDIENTS);
    
    const [cart, setCart] = useState([]);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentSaleDocument, setCurrentSaleDocument] = useState(null);

    const handleAddToCart = (sweetToAdd) => {
        if (sweetToAdd.stock <= 0) {
            toast.warning('Produto sem estoque', `"${sweetToAdd.name}" não está disponível`);
            return;
        }

        const existingItem = cart.find(item => item.id === sweetToAdd.id);
        if (existingItem) {
            const maxQty = sweetToAdd.stock;
            if (existingItem.quantity >= maxQty) {
                toast.warning(
                    'Limite de estoque atingido',
                    `Apenas ${maxQty} unidade(s) de "${sweetToAdd.name}" disponível(is)`
                );
                return;
            }
            setCart(cart.map(item =>
                item.id === sweetToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...sweetToAdd, quantity: 1 }]);
        }
    };

    const handleUpdateQuantity = (sweetId, amount) => {
        const sweet = sweets.find(s => s.id === sweetId);
        if (!sweet) return;

        setCart((prev) => prev.map(item => {
            if (item.id === sweetId) {
                let newQuantity = item.quantity + amount;

                if (newQuantity < 1) {
                    toast.info('Quantidade mínima é 1. Para remover, use o botão excluir.');
                    newQuantity = 1;
                }


                if (newQuantity > sweet.stock) {
                    toast.warning(
                        'Quantidade excede estoque',
                        `Máximo disponível: ${sweet.stock} unidade(s)`
                    );
                    newQuantity = sweet.stock;
                }

                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const handleSetQuantity = (sweetId, value) => {
        setCart((prev) => {
            const parsed = parseInt(String(value), 10);
            const qty = isNaN(parsed) ? 1 : parsed; 
            const sweet = sweets.find((s) => String(s.id) === String(sweetId) || s.id === sweetId);
            if (!sweet) return prev;

            let finalQty = qty;
            if (finalQty < 1) {
                finalQty = 1;
            }
            if (finalQty > sweet.stock) {
                toast.warning('Quantidade excede estoque', `Máximo disponível: ${sweet.stock} unidade(s)`);
                finalQty = sweet.stock;
            }

            return prev.map((i) => (String(i.id) === String(sweetId) ? { ...i, quantity: finalQty } : i));
        });
    };

    const handleRemoveItem = (sweetId) => {
        setCart(prev => prev.filter(i => String(i.id) !== String(sweetId)));
        toast.info('Item removido do carrinho');
    };

    const orderTotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [cart]);

    const handleInitiateSale = () => {
        if (cart.length === 0) {
            toast.warning('Carrinho vazio', 'Adicione pelo menos um produto');
            return;
        }

        for (const item of cart) {
            const sweet = sweets.find(s => s.id === item.id);
            if (!sweet || sweet.stock < item.quantity) {
                toast.error(
                    'Estoque insuficiente',
                    `"${sweet?.name || 'Produto'}" não tem estoque suficiente`
                );
                return;
            }
        }

        try {
            const saleDoc = salesService.createSaleDocument(
                cart,
                sweets,
                recipes,
                ingredients,
                userData
            );
            setCurrentSaleDocument(saleDoc);
            setIsQrModalOpen(true);
            logger.info('Documento de venda criado', { items: cart.length });
        } catch (error) {
            toast.error('Erro ao preparar venda', error.message);
            logger.error('Erro ao criar documento de venda', { error: error.message });
        }
    };

    const handleConfirmSale = () => {
        setIsQrModalOpen(false);
        setIsReceiptModalOpen(true);
    };

    const handleFinalizeAndReceipt = async (shouldGenerateReceipt) => {
        if (!currentSaleDocument) {
            toast.error('Erro', 'Documento de venda não encontrado');
            return;
        }

        setIsProcessing(true);

        try {
            const validation = salesService.validateSale(currentSaleDocument, sweets);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            const result = await salesService.finalizeSale(
                currentSaleDocument,
                cart,
                sweets,
                userData
            );

            logger.info('Venda finalizada com sucesso', result);

            if (shouldGenerateReceipt) {
                toast.success(
                    'Venda concluída!',
                    `Total: R$ ${orderTotal.toFixed(2).replace('.', ',')}`
                );
            } else {
                toast.success('Venda concluída sem recibo');
            }

            setCart([]);
            setCurrentSaleDocument(null);
            setIsReceiptModalOpen(false);

        } catch (error) {
            logger.error('Erro ao finalizar venda', { error: error.message });
            toast.error(
                'Falha ao processar venda',
                error.message || 'Tente novamente'
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelSale = () => {
        setIsQrModalOpen(false);
        setIsReceiptModalOpen(false);
        setCurrentSaleDocument(null);
        toast.info('Venda cancelada');
    };

    if (isProcessing) {
        return <LoadingPage message="Processando venda" submessage="Salvar dados e atualizar estoque" />;
    }

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
                                <motion.div key={sweet.id} onClick={() => handleAddToCart(sweet)} className={`bg-white border rounded-xl p-3 md:p-4 flex flex-col items-center text-center cursor-pointer transition-shadow duration-300 ${sweet.stock > 0 ? 'border-gray-200 hover:shadow-lg' : 'border-red-300 opacity-50 cursor-not-allowed'}`} variants={gridItemVariants} whileHover={sweet.stock > 0 ? { scale: 1.05, y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" } : {}} whileTap={sweet.stock > 0 ? { scale: 0.95 } : {}}>
                                    <img src={sweet.image} alt={sweet.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg mb-3" />
                                    <h3 className="font-bold text-gray-800 flex-grow text-sm md:text-base">{sweet.name}</h3>
                                    <p className="text-pink-500 font-semibold mt-1 text-base md:text-lg">R$ {sweet.price.toFixed(2).replace('.', ',')}</p>
                                    {sweet.stock <= 0 && <p className="text-red-600 font-bold text-xs mt-1">SEM ESTOQUE</p>}
                                    {sweet.stock > 0 && sweet.stock <= 5 && <p className="text-yellow-600 font-bold text-xs mt-1">Apenas {sweet.stock}</p>}
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
                                    cart.map(item => {
                                        const sweetStock = sweets.find(s => String(s.id) === String(item.id))?.stock ?? item.quantity;
                                        return (
                                            <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm md:text-base">{item.name}</p>
                                                    <p className="text-gray-500 text-xs md:text-sm">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                                                </div>
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <motion.button
                                                        whileTap={{ scale: 0.8 }}
                                                        onClick={() => handleUpdateQuantity(item.id, -1)}
                                                        aria-label={`Diminuir quantidade de ${item.name}`}
                                                        className="bg-gray-100 text-gray-600 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold hover:bg-gray-200 transition-colors"
                                                    >
                                                        <FiMinus size={14} />
                                                    </motion.button>

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={sweetStock}
                                                        value={item.quantity}
                                                        onChange={(e) => handleSetQuantity(item.id, e.target.value)}
                                                        aria-label={`Quantidade de ${item.name}`}
                                                        className="w-16 text-center border rounded px-2 py-1 text-sm md:text-base"
                                                    />

                                                    <motion.button
                                                        whileTap={{ scale: 0.8 }}
                                                        onClick={() => handleUpdateQuantity(item.id, 1)}
                                                        aria-label={`Aumentar quantidade de ${item.name}`}
                                                        disabled={item.quantity >= sweetStock}
                                                        className={`bg-gray-100 text-gray-600 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold hover:bg-gray-200 transition-colors ${item.quantity >= sweetStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <FiPlus size={14} />
                                                    </motion.button>

                                                    <motion.button
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        aria-label={`Remover ${item.name} do carrinho`}
                                                        className="bg-red-100 text-red-600 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold hover:bg-red-200 transition-colors"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </motion.button>
                                                </div>
                                                <p className="font-bold w-20 md:w-24 text-right text-gray-800 text-sm md:text-base">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                                            </motion.div>
                                        );
                                    })
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
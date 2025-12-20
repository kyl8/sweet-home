import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus, FiShoppingCart, FiTrash2, FiSearch, FiPercent, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import { useToast } from '../hooks/useToast';
import { salesService } from '../services/salesService';
import { useFirestore } from '../hooks/useFirestore';
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';
import QRCodeModal from '../components/modals/QRCodeModal';
import ReceiptModal from '../components/modals/ReceiptModal';
import LoadingPage from '../components/LoadingPage';
import { pdvApiService } from '../services/pdvApiService';
import { validators } from '../utils/validators';

const PDVPage = ({ sweets, onNavigate, userData }) => {
    const toast = useToast();
    const { data: recipes } = useFirestore(FIRESTORE_COLLECTIONS.RECIPES);
    const { data: ingredients } = useFirestore(FIRESTORE_COLLECTIONS.INGREDIENTS);
    
    const [cart, setCart] = useState([]);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentSaleDocument, setCurrentSaleDocument] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [salesHistory, setSalesHistory] = useState([]);
    const [showSalesHistory, setShowSalesHistory] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const barcodeInputRef = useRef(null);

    const { data: salesData } = useFirestore(FIRESTORE_COLLECTIONS.SALES);

    useEffect(() => {
        if (salesData) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todaysSales = salesData.filter(sale => {
                const saleDate = new Date(sale.date);
                saleDate.setHours(0, 0, 0, 0);
                return saleDate.getTime() === today.getTime();
            });
            
            setSalesHistory(todaysSales);
        }
    }, [salesData]);

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            } else if (e.key === 'Escape') {
                if (showDiscountModal) setShowDiscountModal(false);
                else if (showSalesHistory) setShowSalesHistory(false);
            } else if (e.key === 'Enter' && barcodeInputRef.current === document.activeElement) {
                e.preventDefault();
                handleBarcodeScanned(barcodeInput);
            } else if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showDiscountModal, showSalesHistory, barcodeInput]);

    const safeSweets = Array.isArray(sweets) ? sweets : [];
    const safeCart = Array.isArray(cart) ? cart : [];
    const safeRecipes = Array.isArray(recipes) ? recipes : [];
    const safeIngredients = Array.isArray(ingredients) ? ingredients : [];

    const filteredSweets = useMemo(() => {
        if (!searchQuery || !searchQuery.trim()) {
            return safeSweets;
        }
        
        const query = searchQuery.toLowerCase().trim();
        return safeSweets.filter(sweet => {
            const name = (sweet?.name || '').toLowerCase();
            const id = String(sweet?.id || '');
            return name.includes(query) || id.includes(query);
        });
    }, [safeSweets, searchQuery]); 

    const handleBarcodeScanned = (barcode) => {
        const sweet = safeSweets.find(s => String(s.id) === String(barcode));
        if (sweet) {
            handleAddToCart(sweet);
            setBarcodeInput('');
        } else {
            toast.warning('Produto não encontrado', `Código: ${barcode}`);
            setBarcodeInput('');
        }
    };

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
            setCart([...cart, { ...sweetToAdd, quantity: 1, itemDiscount: 0 }]);
        }
        
        setSearchQuery('');
    };

    const handleUpdateQuantity = (sweetId, amount) => {
        const sweet = safeSweets.find(s => s.id === sweetId);
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
            const sweet = safeSweets.find((s) => String(s.id) === String(sweetId) || s.id === sweetId);
            if (!sweet) return prev;

            let finalQty = Math.max(1, qty);
            if (finalQty > sweet.stock) {
                toast.warning('Quantidade excede estoque', `Maximo disponivel: ${sweet.stock} unidade(s)`);
                finalQty = sweet.stock;
            }

            return prev.map((i) => (String(i.id) === String(sweetId) ? { ...i, quantity: finalQty } : i));
        });
    };

    const handleSetItemDiscount = (sweetId, discountValue) => {
      const validated = Math.max(0, Math.min(100, parseFloat(discountValue) || 0));
      setCart(prev => prev.map(item =>
          item.id === sweetId ? { ...item, itemDiscount: validated } : item
      ));
    };

    const handleRemoveItem = (sweetId) => {
        setCart(prev => prev.filter(i => String(i.id) !== String(sweetId)));
        toast.info('Item removido do carrinho');
    };

    const subtotal = useMemo(() => {
        return safeCart.reduce((total, item) => {
            const itemSubtotal = (item?.price || 0) * (item?.quantity || 0);
            const itemDiscountAmount = itemSubtotal * ((item?.itemDiscount || 0) / 100);
            return total + (itemSubtotal - itemDiscountAmount);
        }, 0);
    }, [safeCart]);

    const discountAmount = (subtotal * discountPercent) / 100;
    const orderTotal = subtotal - discountAmount;

    const handleInitiateSale = () => {
        if (safeCart.length === 0) {
            toast.warning('Carrinho vazio', 'Adicione pelo menos um produto');
            return;
        }

        const customerNameTrimmed = customerName.trim();
        if (!customerNameTrimmed || customerNameTrimmed.length < 2) {
            toast.warning('Nome do cliente invalido', 'Digite um nome valido');
            return;
        }

        if (!validators.isValidPrice(orderTotal) || orderTotal <= 0) {
            toast.error('Total invalido', 'O total deve ser maior que zero');
            return;
        }

        for (const item of cart) {
            const sweet = safeSweets.find(s => s.id === item.id);
            if (!sweet || sweet.stock < item.quantity) {
                toast.error(
                    'Estoque insuficiente',
                    `"${sweet?.name || 'Produto'}" nao tem estoque suficiente`
                );
                return;
            }
        }

        try {
            const saleDoc = salesService.createSaleDocument(
                cart,
                safeSweets,
                safeRecipes,
                safeIngredients,
                userData,
                { discountPercent, orderTotal }
            );
            
            logger.info('Documento de venda criado', { 
                items: cart.length, 
                paymentMethod
            });
            
            setCurrentSaleDocument(saleDoc);
            if (paymentMethod === 'PIX') {
                setIsQrModalOpen(true);
            } else {
                setIsReceiptModalOpen(true);
            }
            
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

        if (!customerName.trim()) {
            toast.warning('Nome do cliente obrigatório', 'Preencha o nome do cliente antes de finalizar');
            return;
        }

        setIsProcessing(true);

        try {
            const validation = salesService.validateSale(currentSaleDocument, safeSweets);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            logger.info('💾 Salvando venda no Firestore...');
            const result = await salesService.finalizeSale(
                currentSaleDocument,
                cart,
                safeSweets,
                userData
            );

            logger.info('Venda salva no Firestore', result);

            if (shouldGenerateReceipt) {
                try {
                    logger.info('Gerando comprovante PDF...');
                    await pdvApiService.finishSale(
                        currentSaleDocument, 
                        userData, 
                        customerName,
                        paymentMethod
                    );
                    toast.success(
                        'Venda concluída com comprovante!',
                        `Total: R$ ${orderTotal.toFixed(2).replace('.', ',')} - ${paymentMethod}`
                    );
                } catch (pdfError) {
                    logger.warn('Falha ao gerar PDF', { 
                        error: pdfError.message,
                        venda_salva: true 
                    });
                    
                    toast.warning(
                        'Venda salva, mas comprovante falhou',
                        `Erro: ${pdfError.message}. Verifique se o backend Python está rodando na porta 3001.`
                    );
                }
            } else {
                toast.success(`✅ Venda concluída sem comprovante - ${paymentMethod}`);
            }

            setCart([]);
            setCurrentSaleDocument(null);
            setIsReceiptModalOpen(false);
            setDiscountPercent(0);
            setCustomerName('');
            setPaymentMethod('PIX');

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

    const handleClearCart = async () => {
        const result = await toast.confirm(
            'Limpar carrinho?',
            'Deseja limpar o carrinho completamente?',
            'Sim, limpar',
            'Cancelar'
        );
        
        if (result.isConfirmed) {
            setCart([]);
            setDiscountPercent(0);
            toast.info('Carrinho limpo');
        }
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
                        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="mb-6">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">Ponto de Venda</h2>
                            
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <input
                                        id="search-input"
                                        type="text"
                                        placeholder="Buscar produto (F1 para focar) ou escanear código..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setSearchQuery(newValue);
                                        }}
                                        className="w-full px-4 py-3 pl-10 border-2 border-pink-300 rounded-lg focus:outline-none focus:border-pink-500"
                                    />
                                    <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
                                    
                                    {searchQuery && (
                                        <button
                                            onClick={() => {

                                                setSearchQuery('');
                                            }}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                
                                {searchQuery && (
                                    <p className="text-sm text-gray-600">
                                        {filteredSweets.length} produto(s) encontrado(s) para "{searchQuery}"
                                    </p>
                                )}

                                <input
                                    ref={barcodeInputRef}
                                    type="hidden"
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleBarcodeScanned(barcodeInput);
                                        }
                                    }}
                                />

                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => setShowSalesHistory(!showSalesHistory)}
                                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
                                    >
                                    Histórico ({salesHistory.length})
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {showSalesHistory && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-lg p-4 mb-6">
                                <h3 className="font-bold text-lg mb-3">Vendas de Hoje</h3>
                                {salesHistory.length === 0 ? (
                                    <p className="text-gray-500">Nenhuma venda realizada hoje</p>
                                ) : (
                                    <div className="space-y-3">
                                        {salesHistory.map((sale, idx) => (
                                            <div key={idx} className="border-l-4 border-green-500 pl-3 pb-3 border-b">
                                                <p className="font-semibold text-green-700">
                                                  R$ {Number(sale?.totalAmount ?? 0).toFixed(2).replace('.', ',')}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                  {(sale?.items?.length || 0)} item(ns) - {new Date(sale.date).toLocaleTimeString('pt-BR')}
                                                </p>
                                                <div className="mt-2 space-y-1">
                                                  {(sale?.items || []).map((item, itemIdx) => (
                                                        <p key={itemIdx} className="text-xs text-gray-500">
                                                            • {item.sweetName} x{item.quantity}
                                                        </p>
                                                  ))}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="border-t pt-3 mt-3">
                                            <p className="font-bold">
                                              Total do dia: R$ {salesHistory.reduce((sum, s) => sum + Number(s?.totalAmount || 0), 0).toFixed(2).replace('.', ',')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <motion.div 
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5" 
                            variants={gridContainerVariants} 
                            initial="hidden" 
                            animate="show"
                            key={searchQuery}
                        >
                            {filteredSweets.length === 0 && searchQuery ? (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-gray-500 text-lg">
                                        Nenhum produto encontrado para "{searchQuery}"
                                    </p>
                                </div>
                            ) : (
                                filteredSweets.map(sweet => (
                                    <motion.div 
                                        key={sweet.id} 
                                        onClick={() => handleAddToCart(sweet)} 
                                        className={`bg-white border rounded-xl p-3 md:p-4 flex flex-col items-center text-center cursor-pointer transition-shadow duration-300 ${
                                            sweet.stock > 0 
                                                ? 'border-gray-200 hover:shadow-lg' 
                                                : 'border-red-300 opacity-50 cursor-not-allowed'
                                        }`} 
                                        variants={gridItemVariants} 
                                        whileHover={sweet.stock > 0 ? { 
                                            scale: 1.05, 
                                            y: -5, 
                                            boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" 
                                        } : {}} 
                                        whileTap={sweet.stock > 0 ? { scale: 0.95 } : {}}
                                    >
                                        <img 
                                            src={sweet.image} 
                                            alt={sweet.name} 
                                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg mb-3" 
                                        />
                                        <h3 className="font-bold text-gray-800 flex-grow text-sm md:text-base">
                                            {sweet.name}
                                        </h3>
                                        <p className="text-pink-500 font-semibold mt-1 text-base md:text-lg">
                                            R$ {Number(sweet.price ?? 0).toFixed(2).replace('.', ',')}
                                        </p>
                                        {sweet.stock <= 0 && (
                                            <p className="text-red-600 font-bold text-xs mt-1">SEM ESTOQUE</p>
                                        )}
                                        {sweet.stock > 0 && sweet.stock <= 5 && (
                                            <p className="text-yellow-600 font-bold text-xs mt-1">
                                                Apenas {sweet.stock}
                                            </p>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    </div>

                    <motion.div 
                        className="w-full lg:w-1/3 lg:max-w-md xl:max-w-lg lg:max-h-[80vh] mt-8 lg:mt-0 lg:sticky lg:top-8 bg-white rounded-2xl shadow-2xl shadow-gray-200 p-6 flex flex-col" 
                        style={{ height: 'calc(80vh - 4rem)' }} 
                        initial={{ x: 50, opacity: 0 }} 
                        animate={{ x: 0, opacity: 1 }} 
                        transition={{ duration: 0.7, ease: "easeInOut" }}
                    >
                        <div className="border-b border-gray-200 pb-4 mb-4 flex-shrink-0">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-800">Resumo do Pedido</h3>
                            <p className="text-gray-500 font-medium text-sm md:text-base">Op: {userData?.username || 'Visitante'}</p>
                            
                            <div className="mt-3 space-y-3">
                                <div>
                                    <label htmlFor="customer-name" className="block text-sm font-semibold text-gray-700 mb-1">
                                        Nome do Cliente
                                    </label>
                                    <input
                                        id="customer-name"
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Digite o nome do cliente..."
                                        maxLength={50}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-400 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Forma de Pagamento
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setPaymentMethod('PIX')}
                                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                                                paymentMethod === 'PIX' 
                                                    ? 'border-pink-500 bg-pink-50 text-pink-700 font-semibold' 
                                                    : 'border-gray-300 bg-white text-gray-600 hover:border-pink-300'
                                            }`}
                                        >
                                            <FiCreditCard size={18} />
                                            <span className="text-sm">PIX</span>
                                        </button>

                                        <button
                                            onClick={() => setPaymentMethod('DINHEIRO')}
                                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                                                paymentMethod === 'DINHEIRO' 
                                                    ? 'border-green-500 bg-green-50 text-green-700 font-semibold' 
                                                    : 'border-gray-300 bg-white text-gray-600 hover:border-green-300'
                                            }`}
                                        >
                                            <FiDollarSign size={18} />
                                            <span className="text-sm">Dinheiro</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                                        const itemSubtotal = item.price * item.quantity;
                                        const itemDiscountAmount = itemSubtotal * (item.itemDiscount || 0) / 100;
                                        const itemTotal = itemSubtotal - itemDiscountAmount;

                                        return (
                                            <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="mb-4 border-b pb-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-sm md:text-base">{item.name}</p>
                                                        <p className="text-gray-500 text-xs md:text-sm">
                                                          R$ {Number(item.price ?? 0).toFixed(2).replace('.', ',')}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-800 text-sm">R$ {itemTotal.toFixed(2).replace('.', ',')}</p>
                                                        {item.itemDiscount > 0 && <p className="text-green-600 text-xs">-{item.itemDiscount}%</p>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <motion.button
                                                            whileTap={{ scale: 0.8 }}
                                                            onClick={() => handleUpdateQuantity(item.id, -1)}
                                                            className="bg-gray-100 text-gray-600 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold hover:bg-gray-200"
                                                        >
                                                            <FiMinus size={14} />
                                                        </motion.button>

                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={sweetStock}
                                                            value={item.quantity}
                                                            onChange={(e) => handleSetQuantity(item.id, e.target.value)}
                                                            className="w-16 text-center border rounded px-2 py-1 text-sm md:text-base"
                                                        />

                                                        <motion.button
                                                            whileTap={{ scale: 0.8 }}
                                                            onClick={() => handleUpdateQuantity(item.id, 1)}
                                                            disabled={item.quantity >= sweetStock}
                                                            className={`bg-gray-100 text-gray-600 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold hover:bg-gray-200 ${item.quantity >= sweetStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <FiPlus size={14} />
                                                        </motion.button>
                                                    </div>

                                                    <motion.button
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="bg-red-100 text-red-600 rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-bold hover:bg-red-200"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </motion.button>
                                                </div>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={item.itemDiscount || 0}
                                                    onChange={(e) => handleSetItemDiscount(item.id, parseFloat(e.target.value))}
                                                    placeholder="Desconto %"
                                                    className="w-full text-center border border-green-300 rounded px-2 py-1 text-xs md:text-sm"
                                                />
                                            </motion.div>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mt-4 space-y-2 flex-shrink-0">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span className="font-semibold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                            </div>

                            {discountPercent > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Desconto ({discountPercent}%):</span>
                                    <span className="font-semibold">-R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                                </div>
                            )}

                            <div className="flex justify-between font-bold text-lg md:text-xl mb-4 pt-2 border-t">
                                <span>TOTAL</span>
                                <span>R$ {orderTotal.toFixed(2).replace('.', ',')}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 mb-4">
                                <motion.button
                                    onClick={() => setShowDiscountModal(!showDiscountModal)}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FiPercent size={16} /> Desconto
                                </motion.button>
                            </div>

                            {showDiscountModal && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 p-3 rounded-lg mb-3">
                                    <label className="text-sm font-semibold text-gray-700 block mb-2">Desconto Global (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={discountPercent}
                                        onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                                        className="w-full border rounded px-3 py-2 text-center"
                                    />
                                </motion.div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <motion.button
                                    onClick={handleClearCart}
                                    disabled={cart.length === 0}
                                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold py-2 px-3 rounded-lg text-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Limpar
                                </motion.button>

                                <motion.button
                                    onClick={handleInitiateSale}
                                    disabled={cart.length === 0 || !customerName.trim()}
                                    className={`font-bold py-2 px-3 rounded-lg text-sm disabled:bg-gray-300 ${
                                        paymentMethod === 'PIX' 
                                            ? 'bg-pink-500 hover:bg-pink-600' 
                                            : 'bg-green-500 hover:bg-green-600'
                                    } text-white`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {paymentMethod === 'PIX' ? 'Pagar com PIX' : 'Pagar em Dinheiro'}
                                </motion.button>
                            </div>
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
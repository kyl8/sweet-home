import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { useToast } from '../hooks/useToast';

const IngredientForm = ({ onSubmit, onCancel, initialData, pageTitle, buttonText }) => {
    const toast = useToast();
    const [ingredient, setIngredient] = useState({
        name: '',
        brand: '', 
        purchaseDate: new Date().toISOString().split('T')[0], 
        displayQuantity: '',
        displayUnit: 'pacote',
        displayUnitFactor: '',
        displayUnitPrice: '',
        baseUnit: 'g',
        expiryDate: '',
        observations: ''
    });

    const stockInBaseUnit = (parseFloat(ingredient.displayQuantity) || 0) * (parseFloat(ingredient.displayUnitFactor) || 0);
    const displayUnitPrice = parseFloat(ingredient.displayUnitPrice) || 0;
    const displayUnitFactor = parseFloat(ingredient.displayUnitFactor) || 0;
    const costPerBaseUnit = displayUnitFactor > 0 ? (displayUnitPrice / displayUnitFactor) : 0;
    
    useEffect(() => {
        if (initialData) {
            const factor = initialData.displayUnitFactor || 0;
            const stock = initialData.stockInBaseUnit || 0;
            setIngredient({
                id: initialData.id,
                name: initialData.name || '',
                brand: initialData.brand || '', 
                purchaseDate: initialData.purchaseDate || new Date().toISOString().split('T')[0], 
                displayQuantity: factor > 0 ? (stock / factor) : 0,
                displayUnit: initialData.displayUnit || 'pacote',
                displayUnitFactor: factor,
                displayUnitPrice: initialData.displayUnitPrice || '',
                baseUnit: initialData.baseUnit || 'g',
                expiryDate: initialData.expiryDate || '',
                observations: initialData.observations || ''
            });
        } else {
            setIngredient({
                name: '', brand: '', purchaseDate: new Date().toISOString().split('T')[0],
                displayQuantity: '', displayUnit: 'pacote', displayUnitFactor: '',
                displayUnitPrice: '', baseUnit: 'g', expiryDate: '', observations: ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setIngredient(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!ingredient.name || typeof ingredient.name !== 'string' || ingredient.name.trim().length === 0) {
            toast.error('Nome invalido', 'O nome do ingrediente eh obrigatorio');
            return;
        }
        
        const factor = parseFloat(ingredient.displayUnitFactor);
        if (isNaN(factor) || factor <= 0) {
            toast.error('Fator invalido', 'O fator de conversao deve ser maior que 0');
            return;
        }
        
        const price = parseFloat(ingredient.displayUnitPrice);
        if (isNaN(price) || price < 0) {
            toast.error('Preco invalido', 'O preco deve ser um numero valido e nao-negativo');
            return;
        }
        
        const qty = parseFloat(ingredient.displayQuantity);
        if (isNaN(qty) || qty < 0) {
            toast.error('Quantidade invalida', 'A quantidade deve ser um numero nao-negativo');
            return;
        }
        
        const ingredientData = {
            id: ingredient.id,
            name: String(ingredient.name).substring(0, 100),
            brand: String(ingredient.brand || '').substring(0, 100),
            purchaseDate: ingredient.purchaseDate,
            stockInBaseUnit: stockInBaseUnit,
            baseUnit: ingredient.baseUnit,
            displayUnit: String(ingredient.displayUnit).substring(0, 50),
            displayUnitFactor: displayUnitFactor,
            displayUnitPrice: displayUnitPrice,
            costPerBaseUnit: costPerBaseUnit,
            expiryDate: ingredient.expiryDate,
            observations: String(ingredient.observations || '').substring(0, 150)
        };
        logger.info('Enviando ingrediente', { 
            name: ingredientData.name,
            stock: stockInBaseUnit
        });
        onSubmit(ingredientData);
    };

    const MAX_LEN = 150;
    const remaining = Math.max(0, MAX_LEN - (ingredient.observations?.length || 0));

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">{pageTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Nome do Ingrediente</label>
                            <input 
                                id="name" 
                                name="name" 
                                type="text" 
                                value={ingredient.name} 
                                onChange={handleChange} 
                                required 
                                maxLength="100"
                                placeholder="Ex: Leite Condensado" 
                                className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" 
                            />
                        </div>
                        <div>
                            <label htmlFor="brand" className="block text-gray-700 font-bold mb-2">Marca</label>
                            <input 
                                id="brand" 
                                name="brand" 
                                type="text" 
                                value={ingredient.brand} 
                                onChange={handleChange} 
                                maxLength="100"
                                placeholder="Ex: Moca, Itambe" 
                                className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="purchaseDate" className="block text-gray-700 font-bold mb-2">Data da Compra</label>
                            <input 
                                id="purchaseDate" 
                                name="purchaseDate" 
                                type="date" 
                                value={ingredient.purchaseDate} 
                                onChange={handleChange} 
                                className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" 
                                required 
                            />
                        </div>
                        <div>
                            <label htmlFor="expiryDate" className="block text-gray-700 font-bold mb-2">Validade</label>
                            <input 
                                id="expiryDate" 
                                name="expiryDate" 
                                type="date" 
                                value={ingredient.expiryDate} 
                                onChange={handleChange} 
                                className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" 
                            />
                        </div>
                    </div>
                    <div className="p-4 border border-purple-200 rounded-lg space-y-4">
                        <h3 className="font-bold text-lg text-purple-800">Definicao da Embalagem</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="displayUnit" className="block text-gray-700 font-bold mb-2">Nome da Embalagem</label>
                                <input 
                                    id="displayUnit" 
                                    name="displayUnit" 
                                    type="text" 
                                    value={ingredient.displayUnit} 
                                    onChange={handleChange} 
                                    maxLength="50"
                                    placeholder="Ex: pacote, lata, kg" 
                                    className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" 
                                />
                            </div>
                            <div>
                                <label htmlFor="displayUnitFactor" className="block text-gray-700 font-bold mb-2">Conteudo da Embalagem</label>
                                <div className="flex">
                                    <input 
                                        id="displayUnitFactor" 
                                        name="displayUnitFactor" 
                                        type="number" 
                                        step="any" 
                                        min="0"
                                        value={ingredient.displayUnitFactor} 
                                        onChange={handleChange} 
                                        placeholder="Ex: 1000" 
                                        className="shadow-inner appearance-none border rounded-l-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" 
                                        required 
                                    />
                                    <select 
                                        name="baseUnit" 
                                        value={ingredient.baseUnit} 
                                        onChange={handleChange} 
                                        className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg px-2 font-semibold text-gray-700 focus:outline-none"
                                    >
                                        <option value="g">g</option>
                                        <option value="ml">ml</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border border-blue-200 rounded-lg space-y-4">
                        <h3 className="font-bold text-lg text-blue-800">Custo de Compra</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="displayUnitPrice" className="block text-gray-700 font-bold mb-2">
                                    Preco por {ingredient.displayUnit || 'Embalagem'} (R$)
                                </label>
                                <input 
                                    id="displayUnitPrice" 
                                    name="displayUnitPrice" 
                                    type="number" 
                                    step="0.01" 
                                    min="0"
                                    value={ingredient.displayUnitPrice} 
                                    onChange={handleChange} 
                                    placeholder="Ex: 5.99" 
                                    className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Custo Calculado por {ingredient.baseUnit}</label>
                                <input 
                                    type="text" 
                                    value={`R$ ${costPerBaseUnit.toFixed(5).replace('.', ',')}`} 
                                    readOnly 
                                    className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border border-green-200 rounded-lg space-y-4">
                        <h3 className="font-bold text-lg text-green-800">Controle de Estoque</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="displayQuantity" className="block text-gray-700 font-bold mb-2">Qtde. de Embalagens</label>
                                <input 
                                    id="displayQuantity" 
                                    name="displayQuantity" 
                                    type="number" 
                                    step="any" 
                                    min="0"
                                    value={ingredient.displayQuantity} 
                                    onChange={handleChange} 
                                    placeholder="Ex: 5" 
                                    className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400" 
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Estoque Total Calculado</label>
                                <input 
                                    type="text" 
                                    value={`${stockInBaseUnit.toFixed(2).replace('.', ',')} ${ingredient.baseUnit}`} 
                                    readOnly 
                                    className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="observations" className="block text-gray-700 font-bold mb-2">Observacoes</label>
                        <input
                            type="text"
                            id="observations"
                            name="observations"
                            value={ingredient.observations}
                            onChange={handleChange}
                            maxLength={MAX_LEN}
                            placeholder="Sem gluten, vegano, etc..."
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {ingredient.observations.length}/{MAX_LEN} caracteres restam {remaining}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-300 w-full sm:w-auto"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 w-full sm:w-auto"
                        >
                            {buttonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IngredientForm;
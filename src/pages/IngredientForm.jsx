import React, { useState, useEffect } from 'react';
import ObservationsModal from '../components/modals/ObservationsModal';

const IngredientForm = ({ onSubmit, onCancel, initialData, pageTitle, buttonText }) => {
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

    const [isModalOpen, setIsModalOpen] = useState(false);
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
        const ingredientData = {
            id: ingredient.id,
            name: ingredient.name,
            brand: ingredient.brand,
            purchaseDate: ingredient.purchaseDate,
            stockInBaseUnit: stockInBaseUnit,
            baseUnit: ingredient.baseUnit,
            displayUnit: ingredient.displayUnit,
            displayUnitFactor: displayUnitFactor,
            displayUnitPrice: displayUnitPrice,
            costPerBaseUnit: costPerBaseUnit,
            expiryDate: ingredient.expiryDate,
            observations: ingredient.observations,
        };
        onSubmit(ingredientData);
    };

    const handleSaveObservations = (text) => setIngredient(prev => ({ ...prev, observations: text }));

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">{pageTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Nome do Ingrediente</label>
                            <input id="name" name="name" type="text" value={ingredient.name} onChange={handleChange} required placeholder="Ex: Leite Condensado" className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        </div>
                        <div>
                            <label htmlFor="brand" className="block text-gray-700 font-bold mb-2">Marca</label>
                            <input id="brand" name="brand" type="text" value={ingredient.brand} onChange={handleChange} placeholder="Ex: Moça, Itambé" className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="purchaseDate" className="block text-gray-700 font-bold mb-2">Data da Compra</label>
                            <input id="purchaseDate" name="purchaseDate" type="date" value={ingredient.purchaseDate} onChange={handleChange} className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                        </div>
                        <div>
                            <label htmlFor="expiryDate" className="block text-gray-700 font-bold mb-2">Validade</label>
                            <input id="expiryDate" name="expiryDate" type="date" value={ingredient.expiryDate} onChange={handleChange} className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        </div>
                    </div>
                    <div className="p-4 border border-purple-200 rounded-lg space-y-4">
                        <h3 className="font-bold text-lg text-purple-800">Definição da Embalagem</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="displayUnit" className="block text-gray-700 font-bold mb-2">Nome da Embalagem</label>
                                <input id="displayUnit" name="displayUnit" type="text" value={ingredient.displayUnit} onChange={handleChange} placeholder="Ex: pacote, lata, kg" className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                            </div>
                            <div>
                                <label htmlFor="displayUnitFactor" className="block text-gray-700 font-bold mb-2">Conteúdo da Embalagem</label>
                                <div className="flex">
                                    <input id="displayUnitFactor" name="displayUnitFactor" type="number" step="any" value={ingredient.displayUnitFactor} onChange={handleChange} placeholder="Ex: 1000" className="shadow-inner appearance-none border rounded-l-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                                    <select name="baseUnit" value={ingredient.baseUnit} onChange={handleChange} className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg px-2 font-semibold text-gray-700 focus:outline-none">
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
                                    Preço por {ingredient.displayUnit || 'Embalagem'} (R$)
                                </label>
                                <input id="displayUnitPrice" name="displayUnitPrice" type="number" step="0.01" value={ingredient.displayUnitPrice} onChange={handleChange} placeholder="Ex: 5.99" className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Custo Calculado por {ingredient.baseUnit}</label>
                                <input type="text" value={`R$ ${costPerBaseUnit.toFixed(5).replace('.', ',')}`} readOnly className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 bg-gray-100 cursor-not-allowed"/>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border border-green-200 rounded-lg space-y-4">
                        <h3 className="font-bold text-lg text-green-800">Controle de Estoque</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="displayQuantity" className="block text-gray-700 font-bold mb-2">Qtde. de Embalagens</label>
                                <input id="displayQuantity" name="displayQuantity" type="number" step="any" value={ingredient.displayQuantity} onChange={handleChange} placeholder="Ex: 5" className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400" required/>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2">Estoque Total Calculado</label>
                                <input type="text" value={`${stockInBaseUnit.toFixed(2).replace('.', ',')} ${ingredient.baseUnit}`} readOnly className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 bg-gray-100 cursor-not-allowed"/>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Observações</label>
                        <button type="button" onClick={() => setIsModalOpen(true)} className={`w-full text-left py-3 px-4 rounded-lg transition duration-300 ${ingredient.observations ? 'bg-purple-100 hover:bg-purple-200 text-purple-800' : 'bg-gray-100 hover:bg-gray-200'}`}>
                            {ingredient.observations ? 'Ver/Editar Observações' : 'Adicionar Observações'}
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-300 w-full sm:w-auto">Cancelar</button>
                        <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 w-full sm:w-auto">{buttonText}</button>
                    </div>
                </form>
            </div>
            {isModalOpen && <ObservationsModal initialText={ingredient.observations} onSave={handleSaveObservations} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default IngredientForm;
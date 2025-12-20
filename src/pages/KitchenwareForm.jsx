import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { useToast } from '../hooks/useToast';

const KitchenwareForm = ({ onSubmit, onCancel, initialData, pageTitle, buttonText }) => {
    const toast = useToast();
    const [utensil, setUtensil] = useState({
        name: '',
        quantity: '',
        condition: 'Bom', 
        observations: '' 
    });

    useEffect(() => {
        if (initialData) {
            setUtensil({
                id: initialData.id,
                name: initialData.name || '',
                quantity: initialData.quantity || '',
                condition: initialData.condition || 'Bom',
                observations: initialData.observations || ''
            });
        } else {
            setUtensil({ name: '', quantity: '', condition: 'Bom', observations: '' });
        }
    }, [initialData]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUtensil(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!utensil.name || typeof utensil.name !== 'string' || utensil.name.trim().length === 0) {
            toast.error('Nome invalido', 'O nome do utensilio eh obrigatorio');
            return;
        }
        
        const quantity = parseInt(utensil.quantity, 10);
        if (isNaN(quantity) || quantity < 0) {
            toast.error('Quantidade invalida', 'A quantidade deve ser um numero nao-negativo');
            return;
        }
        
        if (!['Novo', 'Bom', 'Desgastado'].includes(utensil.condition)) {
            toast.error('Condicao invalida', 'Selecione uma condicao valida');
            return;
        }
        
        const utensilData = {
            id: utensil.id,
            name: String(utensil.name).substring(0, 100),
            quantity: quantity,
            condition: utensil.condition,
            observations: String(utensil.observations || '').substring(0, 150)
        };
        logger.info('Enviando utensilio', { 
            name: utensilData.name,
            quantity: utensilData.quantity
        });
        onSubmit(utensilData);
    };

    const MAX_LEN = 150;
    const remaining = Math.max(0, MAX_LEN - (utensil.observations?.length || 0));

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <div className="bg-white p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">{pageTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Nome do Utensilio</label>
                        <input 
                            id="name" 
                            name="name" 
                            type="text" 
                            value={utensil.name} 
                            onChange={handleChange} 
                            required 
                            maxLength="100"
                            placeholder="Ex: Batedeira Planetaria" 
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="quantity" className="block text-gray-700 font-bold mb-2">Quantidade</label>
                            <input 
                                id="quantity" 
                                name="quantity" 
                                type="number" 
                                min="0"
                                value={utensil.quantity} 
                                onChange={handleChange} 
                                required 
                                placeholder="Ex: 2" 
                                className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                            />
                        </div>
                        <div>
                            <label htmlFor="condition" className="block text-gray-700 font-bold mb-2">Condicao</label>
                            <select 
                                id="condition" 
                                name="condition" 
                                value={utensil.condition} 
                                onChange={handleChange} 
                                required 
                                className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                                <option value="Novo">Novo</option>
                                <option value="Bom">Bom</option>
                                <option value="Desgastado">Desgastado</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="observations" className="block text-gray-700 font-bold mb-2">Observacoes</label>
                        <input
                            type="text"
                            id="observations"
                            name="observations"
                            value={utensil.observations}
                            onChange={handleChange}
                            maxLength={MAX_LEN}
                            placeholder="Sem gluten, vegano, etc..."
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {utensil.observations.length}/{MAX_LEN} caracteres restam {remaining}
                        </p>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg">{buttonText}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KitchenwareForm;
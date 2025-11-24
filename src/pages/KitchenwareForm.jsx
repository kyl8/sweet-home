import React, { useState, useEffect } from 'react';
import ObservationsModal from '../components/modals/ObservationsModal'; 

const KitchenwareForm = ({ onSubmit, onCancel, initialData, pageTitle, buttonText }) => {
    const [utensil, setUtensil] = useState({
        name: '',
        quantity: '',
        condition: 'Bom', 
        observations: '' 
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        const utensilData = {
            ...utensil,
            quantity: parseInt(utensil.quantity, 10) || 0,
        };
        onSubmit(utensilData);
    };
    
    const handleSaveObservations = (text) => {
        setUtensil(prev => ({ ...prev, observations: text }));
    };

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <div className="bg-white p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">{pageTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Nome do Utensílio</label>
                        <input id="name" name="name" type="text" value={utensil.name} onChange={handleChange} required placeholder="Ex: Batedeira Planetária" className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="quantity" className="block text-gray-700 font-bold mb-2">Quantidade</label>
                            <input id="quantity" name="quantity" type="number" value={utensil.quantity} onChange={handleChange} required placeholder="Ex: 2" className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                        </div>
                        <div>
                            <label htmlFor="condition" className="block text-gray-700 font-bold mb-2">Condição</label>
                            <select id="condition" name="condition" value={utensil.condition} onChange={handleChange} required className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                                <option value="Novo">Novo</option>
                                <option value="Bom">Bom</option>
                                <option value="Desgastado">Desgastado</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">Observações</label>
                        <button type="button" onClick={() => setIsModalOpen(true)} className={`w-full text-left py-3 px-4 rounded-lg transition duration-300 ${utensil.observations ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' : 'bg-gray-100 hover:bg-gray-200'}`}>
                            {utensil.observations ? 'Ver/Editar Observações' : 'Adicionar Observações'}
                        </button>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg">{buttonText}</button>
                    </div>
                </form>
            </div>

            {isModalOpen && (
                <ObservationsModal 
                    initialText={utensil.observations}
                    onSave={handleSaveObservations}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default KitchenwareForm;
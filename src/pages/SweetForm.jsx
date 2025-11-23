import { useState, useEffect } from 'react';
import ObservationsModal from '../components/modals/ObservationsModal';

const SweetForm = ({ onSubmit, onCancel, initialData, pageTitle, buttonText }) => {
    const [sweet, setSweet] = useState({
        name: '',
        unitName: 'unidade', 
        unitWeight: '',      
        stock: '',
        price: '',
        expiry_date: '',
        image: '',
        observations: ''
    });

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (initialData) {
            setSweet({
                ...initialData,
                unitName: initialData.unitName || 'unidade',
                unitWeight: initialData.unitWeight || '',
                observations: initialData.observations || ''
            });
        } else {
            setSweet({
                name: '', unitName: 'unidade', unitWeight: '', stock: '', price: '',
                expiry_date: '', image: '', observations: ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSweet(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveObservations = (text) => {
        setSweet(prev => ({ ...prev, observations: text }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const sweetData = {
            ...sweet,
            stock: parseInt(sweet.stock, 10) || 0,
            price: parseFloat(sweet.price) || 0,
            unitWeight: parseFloat(sweet.unitWeight) || 0
        };
        onSubmit(sweetData);
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">{pageTitle}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Nome do Doce</label>
                    <input type="text" id="name" name="name" value={sweet.name} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="stock">Estoque (em unidades)</label>
                        <input type="number" id="stock" name="stock" value={sweet.stock} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700" required />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="price">Preço por Unidade (R$)</label>
                        <input type="number" step="0.01" id="price" name="price" value={sweet.price} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700" required />
                    </div>
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2" htmlFor="expiry_date">Data de Validade</label>
                    <input type="date" id="expiry_date" name="expiry_date" value={sweet.expiry_date} onChange={handleChange} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700" required />
                </div>
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Observações</label>
                    <button type="button" onClick={() => setIsModalOpen(true)} className={`w-full text-left py-3 px-4 rounded-lg transition duration-300 ${sweet.observations ? 'bg-pink-100 hover:bg-pink-200 text-pink-800' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        {sweet.observations ? 'Ver/Editar Observações' : 'Adicionar Observações'}
                    </button>
                </div>
                <div className="flex items-center justify-end space-x-4 pt-4">
                    <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        {buttonText}
                    </button>
                </div>
            </form>

            {isModalOpen && (
                <ObservationsModal 
                    initialText={sweet.observations}
                    onSave={handleSaveObservations}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}

export default SweetForm;
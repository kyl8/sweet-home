import { useState, useEffect } from 'react';
import { validators } from '../utils/validators';
import { sanitizeInput } from '../utils/sanitizer';
import { logger } from '../utils/logger';
import ObservationsModal from '../components/modals/ObservationsModal';

const SweetForm = ({ onSubmit, onCancel, initialData, pageTitle, buttonText, isSubmitting }) => {
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
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setSweet({
        ...initialData,
        unitName: initialData.unitName || 'unidade',
        unitWeight: initialData.unitWeight || '',
        observations: initialData.observations || ''
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const errors = {};

    if (!sweet.name.trim()) {
      errors.name = 'Nome do doce é obrigatório';
    } else if (!validators.isValidSweetName(sweet.name)) {
      errors.name = 'O nome do doce deve ter entre 2 e 100 caracteres';
    }

    if (!sweet.stock || !validators.isValidNumber(sweet.stock)) {
      errors.stock = 'O estoque deve ser um número válido';
    }

    if (!sweet.price || !validators.isValidPrice(sweet.price)) {
      errors.price = 'O preço deve ser um número válido maior que 0';
    }

    if (!sweet.expiry_date || !validators.isValidDate(sweet.expiry_date)) {
      errors.expiry_date = 'Uma data de validade válida é obrigatória';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSweet(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSaveObservations = (text) => {
    setSweet(prev => ({ ...prev, observations: text }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const sweetData = {
        ...sweet,
        name: sanitizeInput(sweet.name),
        stock: parseInt(sweet.stock, 10),
        price: parseFloat(sweet.price),
        unitWeight: parseFloat(sweet.unitWeight) || 0
      };

      onSubmit(sweetData);
    } catch (error) {
      logger.error('Erro ao enviar o formulário do doce', { error: error.message });
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">{pageTitle}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-bold mb-2" htmlFor="name">
            Nome do Doce
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={sweet.name}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 ${
              validationErrors.name ? 'border-red-500' : ''
            }`}
            required
          />
          {validationErrors.name && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="stock">
              Estoque (unidades)
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={sweet.stock}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 ${
                validationErrors.stock ? 'border-red-500' : ''
              }`}
              required
            />
            {validationErrors.stock && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.stock}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="price">
              Preço (R$)
            </label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              value={sweet.price}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 ${
                validationErrors.price ? 'border-red-500' : ''
              }`}
              required
            />
            {validationErrors.price && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.price}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2" htmlFor="expiry_date">
            Data de Validade
          </label>
          <input
            type="date"
            id="expiry_date"
            name="expiry_date"
            value={sweet.expiry_date}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 ${
              validationErrors.expiry_date ? 'border-red-500' : ''
            }`}
            required
          />
          {validationErrors.expiry_date && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.expiry_date}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Observações</label>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={isSubmitting}
            className={`w-full text-left py-3 px-4 rounded-lg transition duration-300 ${
              sweet.observations
                ? 'bg-pink-100 hover:bg-pink-200 text-pink-800'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {sweet.observations ? 'Ver/Editar Observações' : 'Adicionar Observações'}
          </button>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
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
};

export default SweetForm;
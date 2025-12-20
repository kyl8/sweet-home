import { useState, useEffect } from 'react';
import { validators } from '../utils/validators';
import { sanitizeInput } from '../utils/sanitizer';
import { logger } from '../utils/logger';

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

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setSweet({
        id: initialData.id,
        name: initialData.name || '',
        unitName: initialData.unitName || 'unidade',
        unitWeight: initialData.unitWeight || '',
        stock: initialData.stock || '',
        price: initialData.price || '',
        expiry_date: initialData.expiry_date || '',
        image: initialData.image || '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const sweetData = {
        id: sweet.id,
        name: sanitizeInput(sweet.name),
        stock: parseInt(sweet.stock, 10),
        price: parseFloat(sweet.price),
        unitWeight: parseFloat(sweet.unitWeight) || 0,
        unitName: sweet.unitName,
        expiry_date: sweet.expiry_date,
        image: sweet.image,
        observations: sweet.observations || ''
      };

      logger.info('Enviando doce com observações', { observations: sweetData.observations });
      onSubmit(sweetData);
    } catch (error) {
      logger.error('Erro ao enviar o formulário do doce', { error: error.message });
    }
  };

  const MAX_LEN = 150;
  const remaining = Math.max(0, MAX_LEN - (sweet.observations?.length || 0));

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
          <label className="block text-gray-700 font-bold mb-2" htmlFor="observations">
            Observações
          </label>
          <input
            type="text"
            id="observations"
            name="observations"
            value={sweet.observations}
            onChange={handleChange}
            disabled={isSubmitting}
            maxLength={MAX_LEN}
            placeholder="Sem glúten, vegano, etc..."
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <p className="text-sm text-gray-500 mt-1">
            {sweet.observations.length}/{MAX_LEN} caracteres • restam {remaining}
          </p>
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
    </div>
  );
};

export default SweetForm;
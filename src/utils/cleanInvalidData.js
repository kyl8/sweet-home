import { logger } from './logger';

export const cleanInvalidData = (data) => {
  if (!Array.isArray(data)) {
    logger.warn('cleanInvalidData recebeu non-array');
    return [];
  }

  return data.filter(item => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const hasValidId = item.id && item.id !== 'undefined' && item.id !== 'null';
    const hasValidName = item.name || item.sweetName || item.payer || item.receiver;

    if (!hasValidId || !hasValidName) {
      logger.warn('Documento invalido removido', { itemId: item.id });
      return false;
    }

    return true;
  });
};

export const validateDataStructure = (data, expectedFields) => {
  if (!Array.isArray(expectedFields)) {
    return { valid: false, errors: ['expectedFields deve ser array'] };
  }

  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['data deve ser um objeto'] };
  }

  for (const field of expectedFields) {
    if (!(field in data)) {
      errors.push(`Campo obrigatorio ausente: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

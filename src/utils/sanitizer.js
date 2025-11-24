export const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return dirty.replace(/[&<>"']/g, (char) => map[char]);
};

export const sanitizeInput = (input, maxLength = 500) => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '');
};

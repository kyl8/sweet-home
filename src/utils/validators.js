export const validators = {
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isValidUsername: (username) => {
    return username.length >= 3 && username.length <= 50;
  },
  
  isValidPassword: (password) => {
    return password.length >= 6;
  },
  
  isValidNumber: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num >= 0;
  },
  
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },
  
  isValidSweetName: (name) => {
    return name.length >= 2 && name.length <= 100;
  },
  
  isValidPrice: (price) => {
    const num = parseFloat(price);
    return !isNaN(num) && isFinite(num) && num > 0;
  }
};

export const calculatePasswordStrength = (password) => {
  if (!password) return 0;

  let strength = 0;

  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;

  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/\d/.test(password)) strength += 15;
  if (/[@$!%*?&#^()_+=\-[\]{};:'",.<>?/|\\`~]/.test(password)) strength += 15;

  return Math.min(100, strength);
};

export const getPasswordStrengthLabel = (strength) => {
  if (strength < 25) return 'Muito fraca';
  if (strength < 50) return 'Fraca';
  if (strength < 75) return 'Forte';
  return 'Muito forte';
};

export const getPasswordStrengthColor = (strength) => {
  if (strength < 25) return 'bg-red-500';
  if (strength < 50) return 'bg-orange-500';
  if (strength < 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

export const getPasswordStrengthTextColor = (strength) => {
  if (strength < 25) return 'text-red-600';
  if (strength < 50) return 'text-orange-600';
  if (strength < 75) return 'text-yellow-600';
  return 'text-green-600';
};

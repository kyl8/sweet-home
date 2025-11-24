export const calculatePasswordStrength = (password) => {
  if (!password) return 0;

  let strength = 0;

  if (password.length >= 6) strength += 15;
  if (password.length >= 8) strength += 15;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;

  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

  return Math.min(strength, 100);
};

export const getPasswordStrengthLabel = (strength) => {
  if (strength === 0) return 'Nenhuma';
  if (strength < 20) return 'Muito Fraca';
  if (strength < 40) return 'Fraca';
  if (strength < 60) return 'Média';
  if (strength < 80) return 'Forte';
  return 'Muito Forte';
};

export const getPasswordStrengthColor = (strength) => {
  if (strength === 0) return 'bg-gray-300';
  if (strength < 20) return 'bg-red-600';
  if (strength < 40) return 'bg-red-500';
  if (strength < 60) return 'bg-yellow-500';
  if (strength < 80) return 'bg-blue-500';
  return 'bg-green-500';
};

export const getPasswordStrengthTextColor = (strength) => {
  if (strength === 0) return 'text-gray-600';
  if (strength < 20) return 'text-red-600';
  if (strength < 40) return 'text-red-500';
  if (strength < 60) return 'text-yellow-600';
  if (strength < 80) return 'text-blue-600';
  return 'text-green-600';
};

import React, { useMemo } from 'react';
import { calculatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor, getPasswordStrengthTextColor } from '../utils/passwordStrength';

const PasswordStrengthMeter = ({ password }) => {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const label = useMemo(() => getPasswordStrengthLabel(strength), [strength]);
  const barColor = useMemo(() => getPasswordStrengthColor(strength), [strength]);
  const textColor = useMemo(() => getPasswordStrengthTextColor(strength), [strength]);

  return (
    <div className="mt-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600">Força da Senha:</span>
        <span className={`text-xs font-bold ${textColor}`}>{label}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${barColor}`}
          style={{ 
            width: `${strength}%`,
            minWidth: strength > 0 ? '4px' : '0px'
          }}
        ></div>
      </div>
      
      {password && strength < 60 && (
        <div className="mt-3 text-xs text-gray-600 space-y-1.5 bg-gray-50 p-3 rounded-lg">
          <p className="font-semibold text-gray-700">💡 Dicas para uma senha mais forte:</p>
          <ul className="list-disc list-inside space-y-1">
            {password.length < 8 && <li>Use pelo menos 8 caracteres</li>}
            {!/[A-Z]/.test(password) && <li>Adicione letras maiúsculas (A-Z)</li>}
            {!/[0-9]/.test(password) && <li>Adicione números (0-9)</li>}
            {!/[^a-zA-Z0-9]/.test(password) && <li>Adicione caracteres especiais (!@#$%)</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;

import Swal from 'sweetalert2';
import { logger } from '../utils/logger';

export const useToast = () => {
  const showSuccess = (title, message = '', duration = 3000) => {
    logger.info(`Toast sucesso: ${title}`);
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      timer: duration,
      timerProgressBar: true,
      showConfirmButton: false,
      position: 'top-end',
      toast: true,
      background: '#f0fdf4',
      color: '#166534',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  };

  const showError = (title, message = '', duration = 4000) => {
    logger.warn(`Toast erro: ${title}`);
    return Swal.fire({
      icon: 'error',
      title,
      text: message,
      timer: duration,
      timerProgressBar: true,
      showConfirmButton: false,
      position: 'top-end',
      toast: true,
      background: '#fef2f2',
      color: '#991b1b',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  };

  const showWarning = (title, message = '', duration = 3500) => {
    logger.warn(`Toast aviso: ${title}`);
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      timer: duration,
      timerProgressBar: true,
      showConfirmButton: false,
      position: 'top-end',
      toast: true,
      background: '#fefce8',
      color: '#854d0e',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  };

  const showInfo = (title, message = '', duration = 3000) => {
    logger.info(`Toast info: ${title}`);
    return Swal.fire({
      icon: 'info',
      title,
      text: message,
      timer: duration,
      timerProgressBar: true,
      showConfirmButton: false,
      position: 'top-end',
      toast: true,
      background: '#f0f9ff',
      color: '#0c4a6e',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  };

  const showConfirmation = (title, message = '', confirmText = 'Confirmar', cancelText = 'Cancelar') => {
    return Swal.fire({
      title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ec4899',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: false
    });
  };

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    confirm: showConfirmation
  };
};

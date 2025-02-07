import { X, AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';

const ErrorModal = ({ error, onClose }) => {
  if (!error) return null;

  const errorMessages = {
    'Username already exists': {
      title: 'Nombre de usuario no disponible',
      description: 'El nombre de usuario que has elegido ya está en uso. Por favor, elige otro.',
      suggestions: [
        'Intenta con un nombre de usuario diferente',
        'Agrega números o caracteres especiales',
        'Usa una variación de tu nombre original'
      ]
    },
    'Invalid credentials': {
      title: 'Inicio de sesión fallido',
      description: 'Las credenciales proporcionadas no son válidas. Verifica tu usuario y contraseña.',
      suggestions: [
        'Revisa que no haya errores de escritura',
        'Asegúrate de usar mayúsculas/minúsculas correctamente',
        'Restablece tu contraseña si es necesario'
      ]
    },
    'default': {
      title: 'Error en la solicitud',
      description: 'Ha ocurrido un problema inesperado. Inténtalo de nuevo más tarde.',
      suggestions: [
        'Verifica tu conexión a internet',
        'Recarga la página',
        'Contacta al soporte técnico si el problema persiste'
      ]
    }
  };

  const errorData = errorMessages[error.message] || errorMessages['default'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#9b9b9b] bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <div className="flex items-center mb-4 text-red-600">
          <AlertTriangle size={32} className="mr-3" />
          <h2 className="text-xl font-bold">{errorData.title}</h2>
        </div>

        <p className="text-gray-700 mb-4">{errorData.description}</p>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="font-semibold text-red-700 mb-2">Sugerencias:</h3>
          <ul className="list-disc list-inside text-gray-600">
            {errorData.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>

        {error.statusCode && (
          <div className="mt-4 text-sm text-gray-500">
            Código de error: {error.statusCode}
          </div>
        )}
      </div>
    </div>
  );
};

ErrorModal.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string.isRequired,
    statusCode: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ErrorModal;
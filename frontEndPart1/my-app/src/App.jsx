import { useState, useEffect } from 'react';
import axios from 'axios';
import validator from 'validator';
import ViewUsers from './templates/ViewUsers';
import ErrorModal from './components/ErrorModal';

axios.interceptors.request.use(request => {
  console.log('Request:', request);
  return request;
});

axios.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
});

function App() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    birthDate: '',
    fullName: '',
  });
  const [isLogin, setIsLogin] = useState(true);
  const [backendMessage, setBackendMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [ip, setIp] = useState('');
  const [ipData, setIpData] = useState('');

  useEffect(() => {
    const fetchBackendMessage = async () => {
      try {
        const response = await axios.get('http://localhost:8082/');
        setBackendMessage(response.data.message || 'Bienvenido!');
      } catch (error) {
        console.error('Error al obtener mensaje del backend:', error);
      }
    };
    const getIp = async () => {
      try {
        const resIp = await axios.get('http://localhost:8082/ip');
        // Guardamos lo que se mostraba en el console.log
        setIpData(resIp.data.data);
        setIp(resIp.data.ip);
      } catch (error) {
        console.error('Error al obtener dirección IP:', error);
      }
    };
    getIp();
    fetchBackendMessage();
  }, []);

  const validateForm = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'username':
        {
          const formattedValue = value.toLowerCase().replace(/\s+/g, '').slice(0, 10);
          if (!formattedValue) {
            newErrors.username = {
              message: 'El nombre de usuario es obligatorio',
              details: [
                'No puede estar vacío',
                'Máximo 10 caracteres',
                'Solo letras y números'
              ]
            };
          } else if (!validator.isAlphanumeric(formattedValue)) {
            newErrors.username = {
              message: 'Formato de nombre de usuario inválido',
              details: [
                'Solo se permiten letras y números',
                'Sin espacios',
                'Sin caracteres especiales'
              ]
            };
          } else {
            delete newErrors.username;
          }
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = {
            message: 'La contraseña es obligatoria',
            details: [
              'Mínimo 6 caracteres',
              'Al menos un número',
              'Combinación de letras y números'
            ]
          };
        } else if (!validator.isStrongPassword(value, { minLength: 6, minNumbers: 1 })) {
          newErrors.password = {
            message: 'Contraseña débil',
            details: [
              'Mínimo 6 caracteres',
              'Al menos un número',
              'Combina mayúsculas, minúsculas y símbolos'
            ]
          };
        } else {
          delete newErrors.password;
        }
        break;

      case 'email':
        if (!value) {
          newErrors.email = {
            message: 'El correo electrónico es obligatorio',
            details: [
              'Formato válido requerido',
              'Ejemplo: nombre@dominio.com'
            ]
          };
        } else if (!validator.isEmail(value)) {
          newErrors.email = {
            message: 'Correo electrónico inválido',
            details: [
              'Debe contener @ y dominio',
              'Sin espacios',
              'Formato correcto: nombre@dominio.com'
            ]
          };
        } else {
          delete newErrors.email;
        }
        break;

      case 'birthDate':
        if (!value) {
          newErrors.birthDate = {
            message: 'Fecha de nacimiento requerida',
            details: [
              'Selecciona una fecha válida',
              'Debes ser mayor de edad'
            ]
          };
        } else if (!validator.isDate(value)) {
          newErrors.birthDate = {
            message: 'Fecha de nacimiento inválida',
            details: [
              'Formato de fecha incorrecto',
              'Selecciona una fecha real'
            ]
          };
        } else {
          delete newErrors.birthDate;
        }
        break;

      case 'fullName':
        if (!value.trim()) {
          newErrors.fullName = {
            message: 'Nombre completo es obligatorio',
            details: [
              'Mínimo 2 caracteres',
              'Incluye nombre y apellido',
              'Sin números ni caracteres especiales'
            ]
          };
        } else if (!validator.isLength(value.trim(), { min: 2 })) {
          newErrors.fullName = {
            message: 'Nombre muy corto',
            details: [
              'Mínimo 2 caracteres',
              'Incluye nombre y apellido'
            ]
          };
        } else {
          delete newErrors.fullName;
        }
        break;
    }

    setErrors(newErrors);

    const loginValidation = isLogin
      ? form.username && form.password
      : form.username && form.password && form.email && form.birthDate && form.fullName;

    setIsValid(Object.keys(newErrors).length === 0 && loginValidation);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === 'username'
      ? value.toLowerCase().replace(/\s+/g, '').slice(0, 10)
      : value;

    setForm({ ...form, [name]: formattedValue });
    validateForm(name, formattedValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Enviando datos:', {
      username: form.username,
      password: form.password
    });
    try {
      if (!isLogin) {
        const response = await axios.post('http://localhost:8082/register', form);
        alert(response.data.message);
        setForm({ username: '', password: '', email: '', birthDate: '', fullName: '' });
        setIsValid(false);
      } else {
        console.log('Intentando login con:', {
          headers: {
            Username: form.username,
            Password: form.password
          }
        });
        const response = await axios.get('http://localhost:8082/validate', {
          headers: {
            Username: form.username,
            Password: form.password
          }
        });
        alert(response.data.intMessage);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error al procesar la solicitud:', error.response?.data);
      setServerError(error.response?.data || {
        message: 'Error de conexión',
        statusCode: 500
      });
    }
  };

  const renderFormFields = () => {
    const loginFields = ['username', 'password'];
    const registerFields = ['username', 'password', 'email', 'birthDate', 'fullName'];
    const fieldsToRender = isLogin ? loginFields : registerFields;

    return fieldsToRender.map((field) => (
      <div key={field} className="mb-4">
        <label className="block mb-2 capitalize font-semibold text-gray-700">
          {field.replace(/([A-Z])/g, ' $1')}
        </label>
        <input
          type={field === 'password' ? 'password' : field === 'birthDate' ? 'date' : 'text'}
          name={field}
          value={form[field]}
          onChange={handleChange}
          onInput={handleChange}
          className={`border p-2 w-full rounded ${errors[field]
            ? 'border-red-500 bg-red-50'
            : 'border-blue-500 focus:ring-2 focus:ring-blue-300'}`}
        />
        {errors[field] && (
          <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold block mb-1">{errors[field].message}</strong>
            <ul className="list-disc list-inside text-sm">
              {errors[field].details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ));
  };

  if (isLoggedIn) {
    return <ViewUsers />;
  }

  return (
    <div>
      {serverError && (
        <ErrorModal
          error={serverError}
          onClose={() => setServerError(null)}
        />
      )}
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {isLogin ? 'Iniciar Sesión' : 'Registro de Usuarios'}
        </h1>
        <p className="text-gray-600 mb-4">{backendMessage}</p>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white p-6 rounded-lg shadow-md w-full max-w-md"
        >
          {renderFormFields()}
          <button
            type="submit"
            disabled={!isValid}
            className={`p-2 w-full rounded transition-all duration-300 ${isValid
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
          >
            {isLogin ? 'Iniciar sesión' : 'Registrar usuario'}
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="mt-4 text-blue-500 underline hover:text-blue-700 transition-colors text-center w-full"
            style={{ textDecorationThickness: '2px', cursor: 'pointer' }}
          >
            {isLogin
              ? '¿No tienes una cuenta? Regístrate'
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </form>
        <div className="text-gray-600 mb-4 mt-8 text-center text-sm">
          Dirección IP: {ip}
          {ipData && <div>{ipData}</div>}
        </div>
      </div>
    </div>
  );
}

export default App;

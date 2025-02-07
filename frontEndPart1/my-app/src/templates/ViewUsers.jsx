import { useState, useEffect } from 'react';
import axios from 'axios';

function ViewUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    password: '',
    email: '',
    birthDate: '',
    fullName: ''
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get('http://localhost:8082/users');
      const usuariosData = Object.values(response.data.data || {});
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      setUsuarios([]);
    }
  };

  const handleDelete = async (userId) => {
    const confirmDelete = window.confirm('¿Estás seguro de eliminar este usuario?');
    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:8082/users/${userId}`);
        fetchUsuarios();
        alert('Usuario eliminado exitosamente');
        navigator.vibrate([200, 100, 200]);
        window.location.reload();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('No se pudo eliminar el usuario');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      password: '',
      email: user.email,
      birthDate: user.birthDate,
      fullName: user.fullName
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`http://localhost:8082/users/${editingUser.id}`, {
        ...form,
        username: editingUser.username
      });
      alert('Usuario actualizado exitosamente');
      setEditingUser(null);
      setForm({ password: '', email: '', birthDate: '', fullName: '' });
      fetchUsuarios();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert('No se pudo actualizar el usuario');
    }
  };

  const renderEditForm = () => {
    if (!editingUser) return null;

    return (
      <form onSubmit={handleUpdate} className="mb-4 bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-semibold mb-4">Editar Usuario</h2>
        {['email', 'birthDate', 'fullName', 'password'].map((field) => (
          <div key={field} className="mb-4">
            <label className="block mb-1 capitalize font-semibold text-gray-700">
              {field === 'birthDate' ? 'Fecha de Nacimiento' :
                field === 'fullName' ? 'Nombre Completo' :
                  field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type={field === 'password' ? 'password' : field === 'birthDate' ? 'date' : 'text'}
              name={field}
              value={form[field]}
              onChange={handleChange}
              className="border p-3 w-full rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <div className="flex justify-between">
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setEditingUser(null)}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <a href="/" className="text-blue-500 hover:text-blue-600 transition duration-200 mb-4"> ← Volver al Inicio</a>
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Usuarios Registrados</h1>

      {editingUser && renderEditForm()}

      <div className="w-full max-w-2xl">
        <ul className="bg-white p-6 rounded-lg shadow-lg">
          {usuarios.length > 0 ? (
            usuarios.map((user) => (
              <li key={user.id} className="border-b last:border-b-0 py-4 flex flex-col md:flex-row md:justify-between md:items-center">
                <div className="mb-4 md:mb-0">
                  <p className="font-semibold text-lg text-gray-800">{user.username}</p>
                  <a href={`mailto:${user.email}`} className="text-blue-500">{user.email}</a>
                  <p className="text-gray-600">{user.fullName}</p>
                  <p className="text-gray-600">{user.birthDate}</p>
                </div>
                <div className="flex space-x-4">
                  <button
                    className="text-red-500 hover:text-red-600 transition duration-200"
                    onClick={() => handleDelete(user.id)}
                  >
                    Eliminar
                  </button>
                  <button
                    className="text-blue-500 hover:text-blue-600 transition duration-200"
                    onClick={() => handleEdit(user)}
                  >
                    Editar
                  </button>
                </div>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No hay usuarios registrados</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default ViewUsers;
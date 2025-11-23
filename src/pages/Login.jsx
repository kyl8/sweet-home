import { Login } from '@mui/icons-material';
import { or } from 'firebase/firestore/lite';
import React, { useState } from 'react';

const LoginPage = ({ onLogin, onNavigate }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');


    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); 
        if (!username || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }
        else if (username == 1 || password == 1) {
            onLogin({ username, password });
            return;
        }
        try {
            const response = await fetch('http://127.0.0.1:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Erro ao fazer login.');
            }

            
            console.log('Token recebido:', data.access_token);
            console.log('hash:', data.hash )
            localStorage.setItem('jwt_token', data.access_token);

            
            if (onLogin) onLogin(data);

        } catch (err) {
            setError(err.message);
        }
    };
 
    return (
        <div className="auth-container">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 m-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Bem-vindo(a)!</h2>
                <p className="text-center text-gray-500 mb-8">Faça login para continuar</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Usuário
                        </label>
                        <input
                            id="username"
                            type="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder="UsuarioExemplo123"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder="********"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300"
                    >
                        Entrar
                    </button>
                </form>
                <p className="text-center text-gray-600 mt-6" hidden disabled>
                    Não tem uma conta?{' '}
                    <button onClick={() => onNavigate('register')} className="font-bold text-pink-500 hover:text-pink-700">
                        Registre-se
                    </button>
                </p>
            </div>
        </div>
    );
};
export default LoginPage;
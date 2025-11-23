import React from 'react';
import { useState, useEffect } from 'react';

const RegisterPage = ({ onRegister, onNavigate }) => {
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [errors, setErrors] = React.useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]); 

        try {
            //tenta conexao com api de registro
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, confirmPassword, email }),
            });

            const data = await response.json();

            //se a resposta nao for ok, exibe os erros
            if (!response.ok) {
                for (const key in data.errors) {
                    for (const error in data.errors[key]) {
                        setErrors([data.errors[key][error]]);
                    }
                }
            }
            else {
                //se tudo der certo, redireciona para a pagina de login
                onRegister(data);
            }
        } catch (error) {
            setErrors(['Ocorreu um erro desconhecido.']);
        }


    };

    useEffect(() => {
        setErrors([]);
    }, []);

    return (
        <div className="auth-container">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 m-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Crie sua Conta</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        {errors.length > 0 && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                                <strong className="font-bold">Ocorreu um erro!</strong>
                                <ul className="list-disc list-inside">
                                    {errors.map((error, index) => {
                                        if (typeof error === 'string') {
                                            return <li key={index}>{error}</li>;
                                        }
                                        if (typeof error === 'object' && error !== null) {
                                            const values = Object.values(error);
                                            if (values.length > 0) {
                                                if (Array.isArray(values[0])) {
                                                    return values[0].map((msg, i) => (
                                                        <li key={index + '-' + i}>{msg}</li>
                                                    ));
                                                }
                                                return <li key={index}>{values[0]}</li>;
                                            }
                                        }
                                        return null;
                                    })}
                                </ul>
                            </div>
                        )}
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Usuário
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder="Digite seu nome"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder="Digite seu email"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder="Digite sua senha"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-400"
                            placeholder="Confirme sua senha"
                            required
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        type="submit"
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                    >
                        Registrar
                    </button>
                </form>
                <p className="text-center text-gray-600 mt-6">
                    Já tem uma conta?{' '}
                    <button
                        type="button"
                        onClick={() => onNavigate('login')}
                        className="font-bold text-pink-500 hover:text-pink-700"
                    >
                        Faça Login
                    </button>
                </p>
            </div>
        </div>
    );
};
export default RegisterPage;
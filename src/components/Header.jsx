import React from 'react';
import { MonetizationOn, PointOfSale, ExitToApp, ArrowBack } from '@mui/icons-material';

const Header = ({ onLogout, onNavigate, currentPage }) => {
    const isFinancePage = currentPage === 'finance';
    const isPdvPage = currentPage === 'pdv';

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            <nav className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                <h1 
                    className="text-xl sm:text-2xl font-bold text-pink-500 cursor-pointer" 
                    onClick={() => onNavigate('dashboard')}
                >
                    Gabi & Mari
                </h1>
                <div className="flex items-center gap-2 sm:gap-4">
                    {isPdvPage || isFinancePage ? (
                        <button
                            onClick={() => onNavigate('dashboard')}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold p-2 sm:py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                            <ArrowBack />
                            <span className="hidden sm:inline">Voltar ao Dashboard</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => onNavigate('finance')}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold p-2 sm:py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                            >
                                <MonetizationOn />
                                <span className="hidden sm:inline">Finanças</span>
                            </button>
                            <button
                                onClick={() => onNavigate('pdv')}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold p-2 sm:py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                            >
                                <PointOfSale />
                                <span className="hidden sm:inline">PDV</span>
                            </button>
                            <button
                                onClick={onLogout}
                                className="bg-pink-500 hover:bg-pink-600 text-white font-bold p-2 sm:py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                            >
                                <ExitToApp />
                                <span className="hidden sm:inline">Sair</span>
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
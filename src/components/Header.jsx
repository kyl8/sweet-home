import React, { useState } from 'react';
import { MonetizationOn, PointOfSale, ExitToApp, ArrowBack, Settings } from '@mui/icons-material';
import DataManagementModal from './DataManagementModal';

const Header = ({ onLogout, onNavigate, currentPage, sweets, ingredients, kitchenware, sales, userData }) => {
    const isFinancePage = currentPage === 'finance';
    const isPdvPage = currentPage === 'pdv';
    const isReportsPage = currentPage === 'reports';
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    return (
        <>
            <header className="bg-white shadow-md sticky top-0 z-40">
                <nav className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                    <h1 
                        className="text-xl sm:text-2xl font-bold text-pink-500 cursor-pointer" 
                        onClick={() => onNavigate('dashboard')}
                    >
                        Sweet Home
                    </h1>
                    <div className="flex items-center gap-2 sm:gap-4">
                        {isPdvPage || isFinancePage || isReportsPage ? (
                            <button
                                onClick={() => onNavigate('dashboard')}
                                className="bg-gray-600 hover:bg-gray-700 text-white font-bold p-2 sm:py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                            >
                                <ArrowBack />
                                <span className="hidden sm:inline">Voltar</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsDataModalOpen(true)}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold p-2 sm:py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                                >
                                    <Settings />
                                    <span className="hidden sm:inline">Dados</span>
                                </button>
                                <button
                                    onClick={() => onNavigate('finance')}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold p-2 sm:py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                                >
                                    <MonetizationOn />
                                    <span className="hidden sm:inline">Finanças</span>
                                </button>
                                <button
                                    onClick={() => onNavigate('reports')}
                                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold p-2 sm:py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                                >
                                    <MonetizationOn />
                                    <span className="hidden sm:inline">Relatórios</span>
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
            <DataManagementModal 
                isOpen={isDataModalOpen}
                onClose={() => setIsDataModalOpen(false)}
                sweets={sweets || []}
                ingredients={ingredients || []}
                kitchenware={kitchenware || []}
                sales={sales || []}
                userData={userData}
            />
        </>
    );
};

export default Header;
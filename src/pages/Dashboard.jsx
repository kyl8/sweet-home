import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SweetCard from "../components/SweetCard";
import IngredientCard from '../components/IngredientCard';
import KitchenwareCard from '../components/KitchenwareCard';
import EmptyState from '../components/EmptyState';

//icons
const SweetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v6m3-6v6m3-6v6m-9 6h15a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const IngredientIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 01-2.288 0 2 2 0 010-2.828a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00.517-3.86l.158-.318a6 6 0 01.517-3.86l.477-2.387a2 2 0 00-.547-1.806a2 2 0 010-2.288 2 2 0 012.828 0a2 2 0 001.806.547l2.387.477a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387-.477a2 2 0 001.806-.547a2 2 0 012.288 0a2 2 0 010 2.828a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00-.517 3.86l-.158.318a6 6 0 01-.517 3.86l-.477 2.387a2 2 0 00.547 1.806a2 2 0 010 2.288a2 2 0 01-2.828 0z" />
    </svg>
);
const KitchenwareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};
const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};
const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const DashboardPage = ({
    onNavigate,
    sweets,
    setSweets,
    ingredients,
    setIngredients,
    utensils,
    setUtensils,
    userData,
    activeTab,
    onTabChange,
    onDelete
}) => {

    const tabs = [
        { id: 'sweets', label: 'Doces', icon: <SweetIcon /> },
        { id: 'ingredients', label: 'Ingredientes', icon: <IngredientIcon /> },
        { id: 'kitchenware', label: 'Utensílios', icon: <KitchenwareIcon /> },
    ];

     return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="flex justify-center">
                <nav className="relative flex space-x-1 bg-gray-100 p-1.5 rounded-full shadow-inner">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`relative z-10 flex items-center gap-1.5 rounded-full py-2.5 px-1.5 text-base md:text-lg font-semibold transition-colors duration-300 ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-pink-600'}`}>
                            <div className="w-6 h-6 md:w-6 md:h-6">{tab.icon}</div>
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.span layoutId="active_tab_pill" className="absolute inset-0 z-0 bg-pink-500 rounded-full shadow-md" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-8">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                        {activeTab === 'sweets' && (
                            <div>
                                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Estoque de Doces</h2>
                                    <button onClick={() => onNavigate('add-sweet')} className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg inline-flex items-center justify-center gap-2 transition-transform hover:scale-105">
                                        <AddIcon /> Adicionar Doce
                                    </button>
                                </div>
                                {sweets.length > 0 ? (
                                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8" variants={gridContainerVariants} initial="hidden" animate="visible">
                                        {sweets.map(sweet => (
                                            <motion.div key={sweet.id} variants={cardVariants}>
                                                <SweetCard sweet={sweet} onEdit={s => onNavigate('edit-sweet', s)} onDelete={onDelete} />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <EmptyState message="Nenhum doce no estoque" buttonText="+ Adicionar Doce" onButtonClick={() => onNavigate('add-sweet')} icon={<SweetIcon />} />
                                )}
                            </div>
                        )}
                        {activeTab === 'ingredients' && ( <div>
                            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Estoque de Ingredientes</h2>
                                <button onClick={() => onNavigate('add-ingredient')} className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg inline-flex items-center justify-center gap-2 transition-transform hover:scale-105">
                                    <AddIcon /> Adicionar Ingrediente
                                </button>
                            </div>
                            {ingredients.length > 0 ? (
                                <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8" variants={gridContainerVariants} initial="hidden" animate="visible">
                                    {ingredients.map(ingredient => (
                                        <motion.div key={ingredient.id} variants={cardVariants}>
                                            <IngredientCard ingredient={ingredient} onDelete={onDelete} onEdit={ing => onNavigate('edit-ingredient', ing)} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <EmptyState message="Nenhum ingrediente no estoque" buttonText="+ Adicionar Ingrediente" onButtonClick={() => onNavigate('add-ingredient')} icon={<IngredientIcon />} />
                            )}
                        </div>
                     )}
                        
                        {activeTab === 'kitchenware' &&  (
                        <div>
                            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Estoque de Utensílios</h2>
                                <button onClick={() => onNavigate('add-utensil')} className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg inline-flex items-center justify-center gap-2 transition-transform hover:scale-105">
                                    <AddIcon /> Adicionar Utensílio
                                </button>
                            </div>
                            {utensils.length > 0 ? (
                                <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8" variants={gridContainerVariants} initial="hidden" animate="visible">
                                    {utensils.map(utensil => (
                                        <motion.div key={utensil.id} variants={cardVariants}>
                                            <KitchenwareCard utensil={utensil} onDelete={onDelete} onEdit={u => onNavigate('edit-utensil', u)} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <EmptyState message="Nenhum utensílio no estoque" buttonText="+ Adicionar Utensílio" onButtonClick={() => onNavigate('add-utensil')} icon={<KitchenwareIcon />} />
                            )}
                        </div> )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DashboardPage;
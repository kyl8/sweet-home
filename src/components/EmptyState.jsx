import React from 'react';

const EmptyState = ({ message, buttonText, onButtonClick, icon }) => (
    <div className="text-center py-16 px-6 bg-gray-50 rounded-lg">
        <div className="mx-auto h-16 w-16 text-gray-400">
            {icon}
        </div>
        <h3 className="mt-2 text-xl font-medium text-gray-900">{message}</h3>
        <p className="mt-1 text-sm text-gray-500">Comece adicionando um novo item.</p>
        <div className="mt-6">
            <button
                type="button"
                onClick={onButtonClick}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
                {buttonText}
            </button>
        </div>
    </div>
);

export default EmptyState;
import React from 'react';

const LoadingPage = ({ message = "Carregando dados", submessage = "Aguarde um momento" }) => {
  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto border-4 border-pink-200 rounded-full"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
    
        <div className="text-2xl font-bold text-gray-800 mb-2">{message}</div>
        
        <div className="text-lg text-gray-600 mb-6">
          <span>{submessage}</span>
          <span className="inline-block animate-pulse">
            <span className="animate-bounce text-pink-500" style={{animationDelay: '0s'}}>.</span>
            <span className="animate-bounce text-pink-500" style={{animationDelay: '0.2s'}}>.</span>
            <span className="animate-bounce text-pink-500" style={{animationDelay: '0.4s'}}>.</span>
          </span>
        </div>
        
        <div className="w-64 bg-pink-100 rounded-full h-2 mx-auto mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full animate-pulse"></div>
        </div>
        
        <div className="flex space-x-2 justify-center">
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
      
      <div className="absolute top-20 left-20 w-4 h-4 bg-pink-300 rounded-full animate-pulse opacity-50"></div>
      <div className="absolute top-40 right-32 w-6 h-6 bg-pink-400 rounded-full animate-pulse opacity-30" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-32 left-16 w-3 h-3 bg-pink-300 rounded-full animate-pulse opacity-40" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-20 right-20 w-5 h-5 bg-pink-400 rounded-full animate-pulse opacity-50" style={{animationDelay: '2s'}}></div>
    </div>
  );
};

export const PinkThemeLoadingPage = ({ message = "Bem-vindo(a)!", submessage = "Carregando sua sessão" }) => {
  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 m-4 text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{message}</h2>
        <p className="text-gray-500 mb-8">{submessage}</p>
        
        <div className="mb-6">
          <div className="w-full bg-gray-100 rounded-lg h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-lg animate-pulse shadow-inner"></div>
          </div>
        </div>
        
        <div className="flex space-x-2 justify-center mb-4">
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
        </div>
        
        <p className="text-gray-600">
          Conectando
          <span className="inline-block ml-1">
            <span className="animate-bounce text-pink-500" style={{animationDelay: '0s'}}>.</span>
            <span className="animate-bounce text-pink-500" style={{animationDelay: '0.2s'}}>.</span>
            <span className="animate-bounce text-pink-500" style={{animationDelay: '0.4s'}}>.</span>
          </span>
        </p>
      </div>
      
      <div className="absolute top-16 left-16 w-4 h-4 bg-pink-300 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-32 right-20 w-6 h-6 bg-pink-400 rounded-full animate-pulse opacity-40" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-32 left-12 w-3 h-3 bg-rose-300 rounded-full animate-pulse opacity-50" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-16 right-16 w-5 h-5 bg-pink-400 rounded-full animate-pulse opacity-60" style={{animationDelay: '2s'}}></div>
    </div>
  );
};

export const GlassLoadingPage = ({ message = "Preparando tudo para você" }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-25 backdrop-blur-lg rounded-3xl p-12 text-center shadow-2xl border border-white border-opacity-20">
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto">
            <svg className="w-24 h-24 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">{message}</h2>
        <p className="text-white text-opacity-80 text-lg mb-6">
          Carregando seus dados<span className="animate-pulse">...</span>
        </p>
        
        <div className="flex space-x-2 justify-center">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  );
};

export const MinimalLoadingPage = ({ message = "Carregando dados" }) => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">{message}</h2>
        <p className="text-gray-600">
          Conectando ao servidor<span className="animate-pulse text-pink-500">...</span>
        </p>
        
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="w-2 h-8 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  backgroundColor: `hsl(${330 + i * 5}, 70%, ${65 - i * 5}%)`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
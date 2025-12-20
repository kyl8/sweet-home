import React, { useState, useEffect, useMemo } from 'react';

const MAX_LEN = 150;

const ObservationsModal = ({ initialText, onSave, onClose, anchorRect }) => {
    const [text, setText] = useState(initialText || '');
    
    useEffect(() => { 
        setText(initialText || ''); 
    }, [initialText]);

    useEffect(() => {
        const onEsc = (e) => { 
            if (e.key === 'Escape') onClose?.(); 
        };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [onClose]);

    const remaining = Math.max(0, MAX_LEN - (text?.length || 0));

    const handleChange = (e) => setText(e.target.value.slice(0, MAX_LEN));
    
    const handlePaste = (e) => {
        const pasteData = (e.clipboardData || window.clipboardData).getData('text');
        e.preventDefault();
        setText((prev) => (prev + pasteData).slice(0, MAX_LEN));
    };
    
    const handleSave = () => {
        onSave?.(text);
        onClose?.();
    };

    const modalStyle = useMemo(() => {
        if (!anchorRect) return { display: 'none' };
        
        const gap = 8;
        const width = 320;
        const height = 340; 
        
        let top = anchorRect.top - height - gap;
        let left = anchorRect.left + (anchorRect.width / 2) - (width / 2);
        
        if (left < 16) {
            left = 16;
        }
        
        if (left + width > window.innerWidth - 16) {
            left = window.innerWidth - width - 16;
        }
        
        if (top < 16) {
            top = anchorRect.bottom + gap;
        }
        
        return {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            zIndex: 99999
        };
    }, [anchorRect]);

    if (!anchorRect) return null;

    return (
        <div 
            style={modalStyle}
            className="bg-white rounded-2xl shadow-2xl border-2 border-pink-200 p-4 animate-fadeIn"
        >
            <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
            
            <h3 className="text-base font-bold text-gray-800 text-center mb-1">Observações</h3>
            <p className="text-[10px] text-gray-500 text-center mb-3">Máx. {MAX_LEN} caracteres</p>
            
            <textarea
                value={text}
                onChange={handleChange}
                onPaste={handlePaste}
                rows={4}
                maxLength={MAX_LEN}
                placeholder="Sem glúten, vegano, etc..."
                autoFocus
                className="w-full bg-white rounded-lg border-2 border-pink-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none mb-2"
            />
            
            <div className="text-center mb-3">
                <span className={`inline-block px-2 py-1 text-[10px] font-semibold rounded-full border ${
                    remaining === 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-pink-100 text-pink-700 border-pink-200'
                }`}>
                    {text.length}/{MAX_LEN} • restam {remaining}
                </span>
            </div>
            
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs rounded-lg font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                    Fechar
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={text.length === 0}
                    className="px-3 py-1.5 text-xs rounded-lg font-semibold bg-pink-500 text-white hover:bg-pink-600 disabled:bg-gray-300"
                >
                    Salvar
                </button>
            </div>
        </div>
    );
};

export default ObservationsModal;
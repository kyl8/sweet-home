import React, { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { csvService } from '../services/csvService'
import { firestoreService } from '../services/firestoreService'
import { useToast } from '../hooks/useToast'
import { logger } from '../utils/logger'

const MAX_IMPORT_LIMIT = 1000;

const DataManagementModal = ({ isOpen, onClose, sweets, ingredients, kitchenware, sales, userData }) => {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const allFileInputRef = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importType, setImportType] = useState('sweets')
  const [importedData, setImportedData] = useState(null)
  const [allPreview, setAllPreview] = useState(null)

  const handleExportSweets = () => { try { csvService.exportSweets(sweets); toast.success('Doces exportados') } catch(e){ toast.error('Falha', e.message) } }
  const handleExportIngredients = () => { try { csvService.exportIngredients(ingredients); toast.success('Ingredientes exportados') } catch(e){ toast.error('Falha', e.message) } }
  const handleExportKitchenware = () => { try { csvService.exportKitchenware(kitchenware); toast.success('Utensílios exportados') } catch(e){ toast.error('Falha', e.message) } }
  const handleExportSales = () => { try { csvService.exportSales(sales); toast.success('Vendas exportadas') } catch(e){ toast.error('Falha', e.message) } }
  const handleExportAllSingle = () => { try { csvService.exportAllSingle(sweets, ingredients, kitchenware, sales); toast.success('Arquivo único exportado') } catch(e){ toast.error('Falha', e.message) } }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]; if(!file) return
    setIsProcessing(true)
    try {
      const content = await file.text()
      let data
      switch (importType) {
        case 'sweets':
          data = csvService.importSweets(content)
          break
        case 'ingredients':
          data = csvService.importIngredients(content)
          break
        case 'kitchenware':
          data = csvService.importKitchenware(content)
          break
        case 'sales':
          data = csvService.importSales(content)
          break
        default:
          throw new Error('Tipo de importação inválido')
      }

      setImportedData(data)
      toast.success('Arquivo lido com sucesso', `${(Array.isArray(data) ? data.length : 0)} registros encontrados`)
    } catch(e){
      toast.error('Erro ao ler', e.message)
      logger.error('Import single error',{error:e.message})
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!importedData?.length) { 
      toast.warning('Sem dados'); 
      return; 
    }
    
    if (importedData.length > MAX_IMPORT_LIMIT) {
      toast.error('Limite excedido', `Máximo ${MAX_IMPORT_LIMIT} registros por vez`);
      return;
    }
    
    setIsProcessing(true)
    try {
      const map = { sweets:'sweets', ingredients:'ingredients', kitchenware:'kitchenware', sales:'sales' }
      const collectionName = map[importType]
      let added = 0
      for (const item of importedData){
        try {
          await firestoreService.addDocument(collectionName, item, userData?.id || 'anonymous')
          added++
        } catch(err){ 
          logger.warn('Falha ao inserir',{error:err.message}) 
        }
      }
      toast.success('Importação concluída', `${added} registros`)
      setImportedData(null); 
      fileInputRef.current && (fileInputRef.current.value='')
    } catch(e){
      toast.error('Erro', e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelImport = () => {
    setImportedData(null)
    fileInputRef.current && (fileInputRef.current.value='')
  }

  const handleAllFileChange = async (e) => {
    const file = e.target.files?.[0]; if(!file) return
    setIsProcessing(true)
    try {
      const content = await file.text()
      const parsed = csvService.importAllSingle(content)
      setAllPreview({
        sweets: Array.isArray(parsed?.sweets) ? parsed.sweets.length : 0,
        ingredients: Array.isArray(parsed?.ingredients) ? parsed.ingredients.length : 0,
        kitchenware: Array.isArray(parsed?.kitchenware) ? parsed.kitchenware.length : 0,
        sales: Array.isArray(parsed?.sales) ? parsed.sales.length : 0,
        raw: {
          sweets: Array.isArray(parsed?.sweets) ? parsed.sweets : [],
          ingredients: Array.isArray(parsed?.ingredients) ? parsed.ingredients : [],
          kitchenware: Array.isArray(parsed?.kitchenware) ? parsed.kitchenware : [],
          sales: Array.isArray(parsed?.sales) ? parsed.sales : [],
        }
      })
      toast.success('Arquivo único lido','Pronto para importar tudo')
    } catch(e){
      toast.error('Erro ao ler arquivo único', e.message)
      logger.error('Import all single error',{error:e.message})
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmAllImport = async () => {
    if (!allPreview?.raw) { 
      toast.warning('Nenhum dado'); 
      return; 
    }
    
    const totalRecords = Object.values(allPreview.raw).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    if (totalRecords > MAX_IMPORT_LIMIT) {
      toast.error('Limite excedido', `Máximo ${MAX_IMPORT_LIMIT} registros por vez`);
      return;
    }
    
    setIsProcessing(true)
    let added = 0
    try {
      for (const [collection, arr] of Object.entries(allPreview.raw)){
        for (const item of (Array.isArray(arr) ? arr : [])){
          try {
            await firestoreService.addDocument(collection, item, userData?.id || 'anonymous')
            added++
          } catch(err){ 
            logger.warn('Falha inserir conjunto',{collection,error:err.message}) 
          }
        }
      }
      toast.success('Importação total', `${added} registros`)
      setAllPreview(null)
      allFileInputRef.current && (allFileInputRef.current.value='')
    } catch(e){
      toast.error('Erro ao importar tudo', e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelAllImport = () => {
    setAllPreview(null)
    allFileInputRef.current && (allFileInputRef.current.value='')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,y:20}} className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Gerenciar Dados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-700">Exportar</h3>
              <button onClick={handleExportSweets} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Doces</button>
              <button onClick={handleExportIngredients} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Ingredientes</button>
              <button onClick={handleExportKitchenware} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg">Utensílios</button>
              <button onClick={handleExportSales} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg">Vendas</button>
              <button onClick={handleExportAllSingle} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg mt-2">Exportar Tudo</button>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-700">Importar</h3>
              <label className="block text-sm font-semibold text-gray-700">Tipo</label>
              <select value={importType} onChange={e=>setImportType(e.target.value)} disabled={isProcessing} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400">
                <option value="sweets">Doces</option>
                <option value="ingredients">Ingredientes</option>
                <option value="kitchenware">Utensílios</option>
                <option value="sales">Vendas</option>
              </select>
              <button onClick={()=>fileInputRef.current?.click()} disabled={isProcessing} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Selecionar Arquivo</button>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" disabled={isProcessing}/>
              {importedData && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 font-semibold">{importedData.length} registro(s) pronto(s)</div>
                  <div className="flex gap-2">
                    <button onClick={handleConfirmImport} disabled={isProcessing} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Importar</button>
                    <button onClick={handleCancelImport} disabled={isProcessing} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                  </div>
                </>
              )}
              <div className="pt-4 border-t">
                <button onClick={()=>allFileInputRef.current?.click()} disabled={isProcessing} className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2 px-4 rounded-lg">Importar Tudo</button>
                <input ref={allFileInputRef} type="file" accept=".csv" onChange={handleAllFileChange} className="hidden" disabled={isProcessing}/>
                {allPreview && (
                  <div className="mt-3 bg-fuchsia-50 border border-fuchsia-200 rounded-lg p-3 text-xs space-y-1">
                    <p className="font-semibold text-fuchsia-700">Resumo:</p>
                    <p>Doces: {allPreview.sweets}</p>
                    <p>Ingredientes: {allPreview.ingredients}</p>
                    <p>Utensílios: {allPreview.kitchenware}</p>
                    <p>Vendas: {allPreview.sales}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleConfirmAllImport} disabled={isProcessing} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Confirmar Tudo</button>
                      <button onClick={handleCancelAllImport} disabled={isProcessing} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <button onClick={onClose} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Fechar</button>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-700">
            OBS: Antes de importar, certifique-se de que os arquivos CSV estejam no formato correto para evitar erros de importação.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default DataManagementModal

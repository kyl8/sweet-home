import React, { useState, useMemo } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections'
import { reportsService } from '../services/reportsService'
import { motion, AnimatePresence } from 'framer-motion'

const ReportsPage = ({ sweetsExternal, salesExternal, ingredientsExternal, recipesExternal }) => {
  const { data: salesData } = useFirestore(FIRESTORE_COLLECTIONS.SALES)
  const { data: sweetsData } = useFirestore(FIRESTORE_COLLECTIONS.SWEETS)
  const sales = salesExternal && salesExternal.length ? salesExternal : salesData
  const sweets = sweetsExternal && sweetsExternal.length ? sweetsExternal : sweetsData

  const [periodType, setPeriodType] = useState('dia')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stockThreshold, setStockThreshold] = useState(5)
  const [topLimit, setTopLimit] = useState(10)

  const salesPeriod = useMemo(()=>reportsService.salesByPeriod(sales, periodType, startDate, endDate),[sales, periodType, startDate, endDate])
  const profitPeriod = useMemo(()=>reportsService.profitMarginByPeriod(sales, periodType, startDate, endDate),[sales, periodType, startDate, endDate])
  const topProducts = useMemo(()=>reportsService.topSellingProducts(sales, sweets, topLimit, startDate, endDate),[sales, sweets, topLimit, startDate, endDate])
  const lowStock = useMemo(()=>reportsService.lowStockAlerts(sweets, stockThreshold),[sweets, stockThreshold])

  const exportSalesPDF = () => reportsService.exportPDFReport('Vendas Por Periodo', [
    { title: 'Vendas por Período', headers: ['periodo','vendas','total','custo','lucro'], rows: salesPeriod }
  ])
  
  const exportProfitPDF = () => reportsService.exportPDFReport('Lucro Margem', [
    { title: 'Margem de Lucro por Período', headers: ['periodo','receita','custo','lucro','margem'], rows: profitPeriod }
  ])
  
  const exportTopPDF = () => reportsService.exportPDFReport('Top Produtos', [
    { title: 'Produtos Mais Vendidos', headers: ['sweetId','nome','quantidade'], rows: topProducts }
  ])
  
  const exportStockPDF = () => reportsService.exportPDFReport('Estoque Baixo', [
    { title: 'Alertas de Estoque Baixo', headers: ['id','nome','estoque'], rows: lowStock }
  ])

  const exportAllPDF = () => reportsService.exportPDFReport('Relatorio Completo',[
    { title:'Vendas por Período', headers:['periodo','vendas','total','custo','lucro'], rows:salesPeriod },
    { title:'Margem de Lucro', headers:['periodo','receita','custo','lucro','margem'], rows:profitPeriod },
    { title:'Top Produtos', headers:['sweetId','nome','quantidade'], rows:topProducts },
    { title:'Estoque Baixo', headers:['id','nome','estoque'], rows:lowStock }
  ])

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>

      <div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500">Período</label>
            <select value={periodType} onChange={e=>setPeriodType(e.target.value)} className="mt-1 border rounded px-2 py-2 text-sm">
            <option value="dia">Dia</option>
            <option value="semana">Semana</option>
            <option value="mes">Mês</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500">Início</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 border rounded px-2 py-2 text-sm"/>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500">Fim</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="mt-1 border rounded px-2 py-2 text-sm"/>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500">Limite Top</label>
          <input type="number" min="1" value={topLimit} onChange={e=>setTopLimit(parseInt(e.target.value||'10'))} className="mt-1 border rounded px-2 py-2 text-sm"/>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500">Estoque Baixo ≤</label>
          <input type="number" min="0" value={stockThreshold} onChange={e=>setStockThreshold(parseInt(e.target.value||'5'))} className="mt-1 border rounded px-2 py-2 text-sm"/>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <button onClick={exportSalesPDF} className="flex items-center gap-3 bg-pink-200 hover:bg-pink-100 border border-pink-100 px-5 py-3 rounded-xl transition-colors duration-200 cursor-pointer w-full">
          <div className="text-pink-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l3 3 3-3"/><path d="M12 18v-6"/></svg>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold text-pink-700">Vendas</span>
          </div>
        </button>

        <button onClick={exportProfitPDF} className="flex items-center gap-3 bg-green-200 hover:bg-green-100 border border-green-100 px-5 py-3 rounded-xl transition-colors duration-200 cursor-pointer w-full">
          <div className="text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l3 3 3-3"/><path d="M12 18v-6"/></svg>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold text-green-700">Lucro</span>
          </div>
        </button>

        <button onClick={exportTopPDF} className="flex items-center gap-3 bg-indigo-200 hover:bg-indigo-100 border border-indigo-100 px-5 py-3 rounded-xl transition-colors duration-200 cursor-pointer w-full">
          <div className="text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l3 3 3-3"/><path d="M12 18v-6"/></svg>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold text-indigo-700">Top Produtos</span>
          </div>
        </button>

        <button onClick={exportStockPDF} className="flex items-center gap-3 bg-orange-200 hover:bg-orange-100 border border-orange-100 px-5 py-3 rounded-xl transition-colors duration-200 cursor-pointer w-full">
          <div className="text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l3 3 3-3"/><path d="M12 18v-6"/></svg>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold text-orange-700">Estoque</span>
          </div>
        </button>

        <button onClick={exportAllPDF} className="flex items-center gap-3 bg-purple-200 hover:bg-purple-100 border border-purple-100 px-5 py-3 rounded-xl transition-colors duration-200 cursor-pointer w-full">
          <div className="text-purple-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l3 3 3-3"/><path d="M12 18v-6"/></svg>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold text-purple-700">Relatório Completo</span>
          </div>
        </button>
      </div>

      <AnimatePresence>
        <motion.div layout className="grid gap-6">
          <section className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-bold mb-3">Vendas por Período</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left">Período</th>
                    <th className="px-3 py-2 text-right">Vendas</th>
                    <th className="px-3 py-2 text-right">Total (R$)</th>
                    <th className="px-3 py-2 text-right">Custo (R$)</th>
                    <th className="px-3 py-2 text-right">Lucro (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {salesPeriod.map(r=>(
                    <tr key={r.periodo} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{r.periodo}</td>
                      <td className="px-3 py-2 text-right">{r.vendas}</td>
                      <td className="px-3 py-2 text-right">{r.total.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{r.custo.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-green-600 font-semibold">{r.lucro.toFixed(2)}</td>
                    </tr>
                  ))}
                  {salesPeriod.length===0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-500">Sem dados</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-bold mb-3">Margem de Lucro</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left">Período</th>
                    <th className="px-3 py-2 text-right">Receita</th>
                    <th className="px-3 py-2 text-right">Custo</th>
                    <th className="px-3 py-2 text-right">Lucro</th>
                    <th className="px-3 py-2 text-right">Margem %</th>
                  </tr>
                </thead>
                <tbody>
                  {profitPeriod.map(r=>(
                    <tr key={r.periodo} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{r.periodo}</td>
                      <td className="px-3 py-2 text-right">{r.receita.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{r.custo.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-green-600 font-semibold">{r.lucro.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{r.margem.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {profitPeriod.length===0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-500">Sem dados</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-bold mb-3">Top Produtos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left">Produto</th>
                    <th className="px-3 py-2 text-right">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(p=>(
                    <tr key={p.sweetId} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{p.nome}</td>
                      <td className="px-3 py-2 text-right font-semibold">{p.quantidade}</td>
                    </tr>
                  ))}
                  {topProducts.length===0 && <tr><td colSpan={2} className="px-3 py-4 text-center text-gray-500">Sem dados</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-bold mb-3">Estoque Baixo</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left">Produto</th>
                    <th className="px-3 py-2 text-right">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map(s=>(
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{s.nome}</td>
                      <td className="px-3 py-2 text-right font-semibold">{s.estoque}</td>
                    </tr>
                  ))}
                  {lowStock.length===0 && <tr><td colSpan={2} className="px-3 py-4 text-center text-gray-500">Sem alertas</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default ReportsPage

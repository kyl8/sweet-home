import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { costCalculationService } from '../services/costCalculationService';
import { useFirestore } from '../hooks/useFirestore';
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections';
import ErrorBoundary from '../components/ErrorBoundary';
import { logger } from '../utils/logger';
import EmptyState from '../components/EmptyState';

const FinancePage = () => {
  const { data: sweets, loading: sweetsLoading, error: sweetsError } = useFirestore(FIRESTORE_COLLECTIONS.SWEETS);
  const { data: ingredients, loading: ingredientsLoading, error: ingredientsError } = useFirestore(FIRESTORE_COLLECTIONS.INGREDIENTS);
  const { data: recipes, loading: recipesLoading, error: recipesError } = useFirestore(FIRESTORE_COLLECTIONS.RECIPES);

  const sweetsArr = Array.isArray(sweets) ? sweets : [];
  const ingredientsArr = Array.isArray(ingredients) ? ingredients : [];
  const recipesArr = Array.isArray(recipes) ? recipes : [];

  const [ingredientsPage, setIngredientsPage] = React.useState(1);
  const [profitPage, setProfitPage] = React.useState(1);
  const [ingredientsSearch, setIngredientsSearch] = React.useState('');
  const [profitSearch, setProfitSearch] = React.useState('');
  const [debouncedIngSearch, setDebouncedIngSearch] = React.useState('');
  const [debouncedProfitSearch, setDebouncedProfitSearch] = React.useState('');

  const deferredIngSearch = React.useDeferredValue(debouncedIngSearch);
  const deferredProfitSearch = React.useDeferredValue(debouncedProfitSearch);
  const [isPendingIng, startTransitionIng] = React.useTransition();
  const [isPendingProfit, startTransitionProfit] = React.useTransition();

  const ingredientFinancialData = React.useMemo(() => {
    return ingredientsArr.map(ingredient => {
      const totalStockInBaseUnit = Number(ingredient.stockInBaseUnit || 0);
      const costPerBaseUnit = Number(ingredient.costPerBaseUnit || 0);
      const totalStockValue = totalStockInBaseUnit * costPerBaseUnit;
      return {
        name: ingredient.name,
        brand: ingredient.brand,
        totalStock: totalStockInBaseUnit,
        baseUnit: ingredient.baseUnit,
        stockValue: totalStockValue,
        cost: costPerBaseUnit,
      };
    });
  }, [ingredientsArr]);

  const profitabilityData = React.useMemo(() => {
    return sweetsArr.map(sweet => {
      const productionCost = costCalculationService.calculateSweetCost(sweet, recipesArr, ingredientsArr);
      const profit = costCalculationService.calculateProfit(Number(sweet.price || 0), productionCost);
      const margin = costCalculationService.calculateProfitMargin(Number(sweet.price || 0), productionCost);
      return {
        name: sweet.name,
        price: Number(sweet.price || 0),
        cost: productionCost,
        profit,
        margin,
      };
    });
  }, [sweetsArr, recipesArr, ingredientsArr]);

  const normalize = (s) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filteredIngredients = React.useMemo(() => {
    if (!deferredIngSearch.trim()) return ingredientFinancialData;
    const q = normalize(deferredIngSearch);
    return ingredientFinancialData.filter(d =>
      normalize(d.name).includes(q) || normalize(d.brand).includes(q)
    );
  }, [ingredientFinancialData, deferredIngSearch]);

  const filteredProfitability = React.useMemo(() => {
    if (!deferredProfitSearch.trim()) return profitabilityData;
    const q = normalize(deferredProfitSearch);
    return profitabilityData.filter(d => normalize(d.name).includes(q));
  }, [profitabilityData, deferredProfitSearch]);

  const pagedIngredients = React.useMemo(() => {
    const PAGE_SIZE = 10;
    const start = (ingredientsPage - 1) * PAGE_SIZE;
    const slice = filteredIngredients.slice(start, start + PAGE_SIZE);
    return slice.map(d => ({
      ...d,
      _totalStockFmt: `${Number(d.totalStock).toFixed(2)} ${d.baseUnit}`,
      _stockValueFmt: `R$ ${Number(d.stockValue).toFixed(2)}`,
      _costFmt: `R$ ${Number(d.cost).toFixed(5)} / ${d.baseUnit}`
    }));
  }, [filteredIngredients, ingredientsPage]);

  const pagedProfitability = React.useMemo(() => {
    const PAGE_SIZE = 10;
    const start = (profitPage - 1) * PAGE_SIZE;
    const slice = filteredProfitability.slice(start, start + PAGE_SIZE);
    return slice.map(d => ({
      ...d,
      _priceFmt: `R$ ${Number(d.price).toFixed(2)}`,
      _costFmt: `R$ ${Number(d.cost).toFixed(2)}`,
      _profitFmt: `R$ ${Number(d.profit).toFixed(2)}`,
      _marginFmt: `${Number(d.margin).toFixed(1)}%`,
      _isPositive: Number(d.profit) >= 0
    }));
  }, [filteredProfitability, profitPage]);

  const totalSweets = sweetsArr.length;
  const totalRecipes = recipesArr.length;
  const totalIngredients = ingredientsArr.length;
  const totalInventoryValue = React.useMemo(() => {
    return ingredientFinancialData.reduce((sum, ing) => sum + Number(ing.stockValue || 0), 0);
  }, [ingredientFinancialData]);

  const averageProfit = React.useMemo(() => {
    if (profitabilityData.length === 0) return 0;
    const validProfits = profitabilityData
      .map(item => Number(item.profit || 0))
      .filter(profit => !isNaN(profit));
    if (validProfits.length === 0) return 0;
    const sum = validProfits.reduce((acc, profit) => acc + profit, 0);
    const avg = sum / validProfits.length;
    return isNaN(avg) ? 0 : avg;
  }, [profitabilityData]);

  const ingredientsTotalPages = React.useMemo(() => {
    const PAGE_SIZE = 10;
    return Math.max(1, Math.ceil(filteredIngredients.length / PAGE_SIZE));
  }, [filteredIngredients.length]);

  const profitTotalPages = React.useMemo(() => {
    const PAGE_SIZE = 10;
    return Math.max(1, Math.ceil(filteredProfitability.length / PAGE_SIZE));
  }, [filteredProfitability.length]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      startTransitionIng(() => setDebouncedIngSearch(ingredientsSearch));
    }, 200);
    return () => clearTimeout(t);
  }, [ingredientsSearch]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      startTransitionProfit(() => setDebouncedProfitSearch(profitSearch));
    }, 200);
    return () => clearTimeout(t);
  }, [profitSearch]);

  React.useEffect(() => {
    setIngredientsPage(1);
  }, [deferredIngSearch, filteredIngredients.length]);

  React.useEffect(() => {
    setProfitPage(1);
  }, [deferredProfitSearch, filteredProfitability.length]);

  const isLoading = sweetsLoading || ingredientsLoading || recipesLoading;
  const hasError = sweetsError || ingredientsError || recipesError;

  if (hasError) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Erro ao Carregar Dados</h2>
          <p className="text-red-600">{sweetsError || ingredientsError || recipesError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto border-4 border-pink-200 rounded-full"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-2">Carregando dados financeiros</div>
        </div>
      </div>
    );
  }

  const hasNoData = totalSweets === 0 && totalIngredients === 0 && totalRecipes === 0;

  if (hasNoData) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-0">Painel Financeiro</h1>
        </div>
        <EmptyState
          message="Nenhum dado financeiro disponível"
          buttonText="Ir para Dashboard"
          onButtonClick={() => window.location.href = '/'}
        />
      </div>
    );
  }

  const PAGE_SIZE = 10;
  const Pager = ({ current, total, onChange }) => {
    const pages = React.useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);
    return (
      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50">←</button>
        {pages.map(p => (
          <button key={p} onClick={() => onChange(p)} className={`px-3 py-2 rounded-lg ${p === current ? 'bg-pink-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{p}</button>
        ))}
        <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50">→</button>
      </div>
    );
  };

  const IngredientRow = React.memo(({ data }) => (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 font-semibold">
        {data.name}
        {data.brand && <span className="block text-sm font-normal text-gray-500">{data.brand}</span>}
      </td>
      <td className="py-3 px-4 text-right">{data._totalStockFmt}</td>
      <td className="py-3 px-4 text-right font-semibold">{data._stockValueFmt}</td>
      <td className="py-3 px-4 text-right text-orange-600 font-semibold">{data._costFmt}</td>
    </tr>
  ));

  const ProfitRow = React.memo(({ data }) => (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 font-semibold">{data.name}</td>
      <td className="py-3 px-4 text-right text-blue-600 font-semibold">{data._priceFmt}</td>
      <td className="py-3 px-4 text-right text-orange-600 font-semibold">{data._costFmt}</td>
      <td className={`py-3 px-4 text-right font-bold ${data._isPositive ? 'text-green-600' : 'text-red-600'}`}>{data._profitFmt}</td>
      <td className={`py-3 px-4 text-right font-bold ${data._isPositive ? 'text-green-600' : 'text-red-600'}`}>{data._marginFmt}</td>
    </tr>
  ));

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-0">Painel Financeiro</h1>
          <div className="text-sm text-gray-500">
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-pink-400 to-pink-500 p-6 rounded-xl text-white">
            <h3 className="text-lg font-semibold mb-2">Total de Doces</h3>
            <p className="text-3xl font-bold">{totalSweets}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-400 to-purple-500 p-6 rounded-xl text-white">
            <h3 className="text-lg font-semibold mb-2">Receitas Cadastradas</h3>
            <p className="text-3xl font-bold">{totalRecipes}</p>
          </div>
          <div className="bg-gradient-to-r from-indigo-400 to-indigo-500 p-6 rounded-xl text-white">
            <h3 className="text-lg font-semibold mb-2">Ingredientes</h3>
            <p className="text-3xl font-bold">{totalIngredients}</p>
          </div>
          <div className="bg-gradient-to-r from-green-400 to-green-500 p-6 rounded-xl text-white">
            <h3 className="text-lg font-semibold mb-2">Lucro Médio por Doce</h3>
            <p className="text-3xl font-bold">R$ {averageProfit.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-700 mb-3">Detalhamento de Ingredientes</h2>

          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={ingredientsSearch}
              onChange={(e) => setIngredientsSearch(e.target.value)}
              placeholder="Buscar ingrediente por nome ou marca..."
              className="w-full md:w-96 px-4 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-400"
            />
            {ingredientsSearch && (
              <span className="text-xs text-gray-500">{filteredIngredients.length} resultado(s)</span>
            )}
            {isPendingIng && (
              <span className="text-xs text-indigo-500 animate-pulse">filtrando...</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left">Ingrediente (Marca)</th>
                  <th className="py-3 px-4 text-right">Estoque Total</th>
                  <th className="py-3 px-4 text-right">Valor do Estoque (R$)</th>
                  <th className="py-3 px-4 text-right">Custo por Unidade Base (R$)</th>
                </tr>
              </thead>
              <tbody>
                {pagedIngredients.map((data, index) => (
                  <IngredientRow key={`${data.name}-${index}`} data={data} />
                ))}
              </tbody>
            </table>
          </div>

          {filteredIngredients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum ingrediente corresponde à busca.</p>
            </div>
          )}

          {ingredientsTotalPages > 1 && (
            <div className="flex justify-end">
              <Pager current={ingredientsPage} total={ingredientsTotalPages} onChange={setIngredientsPage} />
            </div>
          )}
        </div>

        {ingredientFinancialData.length > 0 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-indigo-100">
            <h2 className="text-2xl font-bold text-gray-700 mb-6">Gráfico de Valor em Estoque de Ingredientes</h2>
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ingredientFinancialData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="stockValue" fill="#6366f1" name="Valor do Estoque" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-pink-100">
          <h2 className="text-2xl font-bold text-gray-700 mb-3">Análise de Lucratividade por Doce</h2>

          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={profitSearch}
              onChange={(e) => setProfitSearch(e.target.value)}
              placeholder="Buscar doce por nome..."
              className="w-full md:w-96 px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
            {profitSearch && (
              <span className="text-xs text-gray-500">{filteredProfitability.length} resultado(s)</span>
            )}
            {isPendingProfit && (
              <span className="text-xs text-pink-500 animate-pulse">filtrando...</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left">Doce</th>
                  <th className="py-3 px-4 text-right">Preço de Venda (R$)</th>
                  <th className="py-3 px-4 text-right">Custo de Produção (R$)</th>
                  <th className="py-3 px-4 text-right">Lucro por Unidade (R$)</th>
                  <th className="py-3 px-4 text-right">Margem de Lucro</th>
                </tr>
              </thead>
              <tbody>
                {pagedProfitability.map((data, index) => (
                  <ProfitRow key={`${data.name}-${index}`} data={data} />
                ))}
              </tbody>
            </table>
          </div>

          {filteredProfitability.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum doce corresponde à busca.</p>
            </div>
          )}

          {profitTotalPages > 1 && (
            <div className="flex justify-end">
              <Pager current={profitPage} total={profitTotalPages} onChange={setProfitPage} />
            </div>
          )}
        </div>

        {profitabilityData.length > 0 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-pink-100">
            <h2 className="text-2xl font-bold text-gray-700 mb-6">Gráfico de Lucro por Unidade</h2>
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={profitabilityData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value, name) => [`R$ ${Number(value).toFixed(2)}`, name]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="price" fill="#ec4899" name="Preço de Venda" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="cost" fill="#f97316" name="Custo" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="profit" fill="#16a34a" name="Lucro" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default FinancePage;
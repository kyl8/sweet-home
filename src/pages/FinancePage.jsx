import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

const calculateSweetCost = (sweetOrSweetId, recipes, ingredients) => {
    const sweetId = typeof sweetOrSweetId === 'object' && sweetOrSweetId !== null 
        ? sweetOrSweetId.id 
        : sweetOrSweetId;


    const recipe = recipes.find(r => r.id === sweetId);

    if (!recipe) {
        console.warn(`Receita para o doce ID ${sweetId} não encontrada.`);
        return 0;
    }

    const totalCost = recipe.ingredients.reduce((currentTotal, recipeIngredient) => {
    const ingredientData = ingredients.find(i => String(i.id) === String(recipeIngredient.ingredientId));

        if (!ingredientData || typeof ingredientData.costPerBaseUnit !== 'number') {
            console.warn(`Dados de custo para o ingrediente ID ${recipeIngredient.ingredientId} não encontrados ou inválidos.`);
            return currentTotal;
        }

        const costOfThisIngredient = recipeIngredient.quantityInBaseUnit * ingredientData.costPerBaseUnit;
        return currentTotal + costOfThisIngredient;
    }, 0);

    return totalCost;
};

const FinancePage = () => {
    const [sweets, setSweets] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribeFunctions = [];
        setIsLoading(true);

        try {
            const unsubscribeSweets = onSnapshot(
                collection(db, "sweets"),
                (snapshot) => {
                    const sweetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setSweets(sweetsData);
                    console.log("Doces carregados:", sweetsData);
                },
                (error) => {
                    console.error("Erro ao carregar doces:", error);
                    setError(`Erro ao carregar doces: ${error.message}`);
                }
            );
            unsubscribeFunctions.push(unsubscribeSweets);

            const unsubscribeIngredients = onSnapshot(
                collection(db, "ingredients"),
                (snapshot) => {
                    const ingredientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setIngredients(ingredientsData);
                    console.log("Ingredientes carregados:", ingredientsData);
                },
                (error) => {
                    console.error("Erro ao carregar ingredientes:", error);
                    setError(`Erro ao carregar ingredientes: ${error.message}`);
                }
            );
            unsubscribeFunctions.push(unsubscribeIngredients);

            const unsubscribeRecipes = onSnapshot(
                collection(db, "recipes"),
                (snapshot) => {
                    const recipesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setRecipes(recipesData);
                    console.log("Receitas carregadas:", recipesData);
                },
                (error) => {
                    console.error("Erro ao carregar receitas:", error);
                    setError(`Erro ao carregar receitas: ${error.message}`);
                }
            );
            unsubscribeFunctions.push(unsubscribeRecipes);

            const unsubscribeSales = onSnapshot(
                collection(db, "sales"),
                (snapshot) => {
                    const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setSales(salesData);
                    console.log("Vendas carregadas:", salesData);
                },
                (error) => {
                    console.error("Erro ao carregar vendas:", error);
                    setError(`Erro ao carregar vendas: ${error.message}`);
                }
            );
            unsubscribeFunctions.push(unsubscribeSales);

            setTimeout(() => {
                setIsLoading(false);
            }, 1000);

        } catch (err) {
            console.error("Erro ao configurar listeners:", err);
            setError(`Erro ao configurar conexão: ${err.message}`);
            setIsLoading(false);
        }

        return () => {
            unsubscribeFunctions.forEach(unsubscribe => {
                if (unsubscribe) unsubscribe();
            });
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
                <div className="text-center">
                    <div className="relative mb-8">
                        <div className="w-20 h-20 mx-auto border-4 border-pink-200 rounded-full"></div>
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-2">Carregando dados financeiros</div>
                    <div className="text-lg text-gray-600">
                        Processando informações<span className="animate-pulse text-pink-500">...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-red-800 mb-2">Erro ao Carregar Dados</h2>
                    <p className="text-red-600">{error}</p>
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

        const ingredientFinancialData = ingredients.map(ingredient => {
        const totalStockInBaseUnit = ingredient.stockInBaseUnit || 0;
        const costPerBaseUnit = ingredient.costPerBaseUnit || 0;
        const totalStockValue = totalStockInBaseUnit * costPerBaseUnit;
        const suggestedMarkup = 1.8; 
        const suggestedPriceContribution = costPerBaseUnit * suggestedMarkup;

        return {
            name: ingredient.name,
            brand: ingredient.brand,
            totalStock: totalStockInBaseUnit,
            baseUnit: ingredient.baseUnit,
            stockValue: totalStockValue,
            cost: costPerBaseUnit, 
            priceContribution: suggestedPriceContribution,
        };
    });

    const totalInventoryValue = ingredientFinancialData.reduce((sum, ing) => sum + ing.stockValue, 0);
    const profitabilityData = sweets.map(sweet => {
        const productionCost = calculateSweetCost(sweet, recipes, ingredients);
        const profit = sweet.price - productionCost;
        const margin = sweet.price > 0 ? (profit / sweet.price) * 100 : 0;

        return {
            name: sweet.name,
            price: sweet.price,
            cost: productionCost,
            profit: profit,
            margin: margin,
        };
    });

    const totalSweets = sweets.length;
    const totalRecipes = recipes.length;
    const totalIngredients = ingredients.length;
    const averageProfit = profitabilityData.length > 0 
        ? profitabilityData.reduce((sum, item) => sum + item.profit, 0) / profitabilityData.length 
        : 0;
    
    return (
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
                 <h2 className="text-2xl font-bold text-gray-700 mb-6">Análise de Estoque de Ingredientes</h2>
                 <div className="bg-gradient-to-r from-indigo-100 to-indigo-200 p-6 rounded-xl mb-6">
                    <h3 className="text-lg font-bold text-indigo-800">Valor Total em Estoque</h3>
                    <p className="text-4xl font-bold text-indigo-700">R$ {totalInventoryValue.toFixed(2).replace('.', ',')}</p>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow-md">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="py-3 px-4 text-left">Ingrediente (Marca)</th>
                                <th className="py-3 px-4 text-right">Estoque Total</th>
                                <th className="py-3 px-4 text-right">Valor do Estoque (R$)</th>
                                <th className="py-3 px-4 text-right">Custo por Unidade Base (R$)</th>
                                <th className="py-3 px-4 text-right">Contribuição de Preço Sugerida (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ingredientFinancialData.map((data, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-semibold">
                                        {data.name}
                                        {data.brand && <span className="block text-sm font-normal text-gray-500">{data.brand}</span>}
                                    </td>
                                    <td className="py-3 px-4 text-right">{data.totalStock.toFixed(2)} {data.baseUnit}</td>
                                    <td className="py-3 px-4 text-right font-semibold">R$ {data.stockValue.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right text-orange-600 font-semibold">R$ {data.cost.toFixed(5)} / {data.baseUnit}</td>
                                    <td className="py-3 px-4 text-right text-purple-700 font-bold">R$ {data.priceContribution.toFixed(5)} / {data.baseUnit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
                 
                 {ingredientFinancialData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>Nenhum ingrediente cadastrado ainda.</p>
                    </div>
                 )}
            </div>
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-pink-100">
                <h2 className="text-2xl font-bold text-gray-700 mb-6">Análise de Lucratividade por Doce</h2>
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
                            {profitabilityData.map((data, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-semibold">{data.name}</td>
                                    <td className="py-3 px-4 text-right text-blue-600 font-semibold">R$ {Number(data.price).toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right text-orange-600 font-semibold">R$ {Number(data.cost).toFixed(2)}</td>
                                    <td className={`py-3 px-4 text-right font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        R$ {Number(data.profit).toFixed(2)}
                                    </td>
                                    <td className={`py-3 px-4 text-right font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {Number(data.margin).toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {profitabilityData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>Nenhum doce cadastrado ainda.</p>
                    </div>
                )}
            </div>
            {profitabilityData.length > 0 && (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-pink-100">
                    <h2 className="text-2xl font-bold text-gray-700 mb-6">Gráfico de Lucro por Unidade</h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={profitabilityData}
                            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 12 }}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis 
                                tickFormatter={(value) => `R$${value.toFixed(0)}`}
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
            )}
        </div>
    );
};

export default FinancePage;
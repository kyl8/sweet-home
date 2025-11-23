import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { 
    collection, 
    onSnapshot, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc 
} from 'firebase/firestore';
import { testFirebaseConnection } from './firebaseTest'; 
import LoadingPage, { GlassLoadingPage, MinimalLoadingPage } from './components/LoadingPage';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import SweetForm from './pages/SweetForm.jsx';
import IngredientForm from './pages/IngredientForm.jsx';
import KitchenwareForm from './pages/KitchenwareForm.jsx';
import PDVPage from './pages/PDVPage.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import FinancePage from './pages/FinancePage';

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentPage, setCurrentPage] = useState('login');
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('sweets');
    const [sweets, setSweets] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [sales, setSales] = useState([]);
    const [editingSweet, setEditingSweet] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [editingIngredient, setEditingIngredient] = useState(null);
    const [utensils, setUtensils] = useState([]);
    const [editingUtensil, setEditingUtensil] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [firebaseError, setFirebaseError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        const initializeFirestore = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log('Executando teste de conexão Firebase...');
            const testResult = await testFirebaseConnection();
            
            if (!testResult) {
                setFirebaseError('Falha no teste de conexão Firebase. Verifique a configuração.');
                setIsLoading(false);
                return;
            }
            
            if (!db) {
                console.error('Firebase não foi inicializado corretamente');
                console.log('DB object:', db);
                setFirebaseError('Firebase não foi inicializado corretamente. Verifique a configuração.');
                setIsLoading(false);
                return;
            }

            console.log('DB object:', db);
            console.log('DB type:', typeof db);
            console.log('DB constructor:', db.constructor.name);

            try {
                const testCollection = collection(db, "test");
                console.log('Test collection criada:', testCollection);
            } catch (testError) {
                console.error('Erro ao criar collection de teste:', testError);
                setFirebaseError(`Erro de configuração do Firestore: ${testError.message}`);
                setIsLoading(false);
                return;
            }

            console.log("Iniciando a busca de dados no Firestore...");
            setIsLoading(true);
            setFirebaseError(null);

        let unsubscribeSweets, unsubscribeIngredients, unsubscribeKitchenware, unsubscribeRecipes;

        try {
            unsubscribeSweets = onSnapshot(
                collection(db, "sweets"), 
                (snapshot) => {
                    const sweetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setSweets(sweetsData);
                    console.log("Dados de 'sweets' carregados/atualizados:", sweetsData);
                },
                (error) => {
                    console.error("Erro ao buscar sweets:", error);
                    setFirebaseError(`Erro ao carregar doces: ${error.message}`);
                }
            );

            unsubscribeIngredients = onSnapshot(
                collection(db, "ingredients"), 
                (snapshot) => {
                    const ingredientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setIngredients(ingredientsData);
                    console.log("Dados de 'ingredients' carregados/atualizados:", ingredientsData);
                },
                (error) => {
                    console.error("Erro ao buscar ingredients:", error);
                    setFirebaseError(`Erro ao carregar ingredientes: ${error.message}`);
                }
            );

            unsubscribeKitchenware = onSnapshot(
                collection(db, "kitchenware"), 
                (snapshot) => {
                    setUtensils(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                },
                (error) => {
                    console.error("Erro ao buscar kitchenware:", error);
                    setFirebaseError(`Erro ao carregar utensílios: ${error.message}`);
                }
            );

            unsubscribeRecipes = onSnapshot(
                collection(db, "recipes"), 
                (snapshot) => {
                    setRecipes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                },
                (error) => {
                    console.error("Erro ao buscar recipes:", error);
                    setFirebaseError(`Erro ao carregar receitas: ${error.message}`);
                }
            );

            Promise.all([
                getDocs(collection(db, "sweets")).catch(err => {
                    console.error("Erro ao carregar sweets iniciais:", err);
                    return [];
                }),
                getDocs(collection(db, "ingredients")).catch(err => {
                    console.error("Erro ao carregar ingredients iniciais:", err);
                    return [];
                })
            ]).then(() => {
                setIsLoading(false);
                console.log("Carregamento inicial concluído.");
            }).catch((error) => {
                console.error("Erro no carregamento inicial:", error);
                setFirebaseError(`Erro no carregamento inicial: ${error.message}`);
                setIsLoading(false);
            });

        } catch (error) {
            console.error("Erro ao configurar listeners do Firestore:", error);
            setFirebaseError(`Erro ao configurar Firebase: ${error.message}`);
            setIsLoading(false);
        }

        return () => {
            console.log("Removendo os listeners do Firestore.");
            if (unsubscribeSweets) unsubscribeSweets();
            if (unsubscribeIngredients) unsubscribeIngredients();
            if (unsubscribeKitchenware) unsubscribeKitchenware();
            if (unsubscribeRecipes) unsubscribeRecipes();
        };
    };

    initializeFirestore();
}, []);
    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        const storedUserData = localStorage.getItem('userData');

        if (token && storedUserData) {
            try {
                setIsAuthenticated(true);
                setUserData(JSON.parse(storedUserData));
                setCurrentPage('dashboard');
            } catch (error) {
                console.error("Falha ao analisar dados da sessão, limpando sessão:", error);
                localStorage.clear();
            }
        }
    }, []);

    if (firebaseError) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="text-xl font-semibold text-red-600 mb-4">Erro de Conexão</div>
                <div className="text-gray-600 text-center max-w-md">
                    {firebaseError}
                </div>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

   if (isLoading) {
    return <LoadingPage message="Carregando dados do Firebase" submessage="Conectando ao banco de dados" />;
    }

    const handleLogin = (data) => {
        localStorage.setItem('jwt_token', data.access_token);
        localStorage.setItem('userData', data.user);
        setUserData(data);
        setIsAuthenticated(true);
        setActiveTab('sweets');
        setCurrentPage('dashboard');
    };

    const handleLogout = () => {
        localStorage.clear();
        setIsAuthenticated(false);
        setUserData(null);
        setActiveTab('sweets');
        setCurrentPage('login');
    };

    const handleRegister = (data) => {
        alert("Registro bem-sucedido! Por favor, faça o login.");
        setCurrentPage('login');
    };

    const handleNavigate = (page, data = null) => {
        if (page === 'edit-sweet') setEditingSweet(data);
        else if (page === 'edit-ingredient') setEditingIngredient(data);
        else if (page === 'edit-utensil') setEditingUtensil(data);
        else {
            setEditingSweet(null);
            setEditingIngredient(null);
            setEditingUtensil(null);
        }
        setCurrentPage(page);
    };
    const handleAddSweet = async (newSweet) => {
        setIsSubmitting(true);
        try {
            const sweetData = {
                ...newSweet,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: userData?.id || 'anonymous' 
            };

            Object.keys(sweetData).forEach(key => {
                if (sweetData[key] === undefined || sweetData[key] === '') {
                    delete sweetData[key];
                }
            });

            console.log('Adicionando doce ao Firebase:', sweetData);
            const docRef = await addDoc(collection(db, "sweets"), sweetData);
            console.log('Doce adicionado com sucesso. ID:', docRef.id);
            setActiveTab('sweets');
            setCurrentPage('dashboard');
            
            alert('Doce adicionado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao adicionar doce:', error);
            alert(`Erro ao adicionar doce: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSweet = async (updatedSweet) => {
        if (!updatedSweet.id) {
            console.error('ID do doce não fornecido para edição');
            alert('Erro: ID do doce não encontrado');
            return;
        }

        setIsSubmitting(true);
        try {
            const { id, ...sweetData } = updatedSweet;
            
            const updateData = {
                ...sweetData,
                updatedAt: new Date(),
                userId: userData?.id || 'anonymous'
            };

            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined || updateData[key] === '') {
                    delete updateData[key];
                }
            });

            console.log('Atualizando doce no Firebase:', id, updateData);

            await updateDoc(doc(db, "sweets", id), updateData);
            
            console.log('Doce atualizado com sucesso');
            
            setEditingSweet(null);
            setActiveTab('sweets');
            setCurrentPage('dashboard');
            
            alert('Doce atualizado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao atualizar doce:', error);
            alert(`Erro ao atualizar doce: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDelete = async (id) => {

        if (!id) {
            alert("Erro: ID não fornecido.");
            return;
        }

        if (window.confirm(`Tem certeza que deseja excluir este item permanentemente?`)) {
            try {
                const docRef = doc(db, activeTab, id);

                await deleteDoc(docRef);

                alert('Item excluído com sucesso!');
                console.log(`Documento com ID ${id} excluído da coleção ${activeTab}`);
            } catch (error) {
                console.error("Erro ao excluir o item:", error);
                alert(`Ocorreu um erro ao excluir o item: ${error.message}`);
            }
        }
    };
    const handleAddIngredient = (newIngredient) => {
        setIngredients(prev => [...prev, { ...newIngredient, id: Date.now() }]);
        setActiveTab('ingredients');
        setCurrentPage('dashboard');
    };

    const handleEditIngredient = (updatedIngredient) => {
        setIngredients(prev => prev.map(i => (i.id === updatedIngredient.id ? updatedIngredient : i)));
        setEditingIngredient(null);
        setActiveTab('ingredients');
        setCurrentPage('dashboard');
    };

    const handleAddUtensil = (newUtensil) => {
        setUtensils(prev => [...prev, { ...newUtensil, id: Date.now() }]);
        setActiveTab('kitchenware');
        setCurrentPage('dashboard');
    };

    const handleEditUtensil = (updatedUtensil) => {
        setUtensils(prev => prev.map(u => (u.id === updatedUtensil.id ? updatedUtensil : u)));
        setEditingUtensil(null);
        setActiveTab('kitchenware');
        setCurrentPage('dashboard');
    };

    const renderPage = () => {
        if (!isAuthenticated) {
            switch (currentPage) {
                case 'register':
                    return <RegisterPage onNavigate={handleNavigate} onRegister={handleRegister} />;
                default:
                    return <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />;
            }
        }

        let pageComponent;
        switch (currentPage) {
            case 'add-sweet':
                pageComponent = (
                    <SweetForm
                        onSubmit={handleAddSweet}
                        onCancel={() => handleNavigate('dashboard')}
                        pageTitle="Adicionar Novo Doce"
                        buttonText={isSubmitting ? "Adicionando..." : "Adicionar"}
                        isSubmitting={isSubmitting}
                        ingredients={ingredients} 
                    />
                );
                break;
            case 'edit-sweet':
                pageComponent = (
                    <SweetForm
                        onSubmit={handleEditSweet}
                        onCancel={() => handleNavigate('dashboard')}
                        initialData={editingSweet}
                        pageTitle="Editar Doce"
                        buttonText={isSubmitting ? "Salvando..." : "Salvar Alterações"}
                        isSubmitting={isSubmitting}
                        ingredients={ingredients} 
                        />
                );
                break;
            case 'add-ingredient':
                pageComponent = (
                    <IngredientForm
                        onSubmit={handleAddIngredient}
                        onCancel={() => handleNavigate('dashboard')}
                        pageTitle="Adicionar Ingrediente"
                        buttonText="Adicionar"
                    />
                );
                break;
            case 'edit-ingredient':
                pageComponent = (
                    <IngredientForm
                        onSubmit={handleEditIngredient}
                        onCancel={() => handleNavigate('dashboard')}
                        initialData={editingIngredient}
                        pageTitle="Editar Ingrediente"
                        buttonText="Salvar Alterações"
                    />
                );
                break;
            case 'add-utensil':
                pageComponent = (
                    <KitchenwareForm
                        onSubmit={handleAddUtensil}
                        onCancel={() => handleNavigate('dashboard')}
                        pageTitle="Adicionar Utensílio"
                        buttonText="Adicionar"
                    />
                );
                break;
            case 'edit-utensil':
                pageComponent = (
                    <KitchenwareForm
                        onSubmit={handleEditUtensil}
                        onCancel={() => handleNavigate('dashboard')}
                        initialData={editingUtensil}
                        pageTitle="Editar Utensílio"
                        buttonText="Salvar"
                    />
                );
                break;
            case 'pdv':
                pageComponent = <PDVPage sweets={sweets} onNavigate={handleNavigate} userData={userData} />;
                break;
            case 'finance':
                pageComponent = <FinancePage sweets={sweets} ingredients={ingredients} recipes={recipes} sales={sales} />;
                break;
            default:
                pageComponent = (
                    <DashboardPage
                        onNavigate={handleNavigate}
                        sweets={sweets}
                        setSweets={setSweets}
                        ingredients={ingredients}
                        setIngredients={setIngredients}
                        utensils={utensils}
                        setUtensils={setUtensils}
                        userData={userData}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onDelete={handleDelete} 
                    />
                );
                break;
        }

        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Header onLogout={handleLogout} onNavigate={handleNavigate} userData={userData} currentPage={currentPage} />
                <main className="w-full flex-grow">{pageComponent}</main>
                <Footer />
            </div>
        );
    };

    return <>{renderPage()}</>;
}
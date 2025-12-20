import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import OfflineIndicator from './components/OfflineIndicator';
import LoadingPage from './components/LoadingPage';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import FinancePage from './pages/FinancePage';
import ReportsPage from './pages/ReportsPage';
import PDVPage from './pages/PDVPage';
import SweetForm from './pages/SweetForm';
import IngredientForm from './pages/IngredientForm';
import KitchenwareForm from './pages/KitchenwareForm';
import { useFirestore } from './hooks/useFirestore';
import { FIRESTORE_COLLECTIONS } from './constants/firebaseCollections';
import { authService } from './services/authService';
import { firestoreService } from './services/firestoreService';
import { logger } from './utils/logger';
import { useToast } from './hooks/useToast';

const App = () => {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState('login');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sweets');
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: sweets, loading: sweetsLoading } = useFirestore(FIRESTORE_COLLECTIONS.SWEETS);
  const { data: ingredients, loading: ingredientsLoading } = useFirestore(FIRESTORE_COLLECTIONS.INGREDIENTS);
  const { data: kitchenware, loading: kitchenwareLoading } = useFirestore(FIRESTORE_COLLECTIONS.KITCHENWARE);
  const { data: sales, loading: salesLoading } = useFirestore(FIRESTORE_COLLECTIONS.SALES);
  const { data: recipes } = useFirestore(FIRESTORE_COLLECTIONS.RECIPES);

  const [localSweets, setLocalSweets] = useState([]);
  const [localIngredients, setLocalIngredients] = useState([]);
  const [localKitchenware, setLocalKitchenware] = useState([]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('userData');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setCurrentPage('dashboard');
        logger.info('User session restored', { userId: user.id });
      } catch (error) {
        logger.error('Error parsing stored user', { error: error.message });
        sessionStorage.removeItem('userData');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (sweets) setLocalSweets(sweets);
  }, [sweets]);

  useEffect(() => {
    if (ingredients) setLocalIngredients(ingredients);
  }, [ingredients]);

  useEffect(() => {
    if (kitchenware) setLocalKitchenware(kitchenware);
  }, [kitchenware]);

  const handleLogin = (data) => {
    setUserData(data.user);
    setCurrentPage('dashboard');
  };

  const handleRegister = (data) => {
    setUserData(data.user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setUserData(null);
    setCurrentPage('login');
    sessionStorage.clear();
    logger.info('User logged out');
  };

  const handleNavigate = (page, item = null) => {
    setCurrentPage(page);
    if (item) {
      setEditingItem(item);
    } else {
      setEditingItem(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const collectionMap = {
        'sweets': FIRESTORE_COLLECTIONS.SWEETS,
        'ingredients': FIRESTORE_COLLECTIONS.INGREDIENTS,
        'kitchenware': FIRESTORE_COLLECTIONS.KITCHENWARE
      };

      let collection = null;
      for (const [key, collectionName] of Object.entries(collectionMap)) {
        const data = key === 'sweets' ? localSweets : key === 'ingredients' ? localIngredients : localKitchenware;
        if (data.find(item => item.id === id)) {
          collection = collectionName;
          break;
        }
      }

      if (collection) {
        await firestoreService.deleteDocument(collection, id, userData?.id);
        toast.success('Item deletado com sucesso');
        logger.info('Item deleted', { id, collection });
      }
    } catch (error) {
      toast.error('Erro ao deletar item', error.message);
      logger.error('Error deleting item', { error: error.message });
    }
  };

  const handleSweetForm = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingItem?.id) {
        await firestoreService.updateDocument(
          FIRESTORE_COLLECTIONS.SWEETS,
          editingItem.id,
          formData,
          userData?.id
        );
        toast.success('Doce atualizado com sucesso');
        logger.info('Sweet updated', { id: editingItem.id });
      } else {
        await firestoreService.addDocument(
          FIRESTORE_COLLECTIONS.SWEETS,
          formData,
          userData?.id
        );
        toast.success('Doce adicionado com sucesso');
        logger.info('Sweet added');
      }
      setCurrentPage('dashboard');
      setEditingItem(null);
    } catch (error) {
      toast.error('Erro ao salvar doce', error.message);
      logger.error('Error saving sweet', { error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIngredientForm = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingItem?.id) {
        await firestoreService.updateDocument(
          FIRESTORE_COLLECTIONS.INGREDIENTS,
          editingItem.id,
          formData,
          userData?.id
        );
        toast.success('Ingrediente atualizado com sucesso');
        logger.info('Ingredient updated', { id: editingItem.id });
      } else {
        await firestoreService.addDocument(
          FIRESTORE_COLLECTIONS.INGREDIENTS,
          formData,
          userData?.id
        );
        toast.success('Ingrediente adicionado com sucesso');
        logger.info('Ingredient added');
      }
      setCurrentPage('dashboard');
      setEditingItem(null);
    } catch (error) {
      toast.error('Erro ao salvar ingrediente', error.message);
      logger.error('Error saving ingredient', { error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKitchenwareForm = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingItem?.id) {
        await firestoreService.updateDocument(
          FIRESTORE_COLLECTIONS.KITCHENWARE,
          editingItem.id,
          formData,
          userData?.id
        );
        toast.success('Utensilio atualizado com sucesso');
        logger.info('Kitchenware updated', { id: editingItem.id });
      } else {
        await firestoreService.addDocument(
          FIRESTORE_COLLECTIONS.KITCHENWARE,
          formData,
          userData?.id
        );
        toast.success('Utensilio adicionado com sucesso');
        logger.info('Kitchenware added');
      }
      setCurrentPage('dashboard');
      setEditingItem(null);
    } catch (error) {
      toast.error('Erro ao salvar utensilio', error.message);
      logger.error('Error saving kitchenware', { error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingPage message="Iniciando aplicacao" submessage="Carregando configuracoes" />;
  }

  const isAuthenticated = !!userData;

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {isAuthenticated && <Header onLogout={handleLogout} onNavigate={handleNavigate} currentPage={currentPage} sweets={localSweets} ingredients={localIngredients} kitchenware={localKitchenware} sales={sales} userData={userData} />}
        
        <OfflineIndicator onSyncComplete={() => toast.success('Dados sincronizados')} />

        <main className="flex-grow">
          <AnimatePresence mode="wait">
            {!isAuthenticated ? (
              currentPage === 'login' ? (
                <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />
                </motion.div>
              ) : (
                <motion.div key="register" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <RegisterPage onRegister={handleRegister} onNavigate={handleNavigate} />
                </motion.div>
              )
            ) : currentPage === 'dashboard' ? (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DashboardPage onNavigate={handleNavigate} sweets={localSweets} setSweets={setLocalSweets} ingredients={localIngredients} setIngredients={setLocalIngredients} utensils={localKitchenware} setUtensils={setLocalKitchenware} userData={userData} activeTab={activeTab} onTabChange={setActiveTab} onDelete={handleDelete} />
              </motion.div>
            ) : currentPage === 'add-sweet' || currentPage === 'edit-sweet' ? (
              <motion.div key="sweet-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SweetForm onSubmit={handleSweetForm} onCancel={() => { setCurrentPage('dashboard'); setEditingItem(null); }} initialData={editingItem} pageTitle={editingItem ? 'Editar Doce' : 'Adicionar Novo Doce'} buttonText={editingItem ? 'Atualizar' : 'Adicionar'} isSubmitting={isSubmitting} />
              </motion.div>
            ) : currentPage === 'add-ingredient' || currentPage === 'edit-ingredient' ? (
              <motion.div key="ingredient-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <IngredientForm onSubmit={handleIngredientForm} onCancel={() => { setCurrentPage('dashboard'); setEditingItem(null); }} initialData={editingItem} pageTitle={editingItem ? 'Editar Ingrediente' : 'Adicionar Novo Ingrediente'} buttonText={editingItem ? 'Atualizar' : 'Adicionar'} />
              </motion.div>
            ) : currentPage === 'add-utensil' || currentPage === 'edit-utensil' ? (
              <motion.div key="utensil-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KitchenwareForm onSubmit={handleKitchenwareForm} onCancel={() => { setCurrentPage('dashboard'); setEditingItem(null); }} initialData={editingItem} pageTitle={editingItem ? 'Editar Utensilio' : 'Adicionar Novo Utensilio'} buttonText={editingItem ? 'Atualizar' : 'Adicionar'} />
              </motion.div>
            ) : currentPage === 'finance' ? (
              <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FinancePage sweetsExternal={localSweets} salesExternal={sales} ingredientsExternal={localIngredients} recipesExternal={recipes} />
              </motion.div>
            ) : currentPage === 'reports' ? (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ReportsPage sweetsExternal={localSweets} salesExternal={sales} ingredientsExternal={localIngredients} recipesExternal={recipes} />
              </motion.div>
            ) : currentPage === 'pdv' ? (
              <motion.div key="pdv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PDVPage sweets={localSweets} onNavigate={handleNavigate} userData={userData} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>

        {isAuthenticated && <Footer />}
      </div>
    </ErrorBoundary>
  );
};

export default App;
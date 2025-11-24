import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebaseConfig';
import { FIRESTORE_COLLECTIONS } from './constants/firebaseCollections';
import { firestoreService } from './services/firestoreService';
import { useFirestore } from './hooks/useFirestore';
import { logger } from './utils/logger';
import LoadingPage from './components/LoadingPage';
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
  const [firebaseError, setFirebaseError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSweet, setEditingSweet] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [editingUtensil, setEditingUtensil] = useState(null);

  const { data: sweets, loading: sweetsLoading, error: sweetsError } = useFirestore(FIRESTORE_COLLECTIONS.SWEETS);
  const { data: recipes, loading: recipesLoading } = useFirestore(FIRESTORE_COLLECTIONS.RECIPES);
  const { data: sales } = useFirestore(FIRESTORE_COLLECTIONS.SALES);
  const { data: ingredients, loading: ingredientsLoading } = useFirestore(FIRESTORE_COLLECTIONS.INGREDIENTS);
  const { data: utensils } = useFirestore(FIRESTORE_COLLECTIONS.KITCHENWARE);

  const isLoading = sweetsLoading || recipesLoading || ingredientsLoading;

  useEffect(() => {
    const token = sessionStorage.getItem('jwt_token');
    const storedUserData = sessionStorage.getItem('userData');

    if (token && storedUserData) {
      try {
        setIsAuthenticated(true);
        setUserData(JSON.parse(storedUserData));
        setCurrentPage('dashboard');
        logger.info('User session restored');
      } catch (error) {
        logger.error('Failed to restore session', { error: error.message });
        sessionStorage.clear();
      }
    }
  }, []);

  const handleLogin = useCallback((data) => {
    setUserData(data.user);
    setIsAuthenticated(true);
    setActiveTab('sweets');
    setCurrentPage('dashboard');
    logger.info('User logged in successfully');
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUserData(null);
    setActiveTab('sweets');
    setCurrentPage('login');
    logger.info('User logged out');
  }, []);

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

  const handleAddSweet = useCallback(async (newSweet) => {
    setIsSubmitting(true);
    try {
      await firestoreService.addDocument(
        FIRESTORE_COLLECTIONS.SWEETS,
        newSweet,
        userData?.id || 'anonymous'
      );
      setActiveTab('sweets');
      setCurrentPage('dashboard');
      logger.info('Sweet added successfully');
    } catch (error) {
      logger.error('Failed to add sweet', { error: error.message });
      alert(`Error adding sweet: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [userData]);

  const handleEditSweet = useCallback(async (updatedSweet) => {
    if (!updatedSweet.id) {
      alert('Error: Sweet ID not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const { id, ...sweetData } = updatedSweet;
      await firestoreService.updateDocument(
        FIRESTORE_COLLECTIONS.SWEETS,
        id,
        sweetData,
        userData?.id || 'anonymous'
      );
      setEditingSweet(null);
      setActiveTab('sweets');
      setCurrentPage('dashboard');
      logger.info('Sweet updated successfully');
    } catch (error) {
      logger.error('Failed to update sweet', { error: error.message });
      alert(`Error updating sweet: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [userData]);

  const handleAddIngredient = useCallback(async (newIngredient) => {
    setIsSubmitting(true);
    try {
      await firestoreService.addDocument(
        FIRESTORE_COLLECTIONS.INGREDIENTS,
        newIngredient,
        userData?.id || 'anonymous'
      );
      setActiveTab('ingredients');
      setCurrentPage('dashboard');
      logger.info('Ingredient added successfully');
    } catch (error) {
      logger.error('Failed to add ingredient', { error: error.message });
      alert(`Error adding ingredient: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [userData]);

  const handleEditIngredient = useCallback(async (updatedIngredient) => {
    if (!updatedIngredient.id) {
      alert('Error: Ingredient ID not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const { id, ...ingredientData } = updatedIngredient;
      await firestoreService.updateDocument(
        FIRESTORE_COLLECTIONS.INGREDIENTS,
        id,
        ingredientData,
        userData?.id || 'anonymous'
      );
      setEditingIngredient(null);
      setActiveTab('ingredients');
      setCurrentPage('dashboard');
      logger.info('Ingredient updated successfully');
    } catch (error) {
      logger.error('Failed to update ingredient', { error: error.message });
      alert(`Error updating ingredient: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [userData]);

  const handleAddUtensil = useCallback(async (newUtensil) => {
    setIsSubmitting(true);
    try {
      await firestoreService.addDocument(
        FIRESTORE_COLLECTIONS.KITCHENWARE,
        newUtensil,
        userData?.id || 'anonymous'
      );
      setActiveTab('kitchenware');
      setCurrentPage('dashboard');
      logger.info('Utensil added successfully');
    } catch (error) {
      logger.error('Failed to add utensil', { error: error.message });
      alert(`Error adding utensil: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [userData]);

  const handleEditUtensil = useCallback(async (updatedUtensil) => {
    if (!updatedUtensil.id) {
      alert('Error: Utensil ID not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const { id, ...utensilData } = updatedUtensil;
      await firestoreService.updateDocument(
        FIRESTORE_COLLECTIONS.KITCHENWARE,
        id,
        utensilData,
        userData?.id || 'anonymous'
      );
      setEditingUtensil(null);
      setActiveTab('kitchenware');
      setCurrentPage('dashboard');
      logger.info('Utensil updated successfully');
    } catch (error) {
      logger.error('Failed to update utensil', { error: error.message });
      alert(`Error updating utensil: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [userData]);

  const handleDelete = useCallback(async (id) => {
    if (!id) {
      alert('Error: ID not provided');
      return;
    }

    if (window.confirm('Are you sure you want to delete this item permanently?')) {
      try {
        await firestoreService.deleteDocument(
          activeTab,
          id,
          userData?.id || 'anonymous'
        );
        alert('Item deleted successfully');
        logger.info(`Document deleted from ${activeTab}`, { docId: id });
      } catch (error) {
        logger.error('Failed to delete item', { error: error.message });
        alert(`Error deleting item: ${error.message}`);
      }
    }
  }, [activeTab, userData]);

  if (firebaseError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="text-xl font-semibold text-red-600 mb-4">Connection Error</div>
        <div className="text-gray-600 text-center max-w-md">
          {firebaseError}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingPage message="Loading Firebase data" submessage="Connecting to database" />;
  }

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
            setSweets={() => {}}
            ingredients={ingredients}
            setIngredients={() => {}}
            utensils={utensils}
            setUtensils={() => {}}
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
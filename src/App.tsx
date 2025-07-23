import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProductProvider } from './contexts/ProductContext';
import { SupplierProvider } from './contexts/SupplierContext';
import { AuthProvider } from './contexts/AuthContext';
import { SecurityProvider } from './contexts/SecurityContext';
import { FinancialProvider } from './contexts/FinancialContext';
import { SalesProvider } from './contexts/SalesContext';
import { PromotionsProvider } from './contexts/PromotionsContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import ProductDetail from './pages/Products/ProductDetail';
import AddProduct from './pages/Products/AddProduct';
import EditProduct from './pages/Products/EditProduct';
import Suppliers from './pages/Suppliers/Suppliers';
import AddSupplier from './pages/Suppliers/AddSupplier';
import FileUpload from './pages/FileUpload/FileUpload';
import ShelfOptimizer from './pages/ShelfOptimizer/ShelfOptimizer';
import SalesTerminal from './pages/Sales/SalesTerminal';
import CashRegister from './pages/Sales/CashRegister';
import ProductExpiryManagement from './pages/Products/ProductExpiry';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ResetPassword from './pages/Auth/ResetPassword';
import SecuritySettings from './pages/Security/SecuritySettings';
import AdvancedSecurity from './pages/Security/AdvancedSecurity';
import UserManagement from './pages/Users/UserManagement';
import NotFound from './pages/NotFound/NotFound';
import PromotionsManagement from './pages/Promotions/PromotionsManagement';
import InventoryMobile from './pages/Inventory/InventoryMobile';
import StoreTransfers from './pages/Inventory/StoreTransfers';
import LossControl from './pages/Inventory/LossControl';
import BatchTrackingPage from './pages/Inventory/BatchTracking';
import ReturnsManagement from './pages/Inventory/ReturnsManagement';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SecurityProvider>
          <ProductProvider>
            <SupplierProvider>
              <FinancialProvider>
                <SalesProvider>
                  <PromotionsProvider>
                  <Router>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route element={<Layout />}>
                      <Route path="/" element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/products" element={
                        <ProtectedRoute>
                          <Products />
                        </ProtectedRoute>
                      } />
                      <Route path="/products/:id" element={
                        <ProtectedRoute>
                          <ProductDetail />
                        </ProtectedRoute>
                      } />
                      <Route path="/products/add" element={
                        <ProtectedRoute>
                          <AddProduct />
                        </ProtectedRoute>
                      } />
                      <Route path="/products/edit/:id" element={
                        <ProtectedRoute>
                          <EditProduct />
                        </ProtectedRoute>
                      } />
                      <Route path="/products/expiry" element={
                        <ProtectedRoute>
                          <ProductExpiryManagement />
                        </ProtectedRoute>
                      } />
                      <Route path="/suppliers" element={
                        <ProtectedRoute>
                          <Suppliers />
                        </ProtectedRoute>
                      } />
                      <Route path="/suppliers/add" element={
                        <ProtectedRoute>
                          <AddSupplier />
                        </ProtectedRoute>
                      } />
                      <Route path="/sales" element={
                        <ProtectedRoute>
                          <SalesTerminal />
                        </ProtectedRoute>
                      } />
                      <Route path="/cash-register" element={
                        <ProtectedRoute>
                          <CashRegister />
                        </ProtectedRoute>
                      } />
                      <Route path="/upload" element={
                        <ProtectedRoute>
                          <FileUpload />
                        </ProtectedRoute>
                      } />
                      <Route path="/shelf-optimizer" element={
                        <ProtectedRoute>
                          <ShelfOptimizer />
                        </ProtectedRoute>
                      } />
                      <Route path="/security" element={
                        <ProtectedRoute>
                          <SecuritySettings />
                        </ProtectedRoute>
                      } />
                      <Route path="/security/advanced" element={
                        <ProtectedRoute>
                          <AdvancedSecurity />
                        </ProtectedRoute>
                      } />
                      <Route path="/users" element={
                        <ProtectedRoute>
                          <UserManagement />
                        </ProtectedRoute>
                      } />
                      <Route path="/promotions" element={
                        <ProtectedRoute>
                          <PromotionsManagement />
                        </ProtectedRoute>
                      } />
                     <Route path="/inventory/mobile" element={
                       <ProtectedRoute>
                         <InventoryMobile />
                       </ProtectedRoute>
                     } />
                     <Route path="/inventory/transfers" element={
                       <ProtectedRoute>
                         <StoreTransfers />
                       </ProtectedRoute>
                     } />
                     <Route path="/inventory/losses" element={
                       <ProtectedRoute>
                         <LossControl />
                       </ProtectedRoute>
                     } />
                     <Route path="/inventory/batches" element={
                       <ProtectedRoute>
                         <BatchTrackingPage />
                       </ProtectedRoute>
                     } />
                     <Route path="/inventory/returns" element={
                       <ProtectedRoute>
                         <ReturnsManagement />
                       </ProtectedRoute>
                     } />
                      <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                    <Toaster 
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#363636',
                          color: '#fff',
                        },
                        success: {
                          duration: 3000,
                          iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                          },
                        },
                        error: {
                          duration: 5000,
                          iconTheme: {
                            primary: '#EF4444',
                            secondary: '#fff',
                          },
                        },
                      }}
                    />
                  </Router>
                  </PromotionsProvider>
                </SalesProvider>
              </FinancialProvider>
            </SupplierProvider>
          </ProductProvider>
        </SecurityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
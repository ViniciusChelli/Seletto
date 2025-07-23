import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import { supabase } from '../../lib/supabase';
import AnalyticsSummary from './components/AnalyticsSummary';
import RevenueChart from './components/RevenueChart';
import TopProducts from './components/TopProducts';
import CategoryDistribution from './components/CategoryDistribution';
import LowStockProducts from './components/LowStockProducts';
import TopSellingProducts from './components/TopSellingProducts';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { products } = useProducts();
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      totalRevenue: 0,
      revenueChange: 0,
      totalProducts: 0,
      productsChange: 0,
      totalCustomers: 0,
      customersChange: 0,
      totalOrders: 0,
      ordersChange: 0,
    },
    revenue: {
      labels: [] as string[],
      currentPeriod: [] as number[],
      previousPeriod: [] as number[],
    },
    topProducts: {
      labels: [] as string[],
      revenue: [] as number[],
      units: [] as number[],
    },
    categories: {
      labels: [] as string[],
      values: [] as number[],
    },
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Mock data for demonstration
      setAnalyticsData({
        summary: {
          totalRevenue: 150000,
          revenueChange: 12.5,
          totalProducts: products.length,
          productsChange: 8.2,
          totalCustomers: 250,
          customersChange: 15.3,
          totalOrders: 1250,
          ordersChange: 10.1,
        },
        revenue: {
          labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
          currentPeriod: [12000, 15000, 13000, 18000, 21000, 24000, 19000],
          previousPeriod: [10000, 13000, 11000, 15000, 18000, 20000, 16000],
        },
        topProducts: {
          labels: ['Produto A', 'Produto B', 'Produto C', 'Produto D', 'Produto E'],
          revenue: [5000, 4200, 3800, 3500, 3000],
          units: [100, 85, 75, 70, 60],
        },
        categories: {
          labels: ['Bebidas', 'Alimentos', 'Limpeza', 'Higiene', 'Outros'],
          values: [30, 25, 20, 15, 10],
        },
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const exportReport = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Relatório do Dashboard - Minimercado Selleto', 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35);
    
    // Add summary data
    doc.setFontSize(14);
    doc.text('Resumo Executivo', 20, 55);
    
    const summaryData = [
      ['Receita Total', `R$ ${analyticsData.summary.totalRevenue.toLocaleString('pt-BR')}`],
      ['Total de Produtos', analyticsData.summary.totalProducts.toString()],
      ['Total de Clientes', analyticsData.summary.totalCustomers.toString()],
      ['Total de Pedidos', analyticsData.summary.totalOrders.toString()],
    ];
    
    (doc as any).autoTable({
      startY: 65,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
    });
    
    // Add products with low stock
    const lowStockProducts = products.filter(p => p.stockQuantity <= (p.minStockLevel || 5));
    
    if (lowStockProducts.length > 0) {
      doc.setFontSize(14);
      doc.text('Produtos com Estoque Baixo', 20, (doc as any).lastAutoTable.finalY + 20);
      
      const lowStockData = lowStockProducts.map(product => [
        product.name,
        product.category,
        product.stockQuantity.toString(),
        (product.minStockLevel || 5).toString()
      ]);
      
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 30,
        head: [['Produto', 'Categoria', 'Estoque Atual', 'Estoque Mínimo']],
        body: lowStockData,
        theme: 'grid',
      });
    }
    
    // Save the PDF
    doc.save(`relatorio-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const lowStockProducts = products.filter(p => p.stockQuantity <= (p.minStockLevel || 5));

  // Welcome message for first-time users
  const isFirstTimeUser = userRoles.length > 0 && userRoles.some(role => role.role?.name === 'owner');
  const showWelcome = products.length === 0 && isFirstTimeUser;

  return (
    <div className="space-y-6 animate-fade-in">
      {showWelcome && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-800">
                Bem-vindo ao Minimercado Selleto! 🎉
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">
                  Você é o primeiro usuário e foi automaticamente definido como <strong>Proprietário</strong>.
                </p>
                <p className="mb-3">Para começar a usar o sistema:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Cadastre seus primeiros produtos</li>
                  <li>Configure fornecedores</li>
                  <li>Crie promoções para atrair clientes</li>
                  <li>Abra o caixa e comece a vender!</li>
                </ol>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => navigate('/products/add')}
                  className="btn btn-primary text-sm"
                >
                  Cadastrar Primeiro Produto
                </button>
                <button
                  onClick={() => navigate('/users')}
                  className="btn btn-secondary text-sm"
                >
                  Gerenciar Usuários
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button 
          onClick={exportReport}
          className="btn btn-primary flex items-center"
        >
          <Download size={18} className="mr-2" />
          Exportar Relatório
        </button>
      </div>

      <AnalyticsSummary data={analyticsData.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={analyticsData.revenue} />
        <TopProducts data={analyticsData.topProducts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDistribution data={analyticsData.categories} />
        <div className="space-y-6">
          <LowStockProducts products={lowStockProducts} />
          <TopSellingProducts products={products} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
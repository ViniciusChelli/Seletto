import React, { useState } from 'react';
import { useProducts } from '../../contexts/ProductContext';
import { Layout, BarChart3, Ban as Bar, ArrowRight, ThumbsUp, AlertTriangle } from 'lucide-react';
import { Product } from '../../types/Product';

const ShelfOptimizer: React.FC = () => {
  const { products, updateProduct } = useProducts();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  const [shelfPlans, setShelfPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState(0);
  
  // Helper function to sort products by sales
  const sortBySales = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  };
  
  // Helper function to group products by category
  const groupByCategory = (products: Product[]): Record<string, Product[]> => {
    return products.reduce((groups, product) => {
      const category = product.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
      return groups;
    }, {} as Record<string, Product[]>);
  };
  
  // Generate shelf optimization plans
  const generateOptimizationPlans = () => {
    setIsOptimizing(true);
    
    // Simulate AI processing with a delay
    setTimeout(() => {
      // Plan 1: Sales-based organization (best sellers at eye level)
      const salesBasedPlan = {
        name: 'Otimização por Vendas',
        description: 'Organiza as prateleiras com produtos mais vendidos em posições de destaque (altura dos olhos).',
        advantages: [
          'Maior visibilidade para produtos populares',
          'Aumenta as chances de venda por impulso',
          'Fácil acesso aos itens mais procurados',
        ],
        shelfAssignments: generateSalesBasedPlan(),
      };
      
      // Plan 2: Category-based organization
      const categoryBasedPlan = {
        name: 'Organização por Categorias',
        description: 'Agrupa produtos por categorias, com as mais populares em locais estratégicos.',
        advantages: [
          'Facilita a localização de produtos relacionados',
          'Cria uma experiência lógica de compras',
          'Aumenta chances de compras complementares',
        ],
        shelfAssignments: generateCategoryBasedPlan(),
      };
      
      // Plan 3: Mixed approach
      const mixedPlan = {
        name: 'Abordagem Mista',
        description: 'Combina organização por categorias com destaque para produtos mais vendidos.',
        advantages: [
          'Equilíbrio entre organização lógica e destaque comercial',
          'Flexibilidade para diferentes estratégias por seção',
          'Otimização personalizada para o seu supermercado',
        ],
        shelfAssignments: generateMixedPlan(),
      };
      
      setShelfPlans([salesBasedPlan, categoryBasedPlan, mixedPlan]);
      setIsOptimizing(false);
      setIsOptimized(true);
    }, 2500);
  };
  
  // Generate shelf assignments based on sales
  const generateSalesBasedPlan = () => {
    const sortedProducts = sortBySales(products);
    
    // Define shelf levels (eye level is most valuable)
    const shelfLevels = ['eye-level', 'waist-level', 'knee-level', 'ankle-level', 'overhead'];
    
    // Assign products to shelves based on sales rank
    const assignments: Record<string, Product[]> = {};
    
    shelfLevels.forEach(level => {
      assignments[level] = [];
    });
    
    // Distribute products across shelves (simplified algorithm)
    sortedProducts.forEach((product, index) => {
      const levelIndex = Math.min(Math.floor(index / Math.ceil(sortedProducts.length / shelfLevels.length)), shelfLevels.length - 1);
      assignments[shelfLevels[levelIndex]].push(product);
    });
    
    return assignments;
  };
  
  // Generate shelf assignments based on categories
  const generateCategoryBasedPlan = () => {
    const categoryGroups = groupByCategory(products);
    
    // Sort categories by total sales
    const sortedCategories = Object.keys(categoryGroups).sort((a, b) => {
      const totalSalesA = categoryGroups[a].reduce((sum, product) => sum + (product.salesCount || 0), 0);
      const totalSalesB = categoryGroups[b].reduce((sum, product) => sum + (product.salesCount || 0), 0);
      return totalSalesB - totalSalesA;
    });
    
    // Define aisle assignments
    const aisles: Record<string, string[]> = {};
    
    // Assign categories to aisles (simplified)
    sortedCategories.forEach((category, index) => {
      const aisleNumber = Math.floor(index / 2) + 1;
      const aisleName = `Corredor ${aisleNumber}`;
      
      if (!aisles[aisleName]) {
        aisles[aisleName] = [];
      }
      
      aisles[aisleName].push(category);
    });
    
    return aisles;
  };
  
  // Generate mixed optimization plan
  const generateMixedPlan = () => {
    const categoryGroups = groupByCategory(products);
    
    // Sort categories by total sales
    const sortedCategories = Object.keys(categoryGroups).sort((a, b) => {
      const totalSalesA = categoryGroups[a].reduce((sum, product) => sum + (product.salesCount || 0), 0);
      const totalSalesB = categoryGroups[b].reduce((sum, product) => sum + (product.salesCount || 0), 0);
      return totalSalesB - totalSalesA;
    });
    
    // Sort products within each category
    Object.keys(categoryGroups).forEach(category => {
      categoryGroups[category] = sortBySales(categoryGroups[category]);
    });
    
    // Define shelf levels for each category
    const result: Record<string, any> = {};
    
    sortedCategories.forEach((category, index) => {
      const sectionNumber = Math.floor(index / 2) + 1;
      const sectionName = `Seção ${sectionNumber}`;
      
      if (!result[sectionName]) {
        result[sectionName] = {};
      }
      
      result[sectionName][category] = {
        'eye-level': categoryGroups[category].slice(0, Math.ceil(categoryGroups[category].length * 0.3)),
        'other-levels': categoryGroups[category].slice(Math.ceil(categoryGroups[category].length * 0.3)),
      };
    });
    
    return result;
  };
  
  // Apply the selected optimization plan
  const applyOptimizationPlan = () => {
    // In a real application, this would update product locations based on the plan
    // For demo purposes, we'll just mark some products as updated
    
    const updatedProducts = products.map(product => {
      const newLocation = generateMockShelfLocation(product);
      return {
        ...product,
        location: newLocation,
      };
    });
    
    // Update products with new locations
    updatedProducts.forEach(product => {
      updateProduct(product.id, { location: product.location });
    });
    
    // Show success message
    alert('Plano de organização de prateleiras aplicado com sucesso!');
  };
  
  // Generate a mock shelf location for a product
  const generateMockShelfLocation = (product: Product) => {
    const aisleNumber = Math.floor(Math.random() * 5) + 1;
    const shelfLetter = String.fromCharCode(65 + Math.floor(Math.random() * 5)); // A-E
    const position = Math.floor(Math.random() * 10) + 1;
    
    return `Corredor ${aisleNumber}, Prateleira ${shelfLetter}, Posição ${position}`;
  };
  
  // Mock data for the sales visualization
  const salesData = {
    categories: [
      'Bebidas', 'Laticínios', 'Padaria', 'Hortifruti', 'Carnes', 
      'Mercearia', 'Limpeza', 'Higiene'
    ],
    values: [78, 65, 42, 56, 34, 29, 41, 37],
  };
  
  // Mock data for placement recommendations
  const recommendedPlacements = [
    {
      category: 'Bebidas',
      placement: 'Corredor 1, Olhos/Mãos',
      reasoning: 'Alta rotatividade e compras por impulso',
    },
    {
      category: 'Laticínios',
      placement: 'Fundo da loja, Altura média',
      reasoning: 'Produto essencial que atrai clientes para o interior',
    },
    {
      category: 'Padaria',
      placement: 'Entrada da loja, Olhos/Mãos',
      reasoning: 'Aroma atrai clientes e estimula compras',
    },
    {
      category: 'Hortifruti',
      placement: 'Entrada da loja, Altura baixa/média',
      reasoning: 'Cores vibrantes criam impressão de frescor',
    },
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Otimizador de Prateleiras com IA</h1>
          <p className="text-gray-500 mt-1">
            Use inteligência artificial para otimizar a organização dos produtos nas prateleiras
          </p>
        </div>
        {!isOptimized && (
          <button
            onClick={generateOptimizationPlans}
            disabled={isOptimizing}
            className="btn btn-primary flex items-center"
          >
            {isOptimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              <>
                <BarChart3 size={18} className="mr-2" />
                Gerar Recomendações
              </>
            )}
          </button>
        )}
      </div>
      
      {!isOptimized && !isOptimizing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Analytics */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Análise de Vendas por Categoria</h2>
            <div className="h-64 flex items-end space-x-2 mb-4">
              {salesData.categories.map((category, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-primary-500 rounded-t" 
                    style={{ height: `${salesData.values[index] * 2}px` }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-2 text-xs text-center">
              {salesData.categories.map((category, index) => (
                <div key={index} className="truncate">
                  {category}
                </div>
              ))}
            </div>
          </div>
          
          {/* Current Layout */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Layout Atual</h2>
            
            {products.length > 0 ? (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Atualmente, {products.filter(p => p.location).length} de {products.length} produtos têm definição de localização.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Produtos com localização definida</span>
                    <span className="text-sm font-medium">
                      {Math.round((products.filter(p => p.location).length / products.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary-500 h-2.5 rounded-full" 
                      style={{ width: `${(products.filter(p => p.location).length / products.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Os 3 produtos mais vendidos</h3>
                  <ul className="space-y-2">
                    {sortBySales(products).slice(0, 3).map((product) => (
                      <li key={product.id} className="flex justify-between text-sm">
                        <span>{product.name}</span>
                        <span className="text-primary-600 font-medium">{product.salesCount || 0} vendas</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Layout size={48} className="text-gray-300 mb-2" />
                <p className="text-gray-500">Nenhum produto cadastrado ainda</p>
              </div>
            )}
          </div>
          
          {/* Placement Tips */}
          <div className="card p-6 md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Dicas de Posicionamento</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posicionamento Ideal
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Justificativa
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recommendedPlacements.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.placement}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.reasoning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 bg-orange-50 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle size={20} className="text-orange-500 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-orange-800">Sabia que:</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Produtos colocados na altura dos olhos (150-170cm) têm em média 35% mais chances de serem comprados do que produtos em prateleiras mais baixas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isOptimizing && (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-6"></div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Gerando planos de otimização de prateleiras
          </h2>
          <p className="text-gray-500">
            Nossa IA está analisando seus dados de vendas e produtos para criar o melhor layout...
          </p>
          
          <div className="mt-8 max-w-md mx-auto">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Analisando padrões de vendas</span>
                <span className="text-green-500">Concluído</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Mapeando categorias de produtos</span>
                <span className="text-green-500">Concluído</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Estudando fluxo de clientes</span>
                <div className="flex items-center text-primary-500">
                  <div className="animate-pulse">Processando</div>
                  <div className="ml-2 flex space-x-1">
                    <div className="w-1 h-1 rounded-full bg-primary-500 animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Otimizando layouts</span>
                <span className="text-gray-400">Pendente</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Finalizando recomendações</span>
                <span className="text-gray-400">Pendente</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isOptimized && (
        <div className="space-y-6">
          {/* Plan Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-6">Planos de Otimização Recomendados</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shelfPlans.map((plan, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlan === index 
                      ? 'border-primary-500 ring-2 ring-primary-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(index)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{plan.name}</h3>
                    {selectedPlan === index && (
                      <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  <div className="text-xs text-gray-600">
                    <div className="font-medium mb-1">Vantagens:</div>
                    <ul className="space-y-1">
                      {plan.advantages.map((advantage: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-500 mr-1">•</span> {advantage}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={applyOptimizationPlan}
                className="btn btn-primary"
              >
                Aplicar Plano Selecionado
              </button>
            </div>
          </div>
          
          {/* Visualization of selected plan */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              Visualização: {shelfPlans[selectedPlan]?.name}
            </h2>
            
            {selectedPlan === 0 && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Este plano organiza os produtos por volume de vendas, posicionando os mais vendidos na "altura dos olhos" para maximizar as vendas.
                </p>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 font-medium">Distribuição por Níveis</div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
                        <div className="font-medium text-primary-800 mb-2">Nível Superior</div>
                        <div className="text-sm text-gray-600">
                          Produtos leves, menos vendidos ou de grandes dimensões
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          ~15% das vendas
                        </div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                        <div className="font-medium text-green-800 mb-2">Altura dos Olhos</div>
                        <div className="text-sm text-gray-600">
                          <strong>Produtos mais vendidos</strong> e com maior margem de lucro
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          ~40% das vendas
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="font-medium text-blue-800 mb-2">Altura das Mãos</div>
                        <div className="text-sm text-gray-600">
                          Produtos de venda regular, fácil alcance
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          ~25% das vendas
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                        <div className="font-medium text-amber-800 mb-2">Altura dos Joelhos</div>
                        <div className="text-sm text-gray-600">
                          Produtos mais pesados, menor rotatividade
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          ~15% das vendas
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="font-medium text-gray-800 mb-2">Nível Inferior</div>
                        <div className="text-sm text-gray-600">
                          Produtos pesados, volumosos, básicos
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          ~5% das vendas
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 font-medium">Benefícios Esperados</div>
                    <div className="p-4">
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <ThumbsUp size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Aumento de 15-25% nas vendas dos produtos "estrelas"</span>
                        </li>
                        <li className="flex items-center">
                          <ThumbsUp size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Melhor visibilidade para produtos com maior margem</span>
                        </li>
                        <li className="flex items-center">
                          <ThumbsUp size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Facilidade de acesso para produtos mais procurados</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 font-medium">Desafios de Implementação</div>
                    <div className="p-4">
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <AlertTriangle size={16} className="text-orange-500 mr-2 mt-0.5" />
                          <span className="text-sm">Pode dificultar a localização por categorias para os clientes</span>
                        </li>
                        <li className="flex items-start">
                          <AlertTriangle size={16} className="text-orange-500 mr-2 mt-0.5" />
                          <span className="text-sm">Requer reorganização frequente conforme padrões de vendas mudam</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedPlan === 1 && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Este plano organiza os produtos por categorias relacionadas, facilitando a experiência de compra dos clientes.
                </p>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 font-medium">Organização por Corredores</div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="font-medium text-blue-800 mb-2">Corredor 1</div>
                        <div className="text-sm">
                          <div className="mb-1 font-medium text-gray-700">Categoria Principal:</div>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Bebidas</li>
                            <li>• Laticínios</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                        <div className="font-medium text-green-800 mb-2">Corredor 2</div>
                        <div className="text-sm">
                          <div className="mb-1 font-medium text-gray-700">Categoria Principal:</div>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Hortifruti</li>
                            <li>• Padaria</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                        <div className="font-medium text-amber-800 mb-2">Corredor 3</div>
                        <div className="text-sm">
                          <div className="mb-1 font-medium text-gray-700">Categoria Principal:</div>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Mercearia</li>
                            <li>• Carnes</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                        <div className="font-medium text-purple-800 mb-2">Corredor 4</div>
                        <div className="text-sm">
                          <div className="mb-1 font-medium text-gray-700">Categoria Principal:</div>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Higiene</li>
                            <li>• Limpeza</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
                        <div className="font-medium text-pink-800 mb-2">Corredor 5</div>
                        <div className="text-sm">
                          <div className="mb-1 font-medium text-gray-700">Categoria Principal:</div>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Congelados</li>
                            <li>• Outros</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 font-medium">Benefícios Esperados</div>
                    <div className="p-4">
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <ThumbsUp size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Experiência de compra mais intuitiva para os clientes</span>
                        </li>
                        <li className="flex items-center">
                          <ThumbsUp size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Aumento das vendas de produtos complementares</span>
                        </li>
                        <li className="flex items-center">
                          <ThumbsUp size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Maior facilidade na reposição de produtos</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 font-medium">Fluxo de Clientes</div>
                    <div className="p-4">
                      <div className="relative h-48 border border-gray-200 rounded">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <Bar size={48} className="mx-auto text-gray-300" />
                            <p className="text-sm text-gray-500 mt-2">
                              Mapa de calor de fluxo disponível após implementação
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-0 left-0 p-2 text-xs text-gray-500">Entrada</div>
                        <div className="absolute bottom-0 right-0 p-2 text-xs text-gray-500">Caixas</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedPlan === 2 && (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Este plano combina a organização por categorias com posicionamento estratégico de produtos populares em cada seção.
                </p>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 font-medium">Estratégia Mista</div>
                  <div className="p-4">
                    <div className="flex items-center justify-center mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-900">Organização por Categorias</h3>
                        <div className="flex items-center justify-center my-2">
                          <ArrowRight size={24} className="text-primary-500" />
                        </div>
                        <p className="text-sm text-gray-600">Produtos agrupados logicamente</p>
                      </div>
                      <div className="mx-4 text-xl text-primary-500">+</div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-900">Destaque por Vendas</h3>
                        <div className="flex items-center justify-center my-2">
                          <BarChart3 size={24} className="text-primary-500" />
                        </div>
                        <p className="text-sm text-gray-600">Priorização por popularidade</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Exemplo: Seção de Bebidas</h3>
                        <div className="space-y-3">
                          <div className="bg-green-50 border border-green-100 rounded p-3">
                            <div className="font-medium text-green-800 mb-1">Altura dos Olhos</div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Produtos mais vendidos:</span> Água Mineral, Refrigerantes, Sucos Prontos
                            </p>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-100 rounded p-3">
                            <div className="font-medium text-blue-800 mb-1">Outras Alturas</div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Restante da categoria:</span> Isotônicos, Energéticos, Chás
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Exemplo: Seção de Limpeza</h3>
                        <div className="space-y-3">
                          <div className="bg-green-50 border border-green-100 rounded p-3">
                            <div className="font-medium text-green-800 mb-1">Altura dos Olhos</div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Produtos mais vendidos:</span> Detergentes, Desinfetantes, Sabão em Pó
                            </p>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-100 rounded p-3">
                            <div className="font-medium text-blue-800 mb-1">Outras Alturas</div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Restante da categoria:</span> Limpa-vidros, Lustra-móveis, Amaciantes
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 font-medium">Vantagens da Abordagem Mista</div>
                    <div className="p-4">
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <ThumbsUp size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Mantém a experiência de compra intuitiva</span>
                        </li>
                        <li className="flex items-center">
                          <ThumbsUp size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Destaca produtos de maior venda e margem</span>
                        </li>
                        <li className="flex items-center">
                          <ThumbsUp size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Facilita compras planejadas e por impulso</span>
                        </li>
                        <li className="flex items-center">
                          <ThumbsUp size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Adaptável a diferentes estratégias por seção</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 font-medium">Implementação Sugerida</div>
                    <div className="p-4">
                      <div className="space-y-4">
                        <div className="text-sm">
                          <div className="font-medium mb-1">Fase 1: Reorganização por Categorias</div>
                          <p className="text-gray-600">
                            Agrupar produtos em categorias lógicas e revisar disposição dos corredores
                          </p>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium mb-1">Fase 2: Priorização Visual</div>
                          <p className="text-gray-600">
                            Posicionar produtos mais vendidos em cada categoria na altura dos olhos
                          </p>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium mb-1">Fase 3: Análise e Ajustes</div>
                          <p className="text-gray-600">
                            Monitorar vendas e comportamento de clientes, ajustando conforme necessário
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShelfOptimizer;
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, UploadCloud, AlertTriangle, CheckCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';
import { useProducts } from '../../contexts/ProductContext';
import { Product, PRODUCT_CATEGORIES } from '../../types/Product';

interface ParsedProduct {
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  minStockLevel?: number;
  description?: string;
  imageUrl?: string;
  supplier?: string;
  location?: string;
  tags?: string[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const FileUpload: React.FC = () => {
  const navigate = useNavigate();
  const { importProducts } = useProducts();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'xlsx' | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadStats, setUploadStats] = useState({
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
  });
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setValidationErrors([]);
    setParsedData([]);
    setIsUploaded(false);
    
    // Determine file type
    if (selectedFile.name.endsWith('.csv')) {
      setFileType('csv');
    } else if (selectedFile.name.endsWith('.xlsx')) {
      setFileType('xlsx');
    } else {
      alert('Formato de arquivo não suportado. Use CSV ou XLSX.');
      setFile(null);
      setFileType(null);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });
  
  const validateProducts = (data: any[]): { valid: ParsedProduct[], errors: ValidationError[] } => {
    const validProducts: ParsedProduct[] = [];
    const errors: ValidationError[] = [];
    
    data.forEach((row, index) => {
      // Skip header row if it exists
      if (index === 0 && (row.name === 'Nome' || row.name === 'name')) {
        return;
      }
      
      const rowNumber = index + 1;
      let isValid = true;
      
      // Required fields validation
      if (!row.name) {
        errors.push({ row: rowNumber, field: 'name', message: 'Nome do produto é obrigatório' });
        isValid = false;
      }
      
      if (!row.sku) {
        errors.push({ row: rowNumber, field: 'sku', message: 'SKU é obrigatório' });
        isValid = false;
      }
      
      if (!row.category) {
        errors.push({ row: rowNumber, field: 'category', message: 'Categoria é obrigatória' });
        isValid = false;
      } else if (!PRODUCT_CATEGORIES.includes(row.category)) {
        errors.push({ row: rowNumber, field: 'category', message: `Categoria "${row.category}" inválida` });
        isValid = false;
      }
      
      if (row.price === undefined || isNaN(Number(row.price)) || Number(row.price) <= 0) {
        errors.push({ row: rowNumber, field: 'price', message: 'Preço deve ser um número positivo' });
        isValid = false;
      }
      
      if (row.stockQuantity === undefined || isNaN(Number(row.stockQuantity)) || Number(row.stockQuantity) < 0) {
        errors.push({ row: rowNumber, field: 'stockQuantity', message: 'Quantidade de estoque deve ser um número não negativo' });
        isValid = false;
      }
      
      // Optional fields validation
      if (row.costPrice !== undefined && (isNaN(Number(row.costPrice)) || Number(row.costPrice) < 0)) {
        errors.push({ row: rowNumber, field: 'costPrice', message: 'Preço de custo deve ser um número não negativo' });
        isValid = false;
      }
      
      if (row.minStockLevel !== undefined && (isNaN(Number(row.minStockLevel)) || Number(row.minStockLevel) < 0)) {
        errors.push({ row: rowNumber, field: 'minStockLevel', message: 'Estoque mínimo deve ser um número não negativo' });
        isValid = false;
      }
      
      if (isValid) {
        const processedRow: ParsedProduct = {
          name: row.name,
          sku: row.sku,
          barcode: row.barcode,
          category: row.category,
          price: Number(row.price),
          costPrice: row.costPrice ? Number(row.costPrice) : undefined,
          stockQuantity: Number(row.stockQuantity),
          minStockLevel: row.minStockLevel ? Number(row.minStockLevel) : undefined,
          description: row.description,
          imageUrl: row.imageUrl,
          supplier: row.supplier,
          location: row.location,
          tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : undefined,
        };
        
        validProducts.push(processedRow);
      }
    });
    
    return { valid: validProducts, errors };
  };
  
  const processCSV = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const validation = validateProducts(result.data as any[]);
        setParsedData(validation.valid);
        setValidationErrors(validation.errors);
        
        setUploadStats({
          totalRows: result.data.length,
          validRows: validation.valid.length,
          invalidRows: validation.errors.length,
        });
        
        setIsProcessing(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setIsProcessing(false);
      },
    });
  };
  
  const processXLSX = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    
    try {
      const rows = await readXlsxFile(file);
      
      // Convert rows to objects with headers as keys
      const headers = rows[0] as string[];
      const data = rows.slice(1).map((row) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.toLowerCase()] = row[index];
        });
        return obj;
      });
      
      const validation = validateProducts(data);
      setParsedData(validation.valid);
      setValidationErrors(validation.errors);
      
      setUploadStats({
        totalRows: data.length,
        validRows: validation.valid.length,
        invalidRows: validation.errors.length,
      });
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error reading XLSX file:', error);
      setIsProcessing(false);
    }
  };
  
  const processFile = () => {
    if (fileType === 'csv') {
      processCSV();
    } else if (fileType === 'xlsx') {
      processXLSX();
    }
  };
  
  const handleImport = () => {
    if (parsedData.length === 0) return;
    
    // Transform parsed data to match Product interface
    const productsToImport = parsedData.map(product => ({
      ...product,
      isActive: true,
      salesCount: 0,
      lastSold: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    importProducts(productsToImport);
    setIsUploaded(true);
  };
  
  const resetUpload = () => {
    setFile(null);
    setFileType(null);
    setParsedData([]);
    setValidationErrors([]);
    setIsUploaded(false);
    setUploadStats({
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    });
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Importar Produtos</h1>
        <button
          onClick={() => navigate('/products')}
          className="btn btn-ghost border border-gray-300"
        >
          Ver Produtos
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="max-w-3xl mx-auto">
          {!file ? (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed ${
                isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
              } rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
            >
              <input {...getInputProps()} />
              <UploadCloud 
                size={48} 
                className={`mx-auto text-${isDragActive ? 'primary' : 'gray'}-400 mb-4`} 
              />
              <p className="text-lg font-medium text-gray-700 mb-1">
                {isDragActive 
                  ? 'Solte o arquivo aqui...' 
                  : 'Arraste e solte um arquivo CSV ou XLSX aqui'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500">
                Formatos aceitos: CSV, XLSX
              </p>
            </div>
          ) : isUploaded ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Upload finalizado com sucesso!</h3>
              <p className="mt-2 text-sm text-gray-500">
                {uploadStats.validRows} produtos foram importados com sucesso.
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={resetUpload}
                  className="btn btn-ghost border border-gray-300"
                >
                  Importar novos produtos
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className="btn btn-primary"
                >
                  Ver produtos importados
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File info */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded shadow mr-4">
                  <FileText size={24} className="text-primary-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB • {fileType?.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={resetUpload}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Process button */}
              {!parsedData.length && !isProcessing && (
                <div className="text-center">
                  <button
                    onClick={processFile}
                    className="btn btn-primary flex items-center mx-auto"
                  >
                    <Upload size={18} className="mr-2" />
                    Processar Arquivo
                  </button>
                </div>
              )}
              
              {/* Loading state */}
              {isProcessing && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Processando arquivo...</p>
                </div>
              )}
              
              {/* Results */}
              {parsedData.length > 0 && !isProcessing && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-500 mb-1">Total de Linhas</p>
                      <p className="text-xl font-bold text-gray-900">{uploadStats.totalRows}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-green-600 mb-1">Produtos Válidos</p>
                      <p className="text-xl font-bold text-green-700">{uploadStats.validRows}</p>
                    </div>
                    <div className={`${validationErrors.length > 0 ? 'bg-red-50' : 'bg-gray-50'} p-4 rounded-lg text-center`}>
                      <p className={`text-sm ${validationErrors.length > 0 ? 'text-red-600' : 'text-gray-500'} mb-1`}>
                        Erros
                      </p>
                      <p className={`text-xl font-bold ${validationErrors.length > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                        {validationErrors.length}
                      </p>
                    </div>
                  </div>
                  
                  {validationErrors.length > 0 && (
                    <div className="border border-red-200 rounded-md bg-red-50">
                      <div className="p-4 border-b border-red-200">
                        <div className="flex items-center">
                          <AlertTriangle size={20} className="text-red-500 mr-2" />
                          <h3 className="text-sm font-medium text-red-800">
                            Foram encontrados {validationErrors.length} erros
                          </h3>
                        </div>
                      </div>
                      <div className="p-4 max-h-60 overflow-y-auto">
                        <ul className="space-y-2">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700 flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <span>
                                Linha {error.row}: {error.message} (campo: {error.field})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {parsedData.length > 0 && (
                    <div className="border rounded-md">
                      <div className="p-4 bg-gray-50 border-b">
                        <h3 className="font-medium">
                          Prévia dos dados ({Math.min(5, parsedData.length)} de {parsedData.length})
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nome
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                SKU
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Categoria
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Preço
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estoque
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {parsedData.slice(0, 5).map((product, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {product.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {product.sku}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {product.category}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  R$ {product.price?.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {product.stockQuantity}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={resetUpload}
                      className="btn btn-ghost border border-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleImport}
                      className="btn btn-primary"
                      disabled={parsedData.length === 0}
                    >
                      Importar {parsedData.length} Produtos
                    </button>
                  </div>
                </div>
              )}
              
              {/* Template download */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Precisa de um modelo?
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Baixe nosso modelo de planilha para preenchimento dos dados dos produtos.
                </p>
                <div className="flex gap-2">
                  <a
                    href="#download-csv-template"
                    className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
                  >
                    <FileText size={16} className="mr-1" />
                    Modelo CSV
                  </a>
                  <a
                    href="#download-xlsx-template"
                    className="text-sm text-primary-600 hover:text-primary-500 flex items-center ml-4"
                  >
                    <FileText size={16} className="mr-1" />
                    Modelo Excel
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Como importar produtos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold">1</span>
            </div>
            <h3 className="font-medium">Preparar o arquivo</h3>
            <p className="text-sm text-gray-500">
              Prepare um arquivo CSV ou XLSX com as colunas corretas. Baixe nosso modelo para facilitar.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold">2</span>
            </div>
            <h3 className="font-medium">Fazer upload</h3>
            <p className="text-sm text-gray-500">
              Arraste e solte seu arquivo na área de upload ou clique para selecionar.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold">3</span>
            </div>
            <h3 className="font-medium">Revisar e importar</h3>
            <p className="text-sm text-gray-500">
              Verifique se os dados estão corretos e clique em "Importar" para adicionar os produtos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
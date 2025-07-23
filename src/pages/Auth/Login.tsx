import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingBasket, Mail, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const { login, resetPassword, resendConfirmation, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if user was redirected after email confirmation
    if (searchParams.get('confirmed') === 'true') {
      toast.success('Email confirmado com sucesso! Agora você pode fazer login.');
    }
    
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate('/');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, insira seu email');
      return;
    }
    
    setIsLoading(true);
    const success = await resetPassword(email);
    setIsLoading(false);
    
    if (success) {
      setShowResetPassword(false);
    }
  };

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, insira seu email');
      return;
    }
    
    setIsLoading(true);
    const success = await resendConfirmation(email);
    setIsLoading(false);
    
    if (success) {
      setShowResendConfirmation(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md animate-fade-in">
        <div>
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
              <ShoppingBasket size={40} className="text-primary-500" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Minimercado Seletto
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showResetPassword 
              ? 'Insira seu email para recuperar sua senha'
              : showResendConfirmation
              ? 'Reenviar email de confirmação'
              : 'Faça login para acessar o sistema de gerenciamento'}
          </p>
        </div>
        
        {showResetPassword ? (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <Mail size={20} className="text-blue-500 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Recuperação de Senha</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Enviaremos um link para redefinir sua senha no email informado.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? 'Enviando...' : 'Enviar email de recuperação'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowResetPassword(false)}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Voltar para o login
              </button>
            </div>
          </form>
        ) : showResendConfirmation ? (
          <form className="mt-8 space-y-6" onSubmit={handleResendConfirmation}>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle size={20} className="text-orange-500 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-orange-800">Email não confirmado</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Reenviaremos o email de confirmação para o endereço informado.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isLoading ? 'Enviando...' : 'Reenviar confirmação'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowResendConfirmation(false)}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Voltar para o login
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  E-mail
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Esqueceu sua senha?
                </button>
              </div>
              </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <div className="h-5 w-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                  </span>
                ) : (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg
                      className="h-5 w-5 text-primary-500 group-hover:text-primary-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="pt-2 space-y-2">
                <p className="text-sm text-gray-600">
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Cadastre-se
                  </button>
                </p>
                <p className="text-sm text-gray-600">
                  Não recebeu o email de confirmação?{' '}
                  <button
                    type="button"
                    onClick={() => setShowResendConfirmation(true)}
                    className="font-medium text-orange-600 hover:text-orange-500"
                  >
                    Reenviar
                  </button>
                </p>
              </div>
              </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
# Minimercado Seletto - Sistema de Gestão

Sistema completo de gestão para minimercados desenvolvido com React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funcionalidades

### 📦 Gestão de Produtos
- Cadastro completo de produtos com categorias
- Controle de estoque com alertas de estoque baixo
- Importação em massa via CSV/Excel
- Histórico de preços e movimentações
- Sistema de tags e localização nas prateleiras

### 👥 Gestão de Fornecedores
- Cadastro de fornecedores com avaliação de performance
- Controle de condições de pagamento
- Histórico de compras e relacionamento

### 💰 Gestão Financeira
- Controle de faturas e pagamentos
- Gestão de despesas por categoria
- Relatórios financeiros
- Múltiplas formas de pagamento

### 📊 Dashboard e Relatórios
- Dashboard com métricas em tempo real
- Gráficos de vendas e performance
- Produtos mais vendidos
- Análise por categorias

### 🤖 IA para Otimização
- Otimizador de prateleiras com IA
- Sugestões de posicionamento de produtos
- Análise de padrões de vendas

### 📱 Interface Moderna
- Design responsivo para desktop e mobile
- Tema claro/escuro
- Componentes reutilizáveis
- Experiência de usuário otimizada

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Gráficos**: Chart.js, React-Chartjs-2
- **Roteamento**: React Router DOM
- **Estado**: Context API + Zustand
- **Formulários**: React Hook Form
- **Notificações**: React Hot Toast
- **Ícones**: Lucide React

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/minimercado-selleto.git
cd minimercado-selleto
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

#### 3.1 Crie um projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Anote a URL do projeto e a chave anônima

#### 3.2 Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

#### 3.3 Execute as migrações do banco de dados
No painel do Supabase, vá para SQL Editor e execute os arquivos de migração na ordem:

1. `supabase/migrations/20250512005747_jolly_king.sql`
2. `supabase/migrations/20250512010422_green_hall.sql`
3. `supabase/migrations/20250518232946_silent_wood.sql`
4. `supabase/migrations/20250604100922_sparkling_ember.sql`
5. `supabase/migrations/20250610191807_long_lagoon.sql`
6. `supabase/migrations/20250115120000_comprehensive_schema.sql`

### 4. Configure a autenticação no Supabase

#### 4.1 Configurações de Auth
No painel do Supabase, vá para Authentication > Settings:

- **Site URL**: `http://localhost:5173` (desenvolvimento)
- **Redirect URLs**: `http://localhost:5173/**`
- **Enable email confirmations**: Ativado (recomendado)
- **Enable email change confirmations**: Ativado
- **Enable phone confirmations**: Desativado

#### 4.2 Configure o provedor de email (opcional)
Para produção, configure um provedor SMTP em Authentication > Settings > SMTP Settings

### 5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5173`

## 👤 Primeiro Acesso

### Conta Demo
Para testar rapidamente o sistema, use a conta demo:
- **Email**: demo@selleto.com
- **Senha**: Demo@123456

### Criar Nova Conta
1. Acesse `/register`
2. Preencha os dados do usuário
3. Confirme o email (se habilitado)
4. Faça login em `/login`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Auth/           # Componentes de autenticação
│   └── Layout/         # Layout e navegação
├── contexts/           # Context API para estado global
├── hooks/              # Custom hooks
├── lib/                # Configurações e utilitários
├── pages/              # Páginas da aplicação
│   ├── Auth/           # Login, registro, reset
│   ├── Dashboard/      # Dashboard principal
│   ├── Products/       # Gestão de produtos
│   ├── Suppliers/      # Gestão de fornecedores
│   ├── FileUpload/     # Importação de dados
│   └── ShelfOptimizer/ # IA para prateleiras
├── types/              # Definições TypeScript
└── utils/              # Funções utilitárias
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint
```

## 🚀 Deploy

### Netlify (Recomendado)
1. Faça build do projeto: `npm run build`
2. Conecte seu repositório ao Netlify
3. Configure as variáveis de ambiente
4. Deploy automático a cada push

### Vercel
1. Instale a CLI: `npm i -g vercel`
2. Execute: `vercel`
3. Configure as variáveis de ambiente
4. Deploy automático

### Configurações de Produção
Lembre-se de atualizar:
- URLs de redirect no Supabase
- Variáveis de ambiente de produção
- Configurações de CORS se necessário

## 📊 Funcionalidades Detalhadas

### Gestão de Produtos
- ✅ CRUD completo de produtos
- ✅ Categorização hierárquica
- ✅ Controle de estoque com alertas
- ✅ Importação via CSV/Excel
- ✅ Histórico de movimentações
- ✅ Sistema de tags
- ✅ Localização nas prateleiras

### Gestão de Fornecedores
- ✅ Cadastro completo de fornecedores
- ✅ Avaliação de performance
- ✅ Condições de pagamento
- ✅ Histórico de relacionamento

### Sistema Financeiro
- ✅ Controle de faturas
- ✅ Gestão de pagamentos
- ✅ Controle de despesas
- ✅ Relatórios financeiros

### Dashboard e Analytics
- ✅ Métricas em tempo real
- ✅ Gráficos interativos
- ✅ Análise de vendas
- ✅ Produtos mais vendidos

### IA e Otimização
- ✅ Otimizador de prateleiras
- ✅ Análise de padrões
- ✅ Sugestões inteligentes

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Vinícius Custódio Chelli**
- GitHub: [@viniciuschelli](https://github.com/viniciuschelli)
- Email: contato@selleto.com

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a documentação
2. Procure em issues existentes
3. Crie uma nova issue com detalhes do problema
4. Entre em contato via email

---

⭐ Se este projeto te ajudou, considere dar uma estrela no GitHub!
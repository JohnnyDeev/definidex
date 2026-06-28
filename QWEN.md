# DefiniDEX - Contexto do Projeto

## Visão Geral do Projeto

**DefiniDEX** é uma aplicação web moderna que funciona como uma enciclopédia interativa de Pokémon. O projeto oferece uma interface visualmente atraente para explorar todos os 1025 Pokémon, com recursos adicionais para jogadores competitivos.

### Principais Funcionalidades

- **Pokédex Completa**: Navegação por todos os 1025 Pokémon com filtros por tipo e geração
- **Team Builder**: Ferramenta para construção de times competitivos
- **TCG Deck Builder**: Construtor de baralhos para o Pokémon TCG
- **Battle View**: Interface para simulação de batalhas
- **Calculadora de Dano**: Integrada com @smogon/calc para cálculos competitivos
- **Itens e Berries**: Catálogo completo de itens e frutas do universo Pokémon
- **Sistema de Autenticação**: Login via Google e email/senha com Firebase
- **Perfil de Usuário**: Sistema de ranks e contagem de contribuições
- **Notícias**: Feed de notícias relacionadas a Pokémon
- **Multi-idioma**: Suporte para Inglês, Português (BR) e Espanhol

### Tecnologias Principais

| Categoria | Tecnologias |
|-----------|-------------|
| **Frontend** | React 19, TypeScript, Vite |
| **Estilização** | TailwindCSS 4, Motion (Framer Motion) |
| **Ícones** | Lucide React |
| **Backend/BaaS** | Firebase (Auth, Firestore, Hosting) |
| **APIs Externas** | PokéAPI, Smogon Damage Calculator |
| **Build/Dev** | Vite, TypeScript, tsx |

## Estrutura do Projeto

```
definidex/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── contexts/       # Contextos React (Auth, Language)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilitários e configurações de bibliotecas
│   ├── pages/          # Componentes de página
│   ├── utils/          # Funções utilitárias
│   ├── data/           # Dados estáticos
│   ├── App.tsx         # Componente principal
│   ├── main.tsx        # Ponto de entrada
│   └── types.ts        # Definições de tipos TypeScript
├── scripts/            # Scripts utilitários (fetch de dados, traduções)
├── public/             # Assets estáticos
├── dist/               # Build de produção
└── firebase.json       # Configuração do Firebase
```

## Comandos de Build e Execução

### Desenvolvimento

```bash
npm run dev          # Inicia servidor de desenvolvimento (porta 3001)
```

### Build

```bash
npm run build        # Compila para produção na pasta dist/
npm run preview      # Preview da build de produção
```

### Utilitários

```bash
npm run lint         # Verificação de tipos TypeScript
npm run clean        # Remove pasta dist/
npm run update-vgc   # Atualiza dados VGC
npm run update-vgc-teams  # Fetch de times VGC
npm run fetch-news   # Busca notícias
npm run update-tcg-prices # Atualiza preços TCG
```

## Configuração de Ambiente

O projeto utiliza variáveis de ambiente configuradas em `.env`. Veja `.env.example`:

```env
APP_URL="http://localhost:3001"
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

## Arquitetura

### Contextos Globais

- **`LanguageContext`**: Gerencia multi-idioma (en, pt-BR, es) com persistência em localStorage
- **`AuthContext`**: Gerencia autenticação Firebase e perfis de usuário no Firestore

### Hooks Principais

- **`usePokemonList`**: Fetch e cache da lista de Pokémon da PokéAPI
- **`useLanguage`**: Acesso ao contexto de idioma
- **`useAuth`**: Acesso ao contexto de autenticação

### Sistema de Tipos

O projeto define tipos TypeScript para:
- `BasicPokemon` / `DetailedPokemon`: Dados de Pokémon
- `UserProfile`: Perfil de usuário com sistema de ranks
- `EvolutionNode`: Cadeias evolutivas
- `TrainerRank`: Sistema de progressão (Pokéball → Master Ball)

## Banco de Dados (Firestore)

### Coleções

| Coleção | Descrição |
|---------|-----------|
| `users` | Perfis de usuário (contribuições, rank) |
| `teams` | Times salvos pelos usuários (públicos/privados) |
| `decks` | Baralhos TCG salvos |
| `comments` | Comentários em times/decks |
| `likes` | Subcoleção para likes em times/decks |

### Regras de Segurança

- Perfis são legíveis por usuários autenticados
- Times/decks públicos são legíveis por todos
- Apenas o dono pode editar/excluir seu conteúdo
- Sistema de likes permite apenas criação/exclusão pelo próprio usuário

## Convenções de Desenvolvimento

### Código

- **TypeScript**: Tipagem estática obrigatória
- **React Hooks**: Preferência por functional components e hooks
- **TailwindCSS**: Estilização utilitária com classes do Tailwind
- **Path Aliases**: Uso de `@/` como alias para a raiz do projeto

### Estrutura de Componentes

```tsx
// Padrão de componente
export function NomeComponente({ prop1, prop2 }: Props) {
  // Hooks primeiro
  // Lógica em seguida
  // JSX no final
}
```

### Tradução

As traduções são centralizadas em `translations.ts` e acessadas via hook `useLanguage`:
```tsx
const { t } = useLanguage();
<h1>{t.bemVindo}</h1>
```

## Scripts Utilitários

A pasta `scripts/` contém utilitários para:

- **`fetch-news.ts`**: Busca notícias de APIs externas
- **`fetch-tcg-prices.ts`**: Atualiza preços de cartas TCG
- **`fetch-vgc.ts`**: Dados de competição VGC
- **`generateTranslations.cjs`**: Geração de arquivos de tradução
- **`merge_items.ts`**: Processamento de dados de itens

## Deploy

O projeto está configurado para deploy via **Firebase Hosting**:

```bash
npm run build
firebase deploy
```

## Considerações Especiais

- **HMR**: O Hot Module Replacement pode ser desativado via `DISABLE_HMR=true`
- **PokeAPI**: Fonte primária de dados de Pokémon (todos os 1025)
- **Google Analytics**: Rastreamento configurado via `VITE_GA_MEASUREMENT_ID`

## Links Úteis

- [PokéAPI](https://pokeapi.co/) - API de dados Pokémon
- [Smogon Calculator](https://github.com/smogon/calc) - Calculadora de dano
- [Firebase Console](https://console.firebase.google.com/) - Gerenciamento do backend

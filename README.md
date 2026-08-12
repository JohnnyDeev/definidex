# DefiniDEX ⚡

Salve! Essa aqui é a **DefiniDEX**, uma Pokédex braba que eu fiz pra juntar todos os 1025 Pokémon em um lugar só, e de quebra ainda testar umas paradas com React, Tailwind e Firebase.

A ideia inicial era só listar os bichos, mas acabei me empolgando e coloquei um monte de funcionalidade extra, principalmente pra quem curte jogar competitivo (VGC) ou TCG.

## O que tem aqui?

*   **Pokédex Completa:** Tem todo mundo aqui. Dá pra filtrar por tipo, geração, etc.
*   **Team Builder:** Pra você montar aquele time roubado pro competitivo.
*   **TCG Deck Builder:** Pra galera das cartinhas montar baralho também.
*   **Calculadora de Dano:** Puxei o `@smogon/calc` pra ajudar a fazer as contas de dano no competitivo.
*   **Login & Perfis:** Tem login pelo Google (valeu, Firebase) e um sisteminha de ranks dependendo de quanto você contribui.
*   **Multilíngue:** Português, Inglês e Espanhol (porque sim).

## Stack (O que eu usei pra fazer)

Basicamente o feijão com arroz moderno:
*   **Front:** React 19 + TypeScript rodando liso no Vite.
*   **Estilo:** TailwindCSS 4 (pra estilizar rápido) e Framer Motion praquelas animações suaves.
*   **Backend/Banco:** Firebase cuidando de tudo (Auth pro login, Firestore pro banco e Hosting pra hospedar).
*   **APIs:** PokéAPI (obviamente) e a API da Smogon pro damage calc.

## Como rodar essa bagunça na sua máquina

Primeiro, você vai precisar do arquivo `.env` (tem um `.env.example` aí de base). Preenche com as suas chaves do Firebase.

Depois, é só dar os comandos de sempre:

```bash
npm install
npm run dev   # roda local na porta 3001
```

Se quiser rodar um build de produção pra testar:
```bash
npm run build
npm run preview
```

## Umas anotações soltas (Scripts)

Deixei uns scripts na pasta `scripts/` pra facilitar minha vida quando preciso atualizar dados:
*   `npm run update-vgc`: Puxa dados do VGC.
*   `npm run fetch-news`: Puxa as notícias.
*   `npm run update-tcg-prices`: Puxa os preços do TCG atualizados pra galera não ser passada pra trás.

## Segurança e Firebase

Toda a parte de segurança dos dados tá configurada no `firestore.rules`.
Basicamente: 
- Ninguém mexe no perfil de ninguém.
- Se o time é público, qualquer um lê. Se é privado, só o dono vê.
- O sistema de likes foi blindado pra evitar maluco botando 1 milhão de likes de uma vez (sim, eu protegi isso).

---
Feito com ☕ e muito tryhard no Pokémon.

# XDENKER CELL

E-commerce completo de tecnologia (celulares, computadores, acessórios e PCs gamer).

## Stack

- **Frontend:** Next.js 15 + Tailwind CSS 4 + Framer Motion
- **Backend / Auth / DB:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Pagamentos:** Mercado Pago (PIX, Cartão, Boleto)
- **E-mails:** Resend
- **Hospedagem:** Vercel + Supabase
- **Estado do carrinho:** Zustand

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha as chaves do Supabase

# 3. Rodar em desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## Estrutura de pastas

```
public/                   # Imagens e arquivos estáticos
├── backgrounds/          # Fundos das páginas (home, store, etc.)
├── products/             # Fotos dos produtos
├── logo/                 # Logo da loja
└── icons/                # Ícones extras

src/
├── app/                  # App Router (páginas)
│   ├── page.tsx          # Home
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/           # Header, BottomNav, etc.
│   └── ui/               # Componentes reutilizáveis
├── lib/
│   └── supabase.ts       # Cliente Supabase + tipos
└── types/
```

### Como usar as imagens

Coloque os arquivos nas pastas acima e use assim:

```tsx
// Fundo
style={{ backgroundImage: "url('/backgrounds/home-desktop.jpg')" }}

// Produto (com Next Image)
import Image from "next/image";
<Image src="/products/iphone-15-pro.png" alt="iPhone" width={400} height={400} />
```

## Próximos passos (já previstos)

- [ ] Páginas de listagem (Celulares / Computadores)
- [ ] Página de produto (cores, armazenamento, specs)
- [ ] Carrinho + Checkout (CEP + pagamento)
- [ ] Login / Cadastro (Supabase Auth)
- [ ] Central de Suporte + Chat em tempo real
- [ ] Painel Admin completo
- [ ] Integração Mercado Pago
- [ ] Upload de imagens (Supabase Storage)

## Domínio

Já possui domínio próprio configurado.

---

Desenvolvido para XDENKER CELL.

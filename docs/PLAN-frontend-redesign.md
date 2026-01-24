# PLAN: Frontend Redesign - Optus Admin

> **Ponto de Restauração:** `restore-point-before-redesign`
> Para restaurar: `git checkout restore-point-before-redesign`

---

## Análise do Estado Atual

### Pontos Fortes ✅
- Sidebar bem estruturada com seções lógicas
- Uso consistente do Material Icons
- Layout responsivo com Tailwind CSS
- Hierarquia de navegação clara

### Pontos a Melhorar 🔧

| Problema | Impacto UX | Solução |
|----------|-----------|---------|
| Cores genéricas (slate/brand) | Visual básico/template | Paleta única com identidade |
| Falta de hierarquia visual | Tudo parece igual | Cards com elevação, sombras |
| Sem microinterações | Experiência estática | Hover states, transições |
| Dashboard sem "wow factor" | Primeira impressão fraca | Hero cards, gradientes sutis |
| Tipografia monótona | Leitura cansativa | Escala tipográfica dramática |

---

## Perguntas para o Usuário

> ⚠️ **ANTES de implementar, preciso de suas preferências:**

1. **Paleta de cores:**
   - A) 🟢 Verde/Teal (tecnologia, confiança)
   - B) 🔵 Azul profundo (corporativo, sério)
   - C) 🟠 Laranja/Coral (energia, ação)
   - D) ⚫ Dark mode prioritário

2. **Estilo visual:**
   - A) Minimalista (muito espaço branco)
   - B) Glassmorphism sutil (moderno, transparências)
   - C) Flat/Solid (cores sólidas, alto contraste)
   - D) Neumorphism (soft shadows, 3D sutil)

3. **Público-alvo principal:**
   - A) Empresários (35-55 anos) → mais conservador
   - B) Profissionais tech (25-40) → pode ser mais ousado
   - C) Misto → equilibrado

---

## Proposta de Alterações

### Fase 1: Sistema de Design Base

#### [MODIFY] `index.css`
- Definir variáveis CSS customizadas (cores, sombras, espaçamentos)
- Criar classes utilitárias para gradientes e efeitos
- Adicionar animações de entrada/saída

#### [MODIFY] `tailwind.config.js`
- Configurar paleta de cores personalizada
- Definir escala tipográfica (1.25 ratio)
- Adicionar sombras customizadas

### Fase 2: Componentes Core

#### [MODIFY] `components/Layout.tsx`
- Sidebar com hover states animados
- Indicador de item ativo mais proeminente
- Logo com tratamento visual

#### [MODIFY] `components/DesktopDashboard.tsx`
- Cards de estatísticas com gradientes
- Animações de entrada staggered
- Ícones com backgrounds coloridos

### Fase 3: Páginas Principais

- Melhorar tabelas com hover states
- Botões com hierarquia visual clara
- Formulários com feedback visual

---

## Regras de Design (frontend-design skill)

### ❌ Evitar (Anti-patterns)
- Purple/Violet (BANNED)
- Bento grids genéricos
- Mesh/Aurora gradients
- Dark + neon como default
- Glassmorphism exagerado

### ✅ Aplicar
- 60-30-10 rule (cores)
- Hick's Law (max 7 itens)
- Fitts' Law (CTAs grandes)
- Von Restorff (destaque visual)

---

## Próximos Passos

1. ⏳ **Aguardar resposta do usuário** sobre preferências
2. Criar design tokens baseado na escolha
3. Implementar componentes atualizados
4. Verificar em produção

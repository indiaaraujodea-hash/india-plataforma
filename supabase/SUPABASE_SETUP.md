# Configurar o Supabase para a Clínica de Valor

## 1. Criar o projeto e aplicar o schema

1. Crie um projeto em https://supabase.com (Postgres + Auth já vêm inclusos).
2. No SQL Editor do projeto, rode, nesta ordem:
   1. `schema.sql`
   2. `seed_diagnostic_fields.sql`
   3. `seed_pontos_latentes.sql`
   4. `seed_manual.sql`
   5. `seed_pesos.sql`
3. Em **Authentication → Providers**, confirme que **Email** está ativo (login usado no MVP).
4. Em **Authentication → URL Configuration**, se for publicar em domínio próprio, ajuste a Site URL.

Todos os scripts são idempotentes (podem ser rodados de novo sem duplicar dados).

## 2. Promover a proprietária a admin

Depois que ela criar a própria conta pelo `/login`, rode no SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'email-da-proprietaria@exemplo.com';
```

Não existe fluxo de autopromoção no app — isso é intencional (ver RLS de `profiles`).

## 3. Configurar o front-end estático

Edite `docs/assets/js/supabase-config.js` e preencha:

```js
export const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
export const SUPABASE_ANON_KEY = "sua-anon-key-publica";
```

Esses dois valores estão em **Project Settings → API** no painel do Supabase. A `anon key` é pública por design — a proteção real está nas policies de RLS do `schema.sql`.

## 4. Publicar

O site continua sendo publicado como estático (Netlify, `docs/` — ver `netlify.toml`). Nenhuma etapa de build foi adicionada: os módulos JS são carregados via `<script type="module">` com import direto do CDN do `@supabase/supabase-js`.

## 5. O que ainda depende de decisão sua (não foi inventado)

- `pesos_ponto_latente`: só 4 dos 6 Pontos Latentes têm regra hoje (captar/precificar/posicionar/produto_mix), com status `rascunho_referencia_historica`. `esteira` e `escalar` não têm nenhuma regra — o motor sempre retorna "sem dados" para eles até você definir de onde tirar essas variáveis.
- `ponto_latente_capitulo_map`: todas as linhas estão com `capitulo_numero = null` — o mapa final Ponto Latente → Capítulo do Manual ainda não foi aprovado.
- `ponto_latente_ferramenta_map`: só Precificar→Calculadora de Sessão e Produto/Mix→Calculadora de Grupo estão preenchidos (citados explicitamente no doc de textos); os demais estão `pendente_validacao`.
- `momento_clinica` de cada diagnóstico: sempre nasce `null`. Só é definido manualmente pelo painel administrativo (`/admin`) até existir uma regra validada.

Quando essas regras forem aprovadas, é só fazer `UPDATE`/`INSERT` nas tabelas de configuração acima — nenhum código precisa mudar.

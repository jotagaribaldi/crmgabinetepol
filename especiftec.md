# ESPECIFICAÇÃO COMPLETA PARA DESENVOLVIMENTO DE CRM POLÍTICO MULTI-TENANT

Você é um arquiteto de software sênior especialista em aplicações SaaS, CRM, sistemas eleitorais, arquitetura escalável, segurança, UX/UI e bancos de dados relacionais.

Sua missão é projetar uma aplicação web completa chamada CRM Político, gerando toda a arquitetura do sistema, modelagem de banco de dados, regras de negócio, APIs, frontend, backend, segurança, diagramas e documentação técnica.

## OBJETIVO DO SISTEMA

O sistema será um CRM Político Multi-Tenant utilizado por candidatos durante campanhas eleitorais para gerenciamento de lideranças, coordenadores, regiões e eleitores.

Cada candidato será um tenant independente dentro da plataforma.

O sistema deve ser preparado para suportar milhares de usuários simultâneos e milhões de registros de eleitores.

---

# TECNOLOGIAS OBRIGATÓRIAS

## Frontend

* React
* Next.js
* TypeScript
* TailwindCSS
* Shadcn/UI
* React Query
* Zustand
* Axios
* React Hook Form
* Zod
* Recharts
* Tanstack Table

## Backend

* Node.js
* TypeScript
* NestJS
* Prisma ORM
* PostgreSQL
* Redis
* JWT
* Refresh Token
* Docker

## Infraestrutura

* Docker
* Docker Compose
* Apache
* PostgreSQL
* Redis

---

# ARQUITETURA

O sistema deve seguir arquitetura:

* SaaS Multi-Tenant
* REST API
* Clean Architecture
* SOLID
* DDD
* Repository Pattern
* Service Layer
* RBAC
* Auditoria completa

---

# ESTRUTURA DE TENANTS

Cada tenant representa um candidato político.

Cada candidato possui:

* usuários
* regiões
* municípios
* coordenadores
* lideranças
* eleitores
* segmentos

Todos os dados devem ser isolados por tenant.

Nenhum usuário pode acessar informações de outro candidato.

---

# PERFIS DE USUÁRIO

## ROOT

Responsabilidades:

* criar candidatos
* criar usuários políticos
* visualizar todos os candidatos
* dashboard global
* relatórios consolidados
* auditoria completa

---

## POLITICO

Responsabilidades:

* visualizar apenas seu tenant
* cadastrar usuários Chefes de Gabinete
* visualizar dashboards próprios
* visualizar estatísticas próprias

---

## CHEFEGAB

Responsabilidades:

* cadastrar regiões
* vincular municípios às regiões
* cadastrar coordenadores
* relacionar coordenadores às regiões

---

## COORDENADOR

Responsabilidades:

* cadastrar líderes regionais
* acompanhar indicadores de sua região

---

## LIDERREG

Responsabilidades:

* cadastrar eleitores
* cadastrar líderes locais
* acompanhar seus eleitores

---

## LIDERLOCAL

Responsabilidades:

* cadastrar eleitores
* acompanhar seus próprios registros

---

# ESTRUTURA TERRITORIAL

Modelar as seguintes entidades:

Estado

Município

Região

Relacionamentos:

Estado
-> possui muitos Municípios

Região
-> pertence a um Estado

Região
-> possui vários Municípios

Região
-> possui um Coordenador

Coordenador
-> pode administrar uma ou várias Regiões

---

# CADASTRO DE ELEITORES

Campos mínimos:

* id
* tenantId
* nome
* telefone
* whatsapp
* email
* cpf
* dataNascimento
* sexo
* endereco
* cep
* estado
* municipio
* observacoes
* segmentoId
* liderRegId
* liderLocalId
* coordenadorId
* statusApoio
* createdAt
* updatedAt

---

# SEGMENTAÇÃO

Criar tabela Segmentos.

Exemplos:

* Juventude
* Evangélicos
* Universitários
* Agricultores
* Pescadores
* Comerciantes
* Empresários
* Servidores Públicos
* Mulheres
* Idosos

Permitir criação de novos segmentos.

---

# REGRAS DE NEGÓCIO

## Duplicidade

Não permitir:

* telefone duplicado dentro do mesmo tenant
* whatsapp duplicado dentro do mesmo tenant
* CPF duplicado dentro do mesmo tenant

Criar índices únicos compostos.

---

## Segurança

Implementar:

* JWT
* Refresh Token
* Hash BCrypt
* MFA opcional
* Rate Limit
* CSRF Protection
* CORS
* Auditoria

---

## Auditoria

Registrar:

* login
* logout
* criação
* edição
* exclusão
* exportação
* importação

Campos:

* usuário
* data
* IP
* ação
* entidade
* valor anterior
* valor novo

---

# DASHBOARDS

## Dashboard Root

Indicadores:

* total de candidatos
* total de usuários
* total de eleitores
* total por estado
* total por município
* ranking de crescimento
* evolução temporal

Filtros:

* candidato
* período
* estado
* município

---

## Dashboard Político

Indicadores:

* total de eleitores
* total por segmento
* total por município
* total por região
* total por coordenador
* total por liderança

Gráficos:

* pizza
* barras
* linha
* mapa de calor

---

# RELATÓRIOS

Criar relatórios:

* Eleitores por município
* Eleitores por região
* Eleitores por segmento
* Eleitores por coordenador
* Eleitores por líder regional
* Eleitores por líder local
* Crescimento mensal
* Conversão por período

Permitir exportação:

* CSV
* XLSX
* PDF

---

# IMPORTAÇÃO

Permitir importação CSV.

Mapeamento de colunas.

Validação:

* telefone
* CPF
* município
* segmento

Gerar relatório de erros.

---

# BUSCAS

Implementar busca avançada:

Filtros:

* nome
* telefone
* CPF
* município
* região
* segmento
* coordenador
* líder regional
* líder local
* data cadastro

Com paginação server-side.

---

# NOTIFICAÇÕES

Implementar:

* Toast notifications
* Alertas
* Confirmações de exclusão
* Feedback visual

---

# FRONTEND

Construir interface moderna semelhante a:

* Hubspot
* Salesforce
* Monday.com
* PipeDrive

Características:

* Dark Mode
* Responsivo
* Mobile First
* Sidebar recolhível
* Breadcrumbs
* Skeleton Loading
* Empty States
* Data Tables Avançadas
* Filtros Persistentes

---

# TELAS NECESSÁRIAS

## Autenticação

* Login
* Recuperação de senha
* Redefinição de senha

## Administração

* Dashboard Root
* Dashboard Político

## Gestão

* Usuários
* Candidatos
* Estados
* Municípios
* Regiões
* Segmentos
* Eleitores

## Relatórios

* Relatórios Analíticos
* Relatórios Gerenciais

## Configurações

* Perfil
* Segurança
* Logs
* Auditoria

---

# BANCO DE DADOS

Gerar:

* DER completo
* Modelo lógico
* Modelo físico
* Scripts SQL PostgreSQL
* Índices
* Constraints
* Foreign Keys



---

# ORM sugerido:

Prisma ou TypeORM

---

# API

Gerar:

* documentação Swagger/OpenAPI
* endpoints REST
* DTOs
* validações
* exemplos de payload

---

# RESULTADO ESPERADO

Forneça:

1. Arquitetura completa do sistema.
2. Modelagem completa do banco PostgreSQL.
3. DER detalhado.
4. Estrutura de pastas frontend.
5. Estrutura de pastas backend.
6. Todas as entidades.
7. Todos os relacionamentos.
8. Casos de uso.
9. Regras de negócio.
10. APIs REST.
11. Estratégia de segurança.
12. Estratégia de escalabilidade.
13. Estratégia de backup.
14. Estratégia de monitoramento.
15. Roadmap de desenvolvimento dividido por sprints.
16. Diagramas UML.
17. Fluxogramas de navegação.
18. Plano de implantação em produção utilizando Docker.


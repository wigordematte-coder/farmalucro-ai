# QA Produção/Sandbox - FarmaLucro AI

Documento executável para validar o ambiente pós-merge antes de vender ou liberar produção.

## Como Usar

Para cada cenário:

1. Preencha a coluna **Status** com `Pendente`, `Passou` ou `Falhou`.
2. Registre prints, IDs de registros, links de logs, payloads ou observações em **Evidência/Observação**.
3. Se falhar, registre o comportamento real, usuário usado, horário e tenant afetado.

## Pré-Requisitos

| Item | Necessário | Status | Evidência/Observação |
| --- | --- | --- | --- |
| Código em `main` após merge `8c6ed01` ou posterior | Sim | Pendente |  |
| Ambiente Base44 publicado em sandbox ou staging | Sim | Pendente |  |
| Acesso `super_admin` | Sim | Pendente |  |
| Dois e-mails de teste para clientes | Sim | Pendente |  |
| Arquivo NF/XML/PDF de teste | Sim | Pendente |  |
| Conta Mercado Pago sandbox vendedor | Sim | Pendente |  |
| Usuário comprador sandbox Mercado Pago | Sim | Pendente |  |
| `MERCADOPAGO_ACCESS_TOKEN` configurado como secret backend/Base44 | Sim | Pendente |  |
| `MERCADOPAGO_WEBHOOK_SECRET` configurado como secret backend/Base44 | Sim | Pendente |  |
| URL pública do webhook Mercado Pago configurada no painel MP | Sim | Pendente |  |
| Regras/permissões Base44 revisáveis no painel | Sim | Pendente |  |

## Dados De Teste

| Dado | Valor Usado | Status | Evidência/Observação |
| --- | --- | --- | --- |
| E-mail Farmácia A |  | Pendente |  |
| E-mail Farmácia B |  | Pendente |  |
| CNPJ Farmácia A |  | Pendente |  |
| CNPJ Farmácia B |  | Pendente |  |
| Tenant ID Farmácia A |  | Pendente |  |
| Tenant ID Farmácia B |  | Pendente |  |
| Usuário `super_admin` |  | Pendente |  |
| NF/XML/PDF usado |  | Pendente |  |
| ID checkout cartão/preapproval |  | Pendente |  |
| ID pagamento PIX |  | Pendente |  |
| ID webhook aprovado |  | Pendente |  |
| ID webhook replay |  | Pendente |  |

## Comandos Técnicos Base

Executar antes do ciclo principal.

| Passo | Comando | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| Confirmar branch | `git checkout main` | Branch `main` ativa | Pendente |  |
| Atualizar main | `git pull origin main` | Sem conflitos | Pendente |  |
| Lint | `npm run lint` | Sem erros bloqueantes | Pendente |  |
| Build | `npm run build` | Build concluído | Pendente |  |

## Checklist Por Cenário

### 1. Cadastro De Nova Farmácia

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Abrir `/register` | Tela de cadastro carrega sem erro | Pendente |  |
| 2 | Cadastrar Farmácia A com e-mail e CNPJ de teste | Cadastro/OTP iniciado | Pendente |  |
| 3 | Confirmar OTP e concluir login | Usuário entra no app | Pendente |  |
| 4 | Verificar usuário no Base44 | `app_role = pharmacy_admin` e `tenant_id` preenchido | Pendente |  |
| 5 | Verificar entidades criadas | `Tenant`, `Subscription` e `PharmacySettings` existem com mesmo `tenant_id` | Pendente |  |

### 2. Trial De 14 Dias

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Logar como Farmácia A | Dashboard acessível | Pendente |  |
| 2 | Abrir `/assinatura` | Assinatura exibida | Pendente |  |
| 3 | Conferir datas da assinatura | `status = trialing`, início hoje, fim hoje + 14 dias | Pendente |  |
| 4 | Abrir `/importacao`, `/consultor-ia`, `/relatorios`, `/precificacao` | Acesso permitido durante trial | Pendente |  |

### 3. Expiração De Trial

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | No Base44/admin, ajustar `trial_end_date` para data passada | Registro salvo | Pendente |  |
| 2 | Recarregar app como Farmácia A | Entitlement recalculado | Pendente |  |
| 3 | Abrir tela crítica | Acesso bloqueado com tela de regularização | Pendente |  |
| 4 | Abrir `/assinatura` | Tela acessível para regularizar | Pendente |  |

### 4. Bloqueio Por Entitlement

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Com assinatura `pending`, abrir `/importacao` | Bloqueado | Pendente |  |
| 2 | Abrir `/consultor-ia` | Bloqueado | Pendente |  |
| 3 | Abrir `/relatorios` | Bloqueado | Pendente |  |
| 4 | Abrir `/precificacao` | Bloqueado | Pendente |  |
| 5 | Abrir `/assinatura`, `/perfil` | Permitido | Pendente |  |

### 5. Importação De NF/Produtos

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Reativar entitlement da Farmácia A se necessário | Acesso liberado | Pendente |  |
| 2 | Abrir `/importacao` | Tela carrega | Pendente |  |
| 3 | Importar NF/XML/PDF de teste | Produtos criados | Pendente |  |
| 4 | Verificar produtos no Base44 | Todos têm `tenant_id` da Farmácia A | Pendente |  |
| 5 | Abrir `/produtos` | Lista mostra apenas produtos da Farmácia A | Pendente |  |

### 6. Dashboard E Consultor Proativo

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Abrir `/dashboard` com produtos importados | Cabeçalho executivo aparece | Pendente |  |
| 2 | Conferir KPIs | Lucro potencial, Farma Score e prioridades usam dados reais | Pendente |  |
| 3 | Conferir cards de oportunidades | Sem dados fake; valores vêm de oportunidades/produtos | Pendente |  |
| 4 | Clicar `Gerar insight do dia` | IA chamada somente após clique | Pendente |  |
| 5 | Recarregar `/dashboard` no mesmo dia | Insight carregado do cache por tenant/dia, sem nova chamada visível | Pendente |  |

### 7. Consultor IA Respeitando tenant_id

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Abrir `/consultor-ia` como Farmácia A | Tela carrega | Pendente |  |
| 2 | Enviar pergunta sugerida | Mensagem salva com `tenant_id` da Farmácia A | Pendente |  |
| 3 | Verificar conversa/mensagens no Base44 | `ChatConversation` e `ChatMessage` têm `tenant_id` correto | Pendente |  |
| 4 | Logar como Farmácia B | Conversas da Farmácia A não aparecem | Pendente |  |
| 5 | Tentar excluir conversa de outro tenant, se possível via UI/API | Operação negada ou sem efeito | Pendente |  |

### 8. Cancelamento E Reativação De Assinatura

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Abrir `/assinatura` como cliente | Tela carrega | Pendente |  |
| 2 | Cancelar assinatura | Backend `subscriptionSelfService` atualiza para `cancelled` | Pendente |  |
| 3 | Confirmar bloqueio | Rotas críticas bloqueadas | Pendente |  |
| 4 | Simular pagamento aprovado via Mercado Pago sandbox | Assinatura volta para `active` via webhook válido | Pendente |  |
| 5 | Confirmar tenant afetado | Apenas tenant correto reativado | Pendente |  |

## Seção Específica: Isolamento Multi-Tenant

Executar com Farmácia A e Farmácia B criadas.

| Cenário | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| Produtos | Importar produtos diferentes em A e B | A vê apenas A; B vê apenas B | Pendente |  |
| Pagamentos | Gerar checkout/pagamento em A | B não vê pagamentos de A | Pendente |  |
| Assinatura | Alterar status de A via webhook válido | B não muda | Pendente |  |
| Configurações | Editar configurações da Farmácia A | B não herda configurações | Pendente |  |
| Conversas IA | Criar conversa em A | B não lista conversa/mensagens de A | Pendente |  |
| Registros legados | Criar/verificar registro sem `tenant_id` em entidade tenant-scoped | Cliente não visualiza legado | Pendente |  |

## Seção Específica: Mercado Pago Sandbox

### Pré-Requisitos Mercado Pago

| Item | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- |
| `MERCADOPAGO_ACCESS_TOKEN` em secret backend | Token não aparece no frontend/admin | Pendente |  |
| `MERCADOPAGO_WEBHOOK_SECRET` em secret backend | Webhook consegue validar assinatura | Pendente |  |
| Webhook cadastrado no painel MP sandbox | Eventos `payment` e `subscription_preapproval` enviados | Pendente |  |
| Usuários sandbox comprador/vendedor | Checkout pode ser concluído | Pendente |  |

### Cartão / Preapproval

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Em `/assinatura`, escolher cartão | Opção de recorrência automática exibida | Pendente |  |
| 2 | Iniciar checkout | Backend cria `preapproval` | Pendente |  |
| 3 | Concluir pagamento/autorização em sandbox | Mercado Pago envia webhook | Pendente |  |
| 4 | Verificar payload MP | Contém `tenant_id`, `subscription_id`, plano, valor 197, moeda BRL | Pendente |  |
| 5 | Verificar app | Assinatura fica `active`; `Payment` pago criado sem duplicidade | Pendente |  |

### PIX

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Em `/assinatura`, escolher PIX | UI informa pagamento único/manual | Pendente |  |
| 2 | Iniciar checkout PIX | Backend cria preferência de pagamento | Pendente |  |
| 3 | Pagar em sandbox | Mercado Pago envia webhook `approved` | Pendente |  |
| 4 | Verificar app | Assinatura liberada para o ciclo; não promete recorrência automática | Pendente |  |

### Webhook Assinado

| Passo | Ação Manual/Comando | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Receber webhook real do Mercado Pago sandbox | Headers `x-signature` e `x-request-id` presentes | Pendente |  |
| 2 | Conferir logs Base44/função | Assinatura validada antes de processar | Pendente |  |
| 3 | Verificar validações de ativação | `tenant_id`, `subscription_id`, plano, valor, moeda e status conferidos | Pendente |  |
| 4 | Conferir assinatura | Apenas tenant correto fica `active` | Pendente |  |

### Webhook Inválido

Usar payload conceitual abaixo sem assinatura válida.

```bash
curl -X POST https://SEU_APP/api/functions/mercadopagoWebhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"123"}}'
```

| Passo | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- |
| Enviar sem `x-signature`/`x-request-id` | Resposta `401` ou `403` | Pendente |  |
| Enviar com assinatura errada | Resposta `401` ou `403` | Pendente |  |
| Conferir dados | Nenhuma assinatura ativada, nenhum pagamento `paid` criado | Pendente |  |

### Idempotência / Replay

| Passo | Ação Manual | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| 1 | Reenviar o mesmo evento válido | API responde recebido/duplicado | Pendente |  |
| 2 | Conferir `Payment` | Não cria pagamento duplicado | Pendente |  |
| 3 | Conferir assinatura | Não estende vencimento duas vezes indevidamente | Pendente |  |
| 4 | Conferir `WebhookEvent` | Evento processado registrado com idempotência | Pendente |  |

## Seção Específica: Permissões Base44

Validar no painel Base44 e por tentativa prática com usuário cliente.

| Entidade | Permissão Esperada Para Cliente | Permissão Esperada Para `super_admin` | Status | Evidência/Observação |
| --- | --- | --- | --- | --- |
| `Tenant` | Não listar/editar outros tenants | Listar/administrar | Pendente |  |
| `User` | Não elevar próprio papel | Administrar usuários | Pendente |  |
| `Subscription` | Não alterar campos críticos diretamente | Administrar/suporte | Pendente |  |
| `Payment` | Ver apenas pagamentos do próprio tenant | Listar/admin | Pendente |  |
| `PaymentGateway` | Sem acesso cliente | Administrar sem secrets MP em texto | Pendente |  |
| `WebhookEvent` | Sem acesso cliente | Listar/admin | Pendente |  |
| `TransactionLog` | Sem acesso cliente | Listar/admin | Pendente |  |
| `Product` | CRUD apenas com `tenant_id` próprio | Listar/admin se necessário | Pendente |  |
| `Invoice` | CRUD apenas com `tenant_id` próprio | Listar/admin se necessário | Pendente |  |
| `ChatConversation` | Apenas conversas do próprio tenant | Listar/admin se necessário | Pendente |  |
| `ChatMessage` | Apenas mensagens do próprio tenant | Listar/admin se necessário | Pendente |  |
| `PharmacySettings` | Apenas configurações do próprio tenant | Listar/admin se necessário | Pendente |  |

### Campos Críticos De Assinatura

Cliente comum não deve conseguir alterar diretamente:

| Campo | Resultado Esperado | Status | Evidência/Observação |
| --- | --- | --- | --- |
| `status` | Alteração bloqueada fora de backend/webhook | Pendente |  |
| `next_billing_date` | Alteração bloqueada fora de backend/webhook | Pendente |  |
| `last_payment_date` | Alteração bloqueada fora de backend/webhook | Pendente |  |
| `auto_renew` | Alteração bloqueada fora de backend/webhook | Pendente |  |
| `trial_end_date` | Alteração bloqueada fora de backend/webhook | Pendente |  |

## Riscos Que Dependem De Sandbox Real

| Risco | Como Validar | Status | Evidência/Observação |
| --- | --- | --- | --- |
| Formato exato de `x-signature` Mercado Pago | Webhook real em sandbox | Pendente |  |
| Persistência de `metadata` em `preapproval` | Evento real `subscription_preapproval` | Pendente |  |
| Retorno de `init_point` no `preapproval` | Checkout real cartão sandbox | Pendente |  |
| Evento PIX aprovado com metadados completos | Pagamento PIX sandbox | Pendente |  |
| Replay real de webhook MP | Reenvio pelo painel/log sandbox | Pendente |  |
| Regras Base44 efetivas em runtime | Testes com cliente comum e `super_admin` | Pendente |  |

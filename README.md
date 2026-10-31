# 🏥 JRRPCD - Prontuário e Evolução de Pacientes (OPM)

Sistema web em **React** desenvolvido para acompanhamento clínico, controle de evolução e prontuário de pacientes em programas de reabilitação e concessão de **Órteses, Próteses e Materiais Especiais (OPM)**, preparado para hospedagem no **Firebase Hosting** e banco de dados **Firebase Firestore**.

---

## 📋 Campos Atendidos no Prontuário

O sistema atende integralmente a todos os campos solicitados com validação, cálculo inteligente e formatação:

1. **Data de entrada**: Data de admissão do paciente no programa (preenchida automaticamente com a data de hoje).
2. **Nome**: Nome completo do paciente.
3. **Data de nascimento**: Seletor de data de nascimento.
4. **IDADE**: Calculada **automaticamente** em anos e meses (ex: *45 anos*, *8 meses*) a partir da data de nascimento, permitindo também ajuste manual quando necessário.
5. **TELEFONE**: Com máscara de formatação automática `(XX) XXXXX-XXXX` e botão com atalho direto para conversa no **WhatsApp**.
6. **Município**: Cidade de residência do paciente.
7. **ESF de referência**: Estratégia de Saúde da Família / Unidade Básica de Saúde de referência de origem do paciente.
8. **CID / Impressão diagnóstica**: Campo com digitação livre e atalhos rápidos para CIDs comuns de reabilitação/PCD (ex: *G80 Paralisia Cerebral*, *I69 Sequelas de AVC*, *G82 Paraplegia/Tetraplegia*, *S88 Amputações*, etc.).
9. **Tipo de OPM**: Campo com sugestões automáticas de cadeiras de rodas (padrão, motorizada, infantil, banho), órteses (AFO, KAFO), próteses (transtibiais, transfemorais), andadores, muletas e calçados ortopédicos.
10. **Prontuário / Observações**: Campo amplo de anotações clínicas iniciais, queixa principal, condições do membro/coto e histórico médico.

---

## ✨ Recursos Adicionais Integrados

- **Histórico Cronológico de Evolução Clínica**: Linha do tempo completa para registrar cada atendimento, avaliação física, medições/moldagens, provas de OPM e entregas, identificando o profissional responsável (Nome e CRM/CREFITO/COREN) e a conduta adotada.
- **Impressão Oficial / Salvar como PDF**: Layout médico formal formatado para folhas A4 com cabeçalho institucional, ficha cadastral, todas as evoluções e campo para assinatura/carimbo do profissional.
- **Filtros e Busca em Tempo Real**: Localize pacientes instantaneamente por nome, CID, município, tipo de OPM ou telefone.
- **Cards de Indicadores Clínicos**: Total de pacientes, em triagem/avaliação, aguardando OPM e concluídos.
- **Exportação e Importação de Backup**: Faça download dos prontuários em arquivo `.json` a qualquer momento para garantir a segurança dos dados.
- **Conector Visual do Firebase**: Permite configurar e conectar seu banco de dados Firebase Firestore colando o `firebaseConfig` diretamente na interface gráfica, sem precisar recompilar o código. Possui modo offline/local automático de fallback caso o Firebase ainda não esteja configurado.

---

## 🚀 Como Rodar Localmente

1. Abra o terminal na pasta do projeto:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abra o navegador no endereço indicado (geralmente `http://localhost:3000`).

---

## 🔥 Configuração do Firebase Firestore

### 1. Criar o Projeto no Firebase Console
1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Clique em **"Adicionar projeto"** e defina um nome (ex: `prontuario-jrrpcd`).
3. No menu lateral esquerdo, vá em **Compilação > Firestore Database** e clique em **Criar banco de dados**.
4. Escolha o local do servidor (ex: `southamerica-east1` - São Paulo) e selecione o modo de regras.

### 2. Obter as Chaves de Acesso
1. Vá em **Configurações do Projeto** (ícone de engrenagem) > aba **Geral**.
2. Na seção **Seus aplicativos**, clique no ícone Web (`</>`), defina um apelido e registre o app.
3. Copie o objeto `firebaseConfig` exibido.

### 3. Conectar ao Aplicativo
Você pode conectar de duas maneiras:
- **Pela Interface do Sistema**: Clique no botão de status do Firebase no topo da tela do app e cole o bloco de configuração. O app reconhecerá as chaves instantaneamente!
- **Ou via arquivo `.env`**: Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
  ```env
  VITE_FIREBASE_API_KEY=AIzaSy...
  VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=seu-projeto
  VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
  VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
  ```

---

## 🌐 Publicação no Firebase Hosting

O projeto já inclui os arquivos de configuração [`firebase.json`](file:///c:/Projetos/prontuario%20JRRPCD/firebase.json) e [`firestore.rules`](file:///c:/Projetos/prontuario%20JRRPCD/firestore.rules).

1. Instale o Firebase CLI (caso não tenha):
   ```bash
   npm install -g firebase-tools
   ```

2. Faça login na sua conta Google:
   ```bash
   firebase login
   ```

3. Associe o projeto ao seu projeto do Firebase:
   ```bash
   firebase use --add
   ```
   *(Ou altere o nome do projeto no arquivo `.firebaserc`)*

4. Gere a versão de produção otimizada:
   ```bash
   npm run build
   ```

5. Publique para o Firebase Hosting e Firestore:
   ```bash
   firebase deploy
   ```

Após o comando, o terminal exibirá a URL pública do seu aplicativo (ex: `https://prontuario-jrrpcd.web.app`).

---

## 🔒 Regras de Segurança do Firestore (`firestore.rules`)

O arquivo [`firestore.rules`](file:///c:/Projetos/prontuario%20JRRPCD/firestore.rules) incluído gerencia as permissões da coleção `pacientes` e subcoleção `evolucoes`. Em ambiente de produção com autenticação de usuários, você pode restringir o acesso apenas a profissionais autenticados alterando a regra para:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pacientes/{pacienteId} {
      allow read, write: if request.auth != null;
      
      match /evolucoes/{evolucaoId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

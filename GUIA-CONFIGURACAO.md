# Almoxarifado da Piramba — guia de configuração

© 2026 Felippe Alvarez. Todos os direitos reservados.

O app já funciona em **modo demonstração** (dados só no aparelho). Para que até 5 pessoas usem a mesma base, faça uma vez as etapas abaixo. Tudo no plano gratuito do Firebase (Spark), sem cartão.

## Etapa 1 — GitHub (onde o app fica publicado)

1. Abra **github.com/new**.
2. Nome do repositório: `almoxarifado-piramba`. Marque **Public** (o GitHub Pages gratuito exige). Não marque README.
3. Toque em **Create repository** e avise o Claude, que envia os arquivos.
4. Depois do envio: no repositório, **Settings › Pages** › em *Branch* escolha `main` e pasta `/ (root)` › **Save**. Em 1 ou 2 minutos o endereço fica no ar:
   `https://felippealvarez.github.io/almoxarifado-piramba/`

> O código fica visível, mas os **dados não**: eles ficam no Firebase, protegidos pelas regras de segurança. A chave do Firebase que vai no código não é senha; ela só identifica o projeto.

## Etapa 2 — Criar o projeto no Firebase

1. Abra **console.firebase.google.com** com sua conta Google e toque em **Criar projeto**.
2. Nome: `almoxarifado-piramba`. O Google Analytics pode ser **desativado**. Conclua.

## Etapa 3 — Ativar o login com Google

1. No menu do projeto: **Criação (Build) › Authentication › Vamos começar**.
2. Aba **Método de login** › **Google** › **Ativar** › escolha seu e-mail de suporte › **Salvar**.
3. Aba **Configurações › Domínios autorizados** › **Adicionar domínio** › digite `felippealvarez.github.io` › Adicionar.

## Etapa 4 — Criar o banco de dados

1. Menu: **Criação (Build) › Firestore Database › Criar banco de dados**.
2. Local: **southamerica-east1 (São Paulo)**. Modo: **produção**. Criar.
3. Aba **Regras**: apague o texto que aparece, cole todo o conteúdo do arquivo `firestore.rules` (o Claude envia) e toque em **Publicar**.

## Etapa 5 — Pegar os dados de conexão

1. Toque na engrenagem ⚙ › **Configurações do projeto**.
2. Em **Seus apps**, toque no ícone **Web `</>`**. Apelido: `almoxarifado`. **Não** marque Firebase Hosting. Registrar.
3. Vai aparecer um bloco `const firebaseConfig = { apiKey: ..., authDomain: ..., ... }`. Copie esse bloco e cole no chat com o Claude, que atualiza o app.

## Etapa 6 — Primeiro uso

1. Abra o endereço do app no Chrome do Android › **Entrar com Google** › **Criar** o almoxarifado.
2. Menu **⋮ › Adicionar à tela inicial / Instalar app**.
3. Em **Ajustes › Convidar pelo WhatsApp**, envie o código às demais pessoas (máximo 5).

## Dúvidas comuns

- **“Domínio não autorizado” ao entrar:** falta a Etapa 3, item 3.
- **“Permissão negada”:** as regras da Etapa 4, item 3 não foram publicadas.
- **Trocar de aparelho:** basta entrar com a mesma conta Google; os dados vêm do Firebase.

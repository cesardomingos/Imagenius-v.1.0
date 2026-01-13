<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1zZVbaKXrJYVBJL_j3tTvcI9GIfRzStNU

## Run Locally

**Prerequisites:**  Node.js

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure a API Key do Gemini:**
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione sua chave da API:
     ```
     GEMINI_API_KEY=sua_chave_aqui
     ```
   - Obtenha sua chave em: https://aistudio.google.com/apikey
   - **Nota:** Você pode copiar o arquivo `.env.example` como base:
     ```bash
     cp .env.example .env
     ```

3. **Execute o app:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   - O app estará disponível em: http://localhost:3000

## Troubleshooting

### Página em branco
- Verifique se o arquivo `.env` existe e contém `GEMINI_API_KEY`
- Verifique o console do navegador (F12) para erros
- Certifique-se de que todas as dependências foram instaladas: `npm install`

### Erro de API Key
- Certifique-se de que a chave está correta no arquivo `.env`
- A chave deve estar na mesma linha, sem espaços extras
- Reinicie o servidor de desenvolvimento após criar/editar o `.env`

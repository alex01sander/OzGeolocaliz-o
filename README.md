# Ozmap API

## Descrição

A **Ozmap API** é uma aplicação backend desenvolvida com **Node.js**, **TypeScript** e **MongoDB**. Ela oferece funcionalidades para gerenciamento de usuários e regiões, além de serviços de geocodificação usando a API do Google Maps. A API é documentada com **Swagger**, oferecendo uma interface interativa para testar os endpoints.

## Tecnologias

- **Node.js** e **TypeScript** para desenvolvimento backend.
- **Express.js** para criação da API RESTful.
- **MongoDB** como banco de dados NoSQL.
- **Swagger** para documentação interativa da API.
- **Mocha** e **Chai** para testes automatizados.
- **Docker** para containerização do ambiente de desenvolvimento.

## Pré-requisitos

Antes de executar a aplicação, instale as seguintes ferramentas:

- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)
- [Yarn](https://yarnpkg.com/) (opcional, caso prefira ao npm)

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
MONGO_URI=mongodb://usuario:senha@localhost:27017/meubanco
PORT=3000
GOOGLE_API_KEY=sua_api_key
```

## Instalação

Clone o repositório:

```env
git clone https://github.com/seu-usuario/ozmap-api.git
cd ozmap-api
```

Instale as dependências:

Se usar Yarn:

```env
yarn install
```

Ou se usar npm:

```env
npm install
```

Suba os containers do Docker:

O projeto inclui configuração do Docker para facilitar o ambiente de desenvolvimento. Execute:

```env
docker-compose up
```

Execute a aplicação:

Para rodar o servidor localmente, use:

Se usar Yarn:

```env
yarn dev
```

Ou se usar npm:

```env
npm run dev
```

A aplicação estará disponível em http://localhost:3000.

## Endpoints

A API fornece os seguintes endpoints:

- **GET** /api-docs: Acesse a documentação interativa da API via Swagger.
- **POST** /users: Cria um usuário.
- **GET** /users: Lista todos os usuários.
- **GET** /users/:id: Obtém detalhes de um usuário específico.
- **POST** /regions: Cria uma nova região.
- **GET** /regions: Lista todas as regiões.
- **GET** /geocode/coordinates: Converte um endereço para coordenadas geográficas.
- **GET** /geocode/address: Converte coordenadas geográficas em um endereço.

## Testes

Execute os testes para garantir que tudo está funcionando corretamente. Use o comando abaixo:

Se estiver usando Yarn:

```env
yarn dev
```

Ou se usar npm:

```env
npm run dev
```

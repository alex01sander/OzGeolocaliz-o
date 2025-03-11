# Imagem official do node.js
FROM node:20

#Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependencia
COPY  pack*.json ./
COPY yarn.lock ./

#Instalar dependencia do yarn
RUN yarn install

#Copiar todo o código da aplicação
COPY . .

#Porta que a API irá rodar
EXPOSE 3000

#Rodar a aplicação
CMD ["yarn", "dev"]
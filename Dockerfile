FROM node:16.13.0
WORKDIR /app
COPY package*.json ./
RUN yarn
COPY . .
EXPOSE 8001
CMD ["yarn", "start"]
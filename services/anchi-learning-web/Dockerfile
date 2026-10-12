FROM node:23-alpine

WORKDIR /app
COPY package.json package-lock.json ./
COPY services/anchi-learning-api/package.json services/anchi-learning-api/package.json
COPY services/anchi-learning-web/package.json services/anchi-learning-web/package.json
COPY services/shared/package.json services/shared/package.json
RUN npm ci
COPY services/anchi-learning-web services/anchi-learning-web
COPY services/shared services/shared
EXPOSE 5173
CMD ["npm", "run", "dev", "--workspace", "@anchi/web", "--", "--host", "0.0.0.0"]
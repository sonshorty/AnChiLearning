FROM node:23-alpine

WORKDIR /app
COPY package.json package-lock.json ./
COPY services/anchi-learning-api/package.json services/anchi-learning-api/package.json
COPY services/anchi-learning-web/package.json services/anchi-learning-web/package.json
COPY services/shared/package.json services/shared/package.json
RUN npm ci
COPY services/anchi-learning-api services/anchi-learning-api
COPY services/shared services/shared
RUN npm run build --workspace @anchi/api

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@anchi/api"]
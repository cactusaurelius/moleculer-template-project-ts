FROM node:14-alpine as builder

WORKDIR /app
COPY package.json yarn.lock rollup.config.js tsconfig.json moleculer.config.ts ./
RUN yarn install --frozen-lockfile
COPY src ./src
RUN yarn build

FROM node:14-alpine

WORKDIR /app
RUN mkdir ./database
RUN chown node:node -R /app
USER node
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node ./database/production ./database/production
COPY --chown=node:node package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production && yarn cache clean

CMD ["yarn", "start"]

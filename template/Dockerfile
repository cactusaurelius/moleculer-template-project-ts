FROM node:alpine as builder

WORKDIR /app
COPY package.json yarn.lock rollup.config.js tsconfig.json moleculer.config.ts ./
RUN yarn install --frozen-lockfile
COPY src /app/src
RUN yarn build

FROM node:alpine

WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production && yarn cache clean

CMD ["yarn", "start"]

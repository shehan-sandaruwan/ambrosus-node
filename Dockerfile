FROM node:9

WORKDIR /app

COPY ./package.json ./yarn.lock /app/

RUN yarn install

COPY . ./

RUN yarn build

ARG GIT_SHA1
RUN test -n "$GIT_SHA1"
ENV GIT_COMMIT="$GIT_SHA1"
LABEL git_commit="$GIT_SHA1"

CMD ["yarn", "start"]

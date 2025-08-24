FROM ruby:3.2

RUN apt-get update -qq && apt-get install -y \
    nodejs npm sqlite3 build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g yarn foreman

RUN yarn add --force @parcel/watcher --build-from-source

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

EXPOSE 3000

CMD ["rails", "server", "-b", "0.0.0.0"]

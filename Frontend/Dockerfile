# Stage 1: Build the Code
FROM node:18-buster-slim AS build
WORKDIR /app

# Install system dependencies for canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libpng-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package.json and yarn.lock separately to optimize caching
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the app's source code
COPY . .

# Build the project
RUN yarn build

# Stage 2: Run the Application
FROM node:18-alpine
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built assets from the build stage
COPY --from=build /app/next.config.mjs ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Expose the application's port
EXPOSE 3000

# Start the application
CMD ["yarn", "start"]

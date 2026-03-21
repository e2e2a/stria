FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Next.js dev port
EXPOSE 3000

# Change to npm run dev if you want to enable nextjs development logs
CMD ["npm", "run", "start"]
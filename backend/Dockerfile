############################################################################
#                       << C.H.A.O.S.V3 - CODEX >>                            #
#                   BACKEND DOCKER CONFIGURATION                              #
#                      [CONTAINMENT-MATRIX-V1]                                #
############################################################################

# Use Node.js LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install platform-specific dependencies
RUN apk add --no-cache python3 make g++ 

# Copy package files
COPY package*.json ./

# Install dependencies with production flag
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000

# Expose API port
EXPOSE 5000

# Start command
CMD ["node", "dist/server.js"]

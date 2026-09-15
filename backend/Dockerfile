# Use official Debian-based Node.js LTS image
FROM node:20-bookworm-slim

# Install system dependencies: Python 3, pip, venv, and ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set up Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY python/requirements.txt ./python/
RUN pip install --no-cache-dir -r python/requirements.txt

# Install Node.js production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Ensure temp directory exists with proper permissions
RUN mkdir -p controllers/temp && chmod -R 777 controllers/temp

# Set container environment defaults
ENV PORT=8000
ENV PYTHON_BIN=python3
ENV NODE_ENV=production

EXPOSE 8000

CMD ["node", "server.js"]

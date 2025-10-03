# Use Alpine Linux with Node.js
FROM alpine:3.18

# Install Node.js, npm, Python, and pip
RUN apk add --no-cache \
    nodejs \
    npm \
    python3 \
    py3-pip \
    ca-certificates

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY backend/requirements.txt ./backend/

# Install Python dependencies first
RUN pip3 install -r backend/requirements.txt

# Install Node dependencies
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build frontend with correct API URL
ENV REACT_APP_API_URL=""
RUN cd frontend && npm run build

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3001

# Start with migrations then server
CMD ["/app/start.sh"]

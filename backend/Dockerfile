FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source and sample data
COPY . .
COPY ../bookleaf_sample_data.json ./bookleaf_sample_data.json

# Expose port
EXPOSE 8000

# Run database seed and start server
CMD ["sh", "-c", "python -m app.seeds.seed_data && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

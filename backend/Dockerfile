# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Run the application
# We use host 0.0.0.0 to be accessible outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

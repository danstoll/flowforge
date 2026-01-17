FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim AS production
WORKDIR /app
RUN useradd --create-home appuser
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH
COPY src ./src
RUN chown -R appuser:appuser /app
USER appuser
ENV ENVIRONMENT=production PORT=3007
EXPOSE 3007
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3007"]

FROM python:3.11-slim AS development
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
ENV ENVIRONMENT=development PORT=3007
EXPOSE 3007 5678
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3007", "--reload"]

"""LLM Service - Main Application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="FlowForge LLM Service",
    description="Large language model inference service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "llm-service",
        "version": "1.0.0",
    }


@app.post("/api/v1/llm/chat")
async def chat_completion():
    # TODO: Implement chat completion
    return {"success": True, "message": "Chat endpoint - coming soon"}


@app.post("/api/v1/llm/embeddings")
async def generate_embeddings():
    # TODO: Implement embeddings generation
    return {"success": True, "message": "Embeddings endpoint - coming soon"}

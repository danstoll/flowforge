"""Vector Service - Main Application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="FlowForge Vector Service",
    description="Vector similarity search service using Qdrant",
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
        "service": "vector-service",
        "version": "1.0.0",
    }


@app.post("/api/v1/vector/collections")
async def create_collection():
    # TODO: Implement collection creation
    return {"success": True, "message": "Create collection endpoint - coming soon"}


@app.post("/api/v1/vector/collections/{collection}/search")
async def search_vectors(collection: str):
    # TODO: Implement vector search
    return {"success": True, "message": f"Search in {collection} - coming soon"}

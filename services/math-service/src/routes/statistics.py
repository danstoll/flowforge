"""
Statistics calculation routes.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
import numpy as np
from scipy import stats
from datetime import datetime

router = APIRouter()


class StatisticsRequest(BaseModel):
    """Request model for statistics calculation."""
    data: List[float] = Field(..., description="Array of numbers to analyze", min_length=1, max_length=10000)
    operations: List[str] = Field(
        default=["mean", "median", "stddev"],
        description="Statistical operations to perform"
    )


class StatisticsResponse(BaseModel):
    """Response model for statistics."""
    success: bool
    data: Dict[str, Any]
    request_id: Optional[str] = None
    timestamp: str


class PercentileRequest(BaseModel):
    """Request model for percentile calculation."""
    data: List[float] = Field(..., min_length=1, max_length=10000)
    percentiles: List[float] = Field(..., description="Percentiles to calculate (0-100)")


class CorrelationRequest(BaseModel):
    """Request model for correlation calculation."""
    x: List[float] = Field(..., min_length=2, max_length=10000)
    y: List[float] = Field(..., min_length=2, max_length=10000)
    method: str = Field(default="pearson", description="Correlation method: pearson, spearman, kendall")


SUPPORTED_OPERATIONS = {
    "mean": lambda arr: float(np.mean(arr)),
    "median": lambda arr: float(np.median(arr)),
    "mode": lambda arr: float(stats.mode(arr, keepdims=True).mode[0]),
    "stddev": lambda arr: float(np.std(arr)),
    "variance": lambda arr: float(np.var(arr)),
    "min": lambda arr: float(np.min(arr)),
    "max": lambda arr: float(np.max(arr)),
    "sum": lambda arr: float(np.sum(arr)),
    "count": lambda arr: len(arr),
    "range": lambda arr: float(np.max(arr) - np.min(arr)),
    "q1": lambda arr: float(np.percentile(arr, 25)),
    "q2": lambda arr: float(np.percentile(arr, 50)),
    "q3": lambda arr: float(np.percentile(arr, 75)),
    "iqr": lambda arr: float(np.percentile(arr, 75) - np.percentile(arr, 25)),
    "skewness": lambda arr: float(stats.skew(arr)),
    "kurtosis": lambda arr: float(stats.kurtosis(arr)),
    "sem": lambda arr: float(stats.sem(arr)),  # Standard error of mean
}


@router.post("/statistics")
async def calculate_statistics(request: Request, body: StatisticsRequest):
    """
    Calculate statistical measures for a dataset.
    
    Available operations: mean, median, mode, stddev, variance, min, max, sum, count,
    range, q1, q2, q3, iqr, skewness, kurtosis, sem
    """
    try:
        arr = np.array(body.data)
        results = {"count": len(body.data)}
        
        for op in body.operations:
            op_lower = op.lower()
            if op_lower in SUPPORTED_OPERATIONS:
                try:
                    results[op_lower] = round(SUPPORTED_OPERATIONS[op_lower](arr), 10)
                except Exception as e:
                    results[op_lower] = {"error": str(e)}
            else:
                results[op_lower] = {"error": f"Unknown operation: {op}"}
        
        return StatisticsResponse(
            success=True,
            data=results,
            request_id=getattr(request.state, 'request_id', None),
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        return StatisticsResponse(
            success=False,
            data={"error": str(e)},
            request_id=getattr(request.state, 'request_id', None),
            timestamp=datetime.utcnow().isoformat() + "Z",
        )


@router.post("/percentile")
async def calculate_percentiles(request: Request, body: PercentileRequest):
    """Calculate specific percentiles for a dataset."""
    try:
        arr = np.array(body.data)
        results = {}
        
        for p in body.percentiles:
            if 0 <= p <= 100:
                results[f"p{int(p)}"] = round(float(np.percentile(arr, p)), 10)
            else:
                results[f"p{int(p)}"] = {"error": "Percentile must be between 0 and 100"}
        
        return StatisticsResponse(
            success=True,
            data=results,
            request_id=getattr(request.state, 'request_id', None),
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        return StatisticsResponse(
            success=False,
            data={"error": str(e)},
            request_id=getattr(request.state, 'request_id', None),
            timestamp=datetime.utcnow().isoformat() + "Z",
        )


@router.post("/correlation")
async def calculate_correlation(request: Request, body: CorrelationRequest):
    """Calculate correlation between two arrays."""
    try:
        if len(body.x) != len(body.y):
            raise ValueError("Arrays must have the same length")
        
        x = np.array(body.x)
        y = np.array(body.y)
        
        if body.method == "pearson":
            correlation, p_value = stats.pearsonr(x, y)
        elif body.method == "spearman":
            correlation, p_value = stats.spearmanr(x, y)
        elif body.method == "kendall":
            correlation, p_value = stats.kendalltau(x, y)
        else:
            raise ValueError(f"Unknown method: {body.method}")
        
        return StatisticsResponse(
            success=True,
            data={
                "correlation": round(float(correlation), 10),
                "p_value": round(float(p_value), 10),
                "method": body.method,
            },
            request_id=getattr(request.state, 'request_id', None),
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        return StatisticsResponse(
            success=False,
            data={"error": str(e)},
            request_id=getattr(request.state, 'request_id', None),
            timestamp=datetime.utcnow().isoformat() + "Z",
        )


@router.get("/statistics/operations")
async def list_operations():
    """List all supported statistical operations."""
    return {
        "success": True,
        "data": {
            "operations": list(SUPPORTED_OPERATIONS.keys()),
            "correlation_methods": ["pearson", "spearman", "kendall"],
        },
    }

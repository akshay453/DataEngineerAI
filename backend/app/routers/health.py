from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def health_check():
    """Simple liveness check — useful once you deploy this behind Docker/K8s."""
    return {"status": "ok"}

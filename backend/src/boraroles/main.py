from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from boraroles.api.v1.router import router as api_v1_router
from boraroles.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="bora-roles API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_v1_router)

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

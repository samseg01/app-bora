from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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

    # As fotos do curador (item 45) são servidas pela própria API, e não pelo `file_server`
    # do Caddy, por **paridade**: assim o caminho `/fotos/x.jpg` funciona igual em
    # desenvolvimento, no teste e em produção. O Caddy só faz `reverse_proxy` daqui.
    # Trocar por servidor de arquivos na borda é uma linha no Caddyfile no dia em que
    # servir imagem por Python virar problema medido — hoje é um punhado de fotos de bar.
    #
    # `check_dir=False` porque o diretório pode não existir antes do primeiro upload, e
    # subir a API é o que menos deveria depender disso.
    fotos = Path(settings.fotos_dir)
    app.mount("/fotos", StaticFiles(directory=fotos, check_dir=False), name="fotos")

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

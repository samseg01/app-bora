from fastapi import APIRouter

from boraroles.api.v1 import auth, contribuicao, curador, descoberta, estabelecimento, mapa

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(descoberta.router)
router.include_router(mapa.router)
router.include_router(contribuicao.router)
router.include_router(curador.router)
router.include_router(estabelecimento.router)

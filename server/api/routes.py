#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
/////////////////////////////////////////////////////////////////////////
//                                                                     //
//   ██████╗  ██████╗ ██╗   ██╗████████╗███████╗███████╗              //
//   ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔════╝              //
//   ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ███████╗              //
//   ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ╚════██║              //
//   ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗███████║              //
//   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚══════╝              //
//                                                                     //
//  API ROUTES MODULE - Gateway to C.H.A.O.S services                  //
//                                                                     //
//  [CODEX:ROUTES]                                                     //
//  API Version: v1                                                    //
//  Authentication: JWT with refresh tokens                            //
//  Rate limits: Enforced on all public endpoints                      //
//                                                                     //
//  Security layers: Input validation, CSRF, Role-based access         //
//  Documentation: OpenAPI/Swagger with examples                       //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
"""

from fastapi import APIRouter, Depends, HTTPException, status

# Import specific route modules
# from .auth import router as auth_router
# from .users import router as users_router
# from .messages import router as messages_router
# from .servers import router as servers_router
# from .voice import router as voice_router

# Create main API router
api_router = APIRouter()

# Include sub-routers with appropriate prefixes
# api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
# api_router.include_router(users_router, prefix="/users", tags=["Users"])
# api_router.include_router(messages_router, prefix="/messages", tags=["Messages"])
# api_router.include_router(servers_router, prefix="/servers", tags=["Servers"])
# api_router.include_router(voice_router, prefix="/voice", tags=["Voice"])

# Basic test endpoint for API
@api_router.get("/test", tags=["Test"])
async def test_api():
    """
    [CODEX:TEST]
    Simple test endpoint for checking API functionality
    
    Returns a success message to confirm API is responding
    """
    return {
        "status": "success",
        "message": "C.H.A.O.S. API is functioning correctly",
        "version": "1.0.0"
    }

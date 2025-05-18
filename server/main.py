#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
/////////////////////////////////////////////////////////////////////////
//                                                                     //
//   ██████╗██╗  ██╗ █████╗  ██████╗ ███████╗   ██╗   ██╗██████╗      //
//  ██╔════╝██║  ██║██╔══██╗██╔═══██╗██╔════╝   ██║   ██║╚════██╗     //
//  ██║     ███████║███████║██║   ██║███████╗   ██║   ██║ █████╔╝     //
//  ██║     ██╔══██║██╔══██║██║   ██║╚════██║   ╚██╗ ██╔╝██╔═══╝      //
//  ╚██████╗██║  ██║██║  ██║╚██████╔╝███████║    ╚████╔╝ ███████╗     //
//   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     ╚═══╝  ╚══════╝     //
//                                                                     //
//  SERVER MAIN MODULE - Where digital chaos becomes harmony           //
//                                                                     //
//  [CODEX:INIT]                                                       //
//  Server version: 1.0.0                                              //
//  Build date: 2025-05-18                                             //
//  Python compatibility: 3.10+                                         //
//  Execution mode: Async                                              //
//                                                                     //
//  Transmission encrypted with 02XC-Protocol                          //
//  Authentication challenge: SHA-256/Argon2                           //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
"""

import os
import sys
import logging
import asyncio
import platform
import uvicorn
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

# Ensure cross-platform path handling
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Import local modules
from utils.logger import setup_logger
from database.connection import init_db, shutdown_db
from config.settings import get_settings

# Set up logger with custom formatter
logger = setup_logger(name="chaos.server", log_level=logging.INFO)
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    [CODEX:LIFESPAN]
    Initialize required services when app starts and dispose when it stops
    This asynccontextmanager ensures clean startup and shutdown
    Protocol: 02XC-Handshake
    """
    logger.info("==== C.H.A.O.S. SERVER BOOTING SEQUENCE INITIATED ====")
    logger.info(f"System platform: {platform.system()} {platform.release()}")
    logger.info(f"Python version: {platform.python_version()}")
    logger.info(f"Running in {settings.environment} mode")
    
    # Initialize required services
    await init_db()
    
    # Announce server is ready
    logger.info("==== C.H.A.O.S. SERVER ONLINE ====")
    
    yield  # Server runs here
    
    # Cleanup when server shuts down
    logger.info("==== INITIATING C.H.A.O.S. SERVER SHUTDOWN SEQUENCE ====")
    await shutdown_db()
    logger.info("==== C.H.A.O.S. SERVER OFFLINE ====")

# Create FastAPI app with custom configuration
app = FastAPI(
    title="C.H.A.O.S. API",
    description="Cross-platform Hub for Audio, Organizing & Socializing",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.environment != "production" else None,
    redoc_url="/api/redoc" if settings.environment != "production" else None,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include API routers
from api.routes import api_router
app.include_router(api_router, prefix="/api")

# Mount static files for production if they exist
static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/", tags=["Health"])
async def root():
    """
    [CODEX:ROOT]
    Root endpoint for API health check
    Challenges: None
    Authorization: None
    
    Returns a welcome message indicating server is operational
    """
    return {
        "message": "Welcome to C.H.A.O.S. API",
        "status": "operational",
        "version": "1.0.0",
        "environment": settings.environment,
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """
    [CODEX:HEALTH]
    Health check endpoint for monitoring systems
    Challenges: None
    Authorization: None
    
    Returns detailed server health status
    """
    return {
        "status": "healthy",
        "uptime": "N/A",  # TODO: Implement uptime tracking
        "database": "connected",  # TODO: Add actual db health check
        "services": {
            "voice": "online",
            "messaging": "online",
            "authentication": "online"
        }
    }

def start():
    """
    [CODEX:START]
    Entry point to run the server directly
    Development mode only - production should use proper ASGI server
    """
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
        log_level="info",
    )

if __name__ == "__main__":
    start()

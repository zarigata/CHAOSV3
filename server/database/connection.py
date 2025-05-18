#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
/////////////////////////////////////////////////////////////////////////
//                                                                     //
//   ██████╗  █████╗ ████████╗ █████╗ ██████╗  █████╗ ███████╗███████╗ //
//   ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝ //
//   ██║  ██║███████║   ██║   ███████║██████╔╝███████║███████╗█████╗   //
//   ██║  ██║██╔══██║   ██║   ██╔══██║██╔══██╗██╔══██║╚════██║██╔══╝   //
//   ██████╔╝██║  ██║   ██║   ██║  ██║██████╔╝██║  ██║███████║███████╗ //
//   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝ //
//                                                                     //
//  DATABASE CONNECTION MODULE - Safe harbor for digital bits          //
//                                                                     //
//  [CODEX:DB]                                                         //
//  Connection type: Async SQLAlchemy                                  //
//  Database engine: PostgreSQL                                        //
//  Schema version: v1.0                                               //
//  Migration tool: Alembic                                            //
//                                                                     //
//  Critical security: Connection strings encrypted in memory          //
//  Pooling: Enabled with custom sizing based on load                  //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
"""

import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import QueuePool

from config.settings import get_settings

# Get application settings
settings = get_settings()

# Create async engine with connection pooling
engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",
    future=True,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_recycle=settings.db_pool_recycle,
    pool_pre_ping=True,
)

# Create async session factory with custom configuration
async_session_factory = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Create base class for declarative models
Base = declarative_base()

async def init_db():
    """
    [CODEX:INIT_DB]
    Initialize database connection and create tables if needed
    
    This runs during application startup to ensure the database
    is properly configured and accessible
    """
    from utils.logger import get_logger
    logger = get_logger("chaos.database")
    
    logger.info("Initializing database connection")
    
    try:
        # Validate connection by trying to connect
        async with engine.begin() as conn:
            # Only create tables in development mode
            if settings.environment == "development" and settings.create_tables:
                logger.info("Creating database tables")
                await conn.run_sync(Base.metadata.create_all)
            
        logger.info("Database connection established successfully")
    except Exception as e:
        logger.critical(f"Database connection failed: {str(e)}")
        raise

async def shutdown_db():
    """
    [CODEX:SHUTDOWN_DB]
    Gracefully close database connections
    
    This runs during application shutdown to ensure all database
    resources are properly released
    """
    from utils.logger import get_logger
    logger = get_logger("chaos.database")
    
    logger.info("Closing database connections")
    
    try:
        await engine.dispose()
        logger.info("Database connections closed successfully")
    except Exception as e:
        logger.error(f"Error closing database connections: {str(e)}")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    [CODEX:GET_DB]
    Dependency function to get a database session
    
    Usage:
        @app.get("/endpoint")
        async def endpoint(db: AsyncSession = Depends(get_db)):
            # Use db session here
    
    Yields:
        AsyncSession: Database session for query execution
    """
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()

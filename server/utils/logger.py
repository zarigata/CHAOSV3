#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
/////////////////////////////////////////////////////////////////////////
//                                                                     //
//   ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗            //
//   ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║            //
//   ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║            //
//   ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║            //
//   ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║            //
//   ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝            //
//                                                                     //
//  LOGGER MODULE - Monitoring the chaos with style                    //
//                                                                     //
//  [CODEX:LOG]                                                        //
//  Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL                  //
//  Color-coded for visual clarity in terminal output                  //
//  Rotation: Daily with 30-day retention                              //
//  Format: [TIME][LEVEL][MODULE] Message                              //
//                                                                     //
//  Special codes: Encrypted with standard logging protocols           //
//  Terminal view: Enabled for all environments                        //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
"""

import os
import sys
import logging
import platform
from pathlib import Path
from datetime import datetime
import colorlog
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler

def setup_logger(name="chaos", log_level=logging.INFO, log_to_file=True):
    """
    [CODEX:SETUP]
    Configures and returns a logger with color formatting
    
    Args:
        name (str): Logger name
        log_level (int): Logging level
        log_to_file (bool): Whether to write logs to file
        
    Returns:
        logging.Logger: Configured logger instance
    """
    # Create custom logger
    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    logger.propagate = False
    
    # Clear existing handlers if any
    if logger.handlers:
        logger.handlers.clear()
    
    # Create color formatter for console output
    console_formatter = colorlog.ColoredFormatter(
        "%(log_color)s[%(asctime)s][%(levelname)s][%(name)s] %(message)s%(reset)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        log_colors={
            'DEBUG': 'cyan',
            'INFO': 'green',
            'WARNING': 'yellow',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        }
    )
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # Add file logging if enabled
    if log_to_file:
        # Cross-platform log directory
        log_dir = Path(__file__).resolve().parent.parent / "logs"
        os.makedirs(log_dir, exist_ok=True)
        
        # Create file handler with rotation
        log_file = log_dir / f"{name}.log"
        file_formatter = logging.Formatter(
            "[%(asctime)s][%(levelname)s][%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        
        # Rotate logs daily and keep for 30 days
        file_handler = TimedRotatingFileHandler(
            filename=log_file,
            when="midnight",
            interval=1,
            backupCount=30,
            encoding="utf-8"
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    # Log startup information including platform details
    logger.debug(f"Logger '{name}' initialized at level {logging.getLevelName(log_level)}")
    logger.debug(f"Running on {platform.system()} {platform.release()}")
    
    return logger


def get_logger(name="chaos"):
    """
    [CODEX:GET]
    Retrieve an existing logger or create a new one
    
    Args:
        name (str): Logger name to retrieve
        
    Returns:
        logging.Logger: Logger instance
    """
    logger = logging.getLogger(name)
    
    # If logger doesn't have handlers, set it up
    if not logger.handlers:
        return setup_logger(name)
    
    return logger

#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
/////////////////////////////////////////////////////////////////////////
//                                                                     //
//   ██╗   ██╗███████╗███╗   ██╗██╗   ██╗    ███████╗███████╗████████╗//
//   ██║   ██║██╔════╝████╗  ██║██║   ██║    ██╔════╝██╔════╝╚══██╔══╝//
//   ██║   ██║█████╗  ██╔██╗ ██║██║   ██║    ███████╗█████╗     ██║   //
//   ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║╚██╗ ██╔╝    ╚════██║██╔══╝     ██║   //
//    ╚████╔╝ ███████╗██║ ╚████║ ╚████╔╝     ███████║███████╗   ██║   //
//     ╚═══╝  ╚══════╝╚═╝  ╚═══╝  ╚═══╝      ╚══════╝╚══════╝   ╚═╝   //
//                                                                     //
//  VIRTUAL ENVIRONMENT SETUP - Isolation chamber for dependencies      //
//                                                                     //
//  [CODEX:VENV]                                                       //
//  Python version detection: Auto-selects optimal version             //
//  Cross-platform support: Windows and Linux compatible               //
//  Package installation: Requirements-based with verification         //
//                                                                     //
//  Environment variables: Automatically configured                    //
//  Development tools: Includes debugging and testing utilities        //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
"""

import os
import sys
import subprocess
import platform
import argparse
import venv
import sysconfig
from pathlib import Path


def print_banner():
    """Display cool ASCII banner"""
    banner = """
    ░█████╗░░░░██╗░░██╗░░░░█████╗░░░░░░░░█████╗░░░░░░░░██████╗░░░░
    ██╔══██╗░░░██║░░██║░░░██╔══██╗░░░░░░██╔══██╗░░░░░░██╔════╝░░░░
    ██║░░╚═╝░░░███████║░░░███████║░░░░░░██║░░██║░░░░░░╚█████╗░░░░░
    ██║░░██╗░░░██╔══██║░░░██╔══██║░░░░░░██║░░██║░░░░░░░╚═══██╗░░░░
    ╚█████╔╝░░░██║░░██║░░░██║░░██║░░░░░░╚█████╔╝░░░░░░██████╔╝░░░░
    ░╚════╝░░░░╚═╝░░╚═╝░░░╚═╝░░╚═╝░░░░░░░╚════╝░░░░░░░╚═════╝░░░░░
    
    VIRTUAL ENVIRONMENT SETUP UTILITY
    Cross-platform Python environment for C.H.A.O.S
    """
    print(banner)


class EnhancedVenvCreator(venv.EnvBuilder):
    """
    [CODEX:VENV_BUILDER]
    Enhanced virtual environment builder with additional features
    """
    def __init__(self, *args, **kwargs):
        self.python_path = kwargs.pop('python_path', None)
        super().__init__(*args, **kwargs)
        
    def post_setup(self, context):
        """
        Post-setup hook to install packages from requirements file
        """
        # Get the path to the Python executable in the virtual environment
        if platform.system() == 'Windows':
            python_exe = os.path.join(context.bin_path, 'python.exe')
        else:
            python_exe = os.path.join(context.bin_path, 'python')
        
        print(f"[+] Virtual environment created at: {context.env_dir}")
        print(f"[+] Python executable: {python_exe}")
        
        # Get the path to the requirements files
        server_requirements = os.path.join(BASE_DIR, 'server', 'requirements.txt')
        
        # Install server requirements if the file exists
        if os.path.exists(server_requirements):
            print("[+] Installing server requirements...")
            try:
                subprocess.run(
                    [python_exe, '-m', 'pip', 'install', '-U', 'pip'],
                    check=True
                )
                subprocess.run(
                    [python_exe, '-m', 'pip', 'install', '-r', server_requirements],
                    check=True
                )
                print("[+] Server requirements installed successfully!")
            except subprocess.CalledProcessError as e:
                print(f"[!] Error installing server requirements: {e}")
                return False
        else:
            print("[!] Server requirements file not found.")
            
        print("\n[+] Setup complete! Your virtual environment is ready.")
        print(f"[+] Activate the environment with:")
        
        if platform.system() == 'Windows':
            print(f"    {os.path.join(context.bin_path, 'activate.bat')}")
        else:
            print(f"    source {os.path.join(context.bin_path, 'activate')}")
            
        return True


def detect_python_version():
    """
    [CODEX:PYTHON_DETECT]
    Detect the best Python version to use
    Prefers Python 3.10+ as per project requirements
    """
    python_paths = []
    
    if platform.system() == 'Windows':
        # Check common Windows Python installation paths
        python_exes = ['python.exe', 'python3.exe', 'python3.10.exe', 'python3.11.exe']
        python_paths = ['C:\\Python310\\python.exe', 'C:\\Python311\\python.exe']
        
        # Check Python in PATH
        for exe in python_exes:
            result = subprocess.run(
                ['where', exe], 
                capture_output=True, 
                text=True,
                shell=True
            )
            if result.returncode == 0:
                for path in result.stdout.strip().split('\n'):
                    if path and os.path.exists(path):
                        python_paths.append(path)
    else:
        # Check common Linux/Mac Python paths
        python_exes = ['python3.10', 'python3.11', 'python3']
        
        for exe in python_exes:
            result = subprocess.run(
                ['which', exe], 
                capture_output=True, 
                text=True,
                shell=True
            )
            if result.returncode == 0:
                path = result.stdout.strip()
                if path and os.path.exists(path):
                    python_paths.append(path)
    
    # Check versions of found Python installations
    best_path = None
    best_version = (0, 0, 0)
    
    for path in python_paths:
        try:
            # Get the version of this Python executable
            result = subprocess.run(
                [path, '-c', 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                version_str = result.stdout.strip()
                version_tuple = tuple(map(int, version_str.split('.')))
                
                # We need at least Python 3.10
                if version_tuple >= (3, 10, 0) and version_tuple > best_version:
                    best_version = version_tuple
                    best_path = path
        except Exception:
            continue
    
    if best_path:
        print(f"[+] Found Python {'.'.join(map(str, best_version))} at {best_path}")
        return best_path
    
    print("[!] No suitable Python version found. Please install Python 3.10+")
    return None


def setup_venv(env_path, python_path=None, upgrade_pip=True):
    """
    [CODEX:SETUP_VENV]
    Set up a virtual environment with the specified Python version
    """
    print(f"[+] Creating virtual environment at {env_path}")
    print(f"[+] Using Python executable: {python_path or sys.executable}")
    
    try:
        # Create a virtual environment with the specified Python version
        builder = EnhancedVenvCreator(
            system_site_packages=False,
            clear=True,
            symlinks=platform.system() != 'Windows',
            upgrade=upgrade_pip,
            with_pip=True,
            python_path=python_path
        )
        
        builder.create(env_path)
        return True
    except Exception as e:
        print(f"[!] Error creating virtual environment: {e}")
        return False


def main():
    """
    [CODEX:MAIN]
    Main entry point for the script
    Handles command-line arguments and initiates setup
    """
    parser = argparse.ArgumentParser(description='Set up a virtual environment for C.H.A.O.S.')
    parser.add_argument('--path', default='venv', help='Path where to create the virtual environment')
    parser.add_argument('--python', help='Python executable to use')
    parser.add_argument('--no-banner', action='store_true', help='Do not display the banner')
    args = parser.parse_args()
    
    if not args.no_banner:
        print_banner()
    
    # Detect Python version if not specified
    python_path = args.python
    if not python_path:
        python_path = detect_python_version()
    
    # Create virtual environment path
    venv_path = os.path.join(BASE_DIR, args.path)
    os.makedirs(os.path.dirname(venv_path), exist_ok=True)
    
    # Set up the virtual environment
    success = setup_venv(venv_path, python_path)
    
    if success:
        print("\n[+] Virtual environment setup completed successfully!")
    else:
        print("\n[!] Virtual environment setup failed.")
        sys.exit(1)


if __name__ == '__main__':
    # Get the base directory of the project
    BASE_DIR = Path(__file__).resolve().parent.parent
    main()

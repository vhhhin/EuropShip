@echo off
REM Batch script to start MySQL on Windows
REM Run as Administrator

echo === MySQL Service Starter ===
echo.

REM Try common MySQL service names
set SERVICES=MySQL80 MySQL57 MySQL MariaDB wampmysqld

for %%S in (%SERVICES%) do (
    sc query %%S >nul 2>&1
    if !errorlevel! equ 0 (
        echo Found service: %%S
        sc query %%S | findstr "RUNNING" >nul
        if !errorlevel! equ 0 (
            echo MySQL is already running!
            goto :test
        ) else (
            echo Starting MySQL service...
            net start %%S
            if !errorlevel! equ 0 (
                echo MySQL started successfully!
                goto :test
            )
        )
    )
)

echo.
echo MySQL service not found.
echo.
echo Please start MySQL manually:
echo 1. Press Windows + R
echo 2. Type: services.msc
echo 3. Find MySQL or MariaDB service
echo 4. Right-click -^> Start
echo.

:test
echo.
echo Testing database connection...
cd /d %~dp0
php check-db-connection.php
pause



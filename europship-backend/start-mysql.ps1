# PowerShell Script to Start MySQL on Windows
# Run as Administrator: Right-click → Run with PowerShell

Write-Host "=== MySQL Service Starter ===" -ForegroundColor Cyan
Write-Host ""

# Try to find and start MySQL service
$services = @("MySQL80", "MySQL57", "MySQL", "MariaDB", "wampmysqld")

$found = $false
foreach ($serviceName in $services) {
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "Found service: $serviceName" -ForegroundColor Green
        Write-Host "Status: $($service.Status)" -ForegroundColor Yellow
        
        if ($service.Status -eq "Running") {
            Write-Host "MySQL is already running!" -ForegroundColor Green
            $found = $true
            break
        } else {
            Write-Host "Starting MySQL service..." -ForegroundColor Yellow
            try {
                Start-Service -Name $serviceName
                Start-Sleep -Seconds 2
                $service.Refresh()
                if ($service.Status -eq "Running") {
                    Write-Host "MySQL started successfully!" -ForegroundColor Green
                    $found = $true
                    break
                } else {
                    Write-Host "Failed to start MySQL. Status: $($service.Status)" -ForegroundColor Red
                }
            } catch {
                Write-Host "Error starting MySQL: $_" -ForegroundColor Red
            }
        }
    }
}

if (-not $found) {
    Write-Host ""
    Write-Host "MySQL service not found in common locations." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start MySQL manually:" -ForegroundColor Yellow
    Write-Host "1. Press Windows + R" -ForegroundColor White
    Write-Host "2. Type: services.msc" -ForegroundColor White
    Write-Host "3. Find MySQL or MariaDB service" -ForegroundColor White
    Write-Host "4. Right-click → Start" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install MySQL/XAMPP/WAMP if not installed." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing database connection..." -ForegroundColor Cyan
cd $PSScriptRoot
php check-db-connection.php



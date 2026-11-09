# OSB Service Stopper - Closes CMD windows, frees ports, terminates node processes

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  DANG DUNG VA DONG TAT CA CAC CUA SO DICH VU OSB...     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kill any process listening on ports 3000, 3030, 3041, 3043, 8081 and their parent cmd
$targetPorts = @(3000, 3030, 3041, 3043, 8081)
foreach ($port in $targetPorts) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $pId = $conn.OwningProcess
            if ($pId -gt 0) {
                try {
                    $parent = (Get-CimInstance Win32_Process -Filter "ProcessId = $pId" -ErrorAction SilentlyContinue).ParentProcessId
                    if ($parent -and $parent -gt 0) {
                        Stop-Process -Id $parent -Force -ErrorAction SilentlyContinue
                    }
                    Stop-Process -Id $pId -Force -ErrorAction SilentlyContinue
                    Write-Host "[OK] Da giai phong Port $port (PID: $pId)" -ForegroundColor Green
                } catch {}
            }
        }
    }
}

# 2. Kill all CMD windows started for OSB
$cmdProcesses = Get-CimInstance Win32_Process -Filter "Name = 'cmd.exe'" -ErrorAction SilentlyContinue
foreach ($cmd in $cmdProcesses) {
    if ($cmd.CommandLine -match 'Identity API|Logbook API|Gateway API|Web Admin|Mobile App|start:dev|Electronic-Logbook|Logbook-identity|Gateway-api|expo') {
        try {
            Stop-Process -Id $cmd.ProcessId -Force -ErrorAction SilentlyContinue
            Write-Host "[OK] Da dong cua so CMD: $($cmd.ProcessId)" -ForegroundColor Green
        } catch {}
    }
}

# 3. Clean up lingering node.exe processes
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Da tat tien trinh Node: $($_.Id)" -ForegroundColor Green
    } catch {}
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  DA DUNG VA DONG TAT CA DICH VU THANH CONG!             " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Start-Sleep -Seconds 2


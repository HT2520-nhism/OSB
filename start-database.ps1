# Helper to verify and start Docker + postgres-osb before launching OSB services

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  KIEM TRA & KHOI DONG DATABASE POSTGRES (postgres-osb)  " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$dockerOk = $false
try {
    $out = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) { $dockerOk = $true }
} catch {}

if (-not $dockerOk) {
    Write-Host "Docker Desktop chua bat hoac dang khoi dong..." -ForegroundColor Yellow
    Write-Host "Dang thu goi Docker Desktop..." -ForegroundColor Cyan
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue

    $maxWait = 30
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 3
        $waited += 3
        try {
            $out = docker ps 2>&1
            if ($LASTEXITCODE -eq 0) {
                $dockerOk = $true
                break
            }
        } catch {}
        Write-Host "  Dang cho Docker daemon san sang... ($waited/$maxWait s)" -ForegroundColor DarkGray
    }
}

if (-not $dockerOk) {
    Write-Host ""
    Write-Host "[CHU Y QUAN TRONG]" -ForegroundColor Red
    Write-Host "Docker Desktop chua duoc bat hoac chua san sang!" -ForegroundColor Yellow
    Write-Host "1. Vui long mo bieu tuong Docker Desktop tren man hinh (icon ca voi)." -ForegroundColor White
    Write-Host "2. Cho den khi ca voi mau xanh (Docker Engine is running)." -ForegroundColor White
    Write-Host "3. Chay lai start-all.bat de khoi dong he thong." -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Docker Engine da san sang. Dang khoi dong postgres-osb..." -ForegroundColor Cyan
docker start postgres-osb > $null 2>&1
docker update --restart unless-stopped postgres-osb > $null 2>&1

$dbReady = $false
for ($i = 0; $i -lt 15; $i++) {
    $conn = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($conn) {
        $dbReady = $true
        break
    }
    Start-Sleep -Seconds 1
}

if ($dbReady) {
    Write-Host "[OK] Database Postgres da san sang ket noi tai localhost:5432!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[!] Container postgres-osb dang khoi dong, tiep tuc khoi dong cac dich vu..." -ForegroundColor Yellow
    exit 0
}


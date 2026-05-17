# O2OEG MOBILE PREVIEW LAUNCHER
Write-Host "=========================================="
Write-Host "LAUNCHING MOBILE EMULATOR..."
Write-Host "=========================================="

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $sdkPath)) {
    $possiblePaths = @("C:\Android\Sdk", "D:\Android\Sdk", "G:\Android\Sdk")
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $sdkPath = $path
            break
        }
    }
}

if (-not (Test-Path $sdkPath)) {
    Write-Host "ERROR: Android SDK not found!"
    exit
}

$emulatorPath = "$sdkPath\emulator\emulator.exe"
if (-not (Test-Path $emulatorPath)) {
    Write-Host "ERROR: Emulator.exe not found!"
    exit
}

Write-Host "Checking for Virtual Devices..."
$avds = & $emulatorPath -list-avds

if ($null -eq $avds -or $avds.Length -eq 0) {
    Write-Host "No Virtual Devices found."
    exit
}

$targetAvd = $avds | Select-Object -First 1
Write-Host "Found Virtual Device: $targetAvd"

Write-Host "Starting Emulator $targetAvd..."
Start-Process $emulatorPath -ArgumentList "-avd $targetAvd"

Write-Host "------------------------------------------"
Write-Host "EMULATOR IS STARTING!"
Write-Host "Go to: http://10.0.2.2:5173"
Write-Host "------------------------------------------"

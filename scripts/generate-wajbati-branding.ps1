Add-Type -AssemblyName System.Drawing

$userMasterPath = "C:\Users\Bzbook\.gemini\antigravity\brain\ab6ce2b3-e95b-4d08-9f99-cd615dbfa80b\wajbati_icon_master_png_1791887394597.jpg"
$driverMasterPath = "C:\Users\Bzbook\.gemini\antigravity\brain\ab6ce2b3-e95b-4d08-9f99-cd615dbfa80b\wajbati_livreur_icon_png_1791887454692.jpg"

Write-Output "Generating Wajbati branding assets with full-bleed crop..."

# 1. Full-bleed icon crop
function Create-FullBleedIcon([string]$srcPath, [string]$outPath, [int]$outW, [int]$outH) {
    $src = [System.Drawing.Bitmap]::FromFile($srcPath)
    $dest = New-Object System.Drawing.Bitmap($outW, $outH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $cropRect = New-Object System.Drawing.Rectangle(60, 60, 904, 904)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $outW, $outH)
    $g.DrawImage($src, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $src.Dispose()

    $dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Output "Created: $outPath ($($outW)x$($outH))"
}

# 2. Driver full-bleed icon (driver master is already full bleed)
function Create-DriverIcon([string]$srcPath, [string]$outPath, [int]$outW, [int]$outH) {
    $src = [System.Drawing.Bitmap]::FromFile($srcPath)
    $dest = New-Object System.Drawing.Bitmap($outW, $outH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $outW, $outH)
    $g.DrawImage($src, $destRect, 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $src.Dispose()

    $dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Output "Created: $outPath ($($outW)x$($outH))"
}

# 3. Android Adaptive Icon (fits safely within 66% circle mask)
function Create-AdaptiveIcon([string]$srcPath, [string]$outPath, [System.Drawing.Color]$bgColor, [bool]$isUser) {
    $src = [System.Drawing.Bitmap]::FromFile($srcPath)
    $dest = New-Object System.Drawing.Bitmap(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($bgBrush, 0, 0, 1024, 1024)
    $bgBrush.Dispose()

    $scale = 0.72
    $w = [int](1024 * $scale)
    $h = [int](1024 * $scale)
    $x = [int]((1024 - $w) / 2)
    $y = [int]((1024 - $h) / 2)

    $destRect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)

    if ($isUser) {
        $cropRect = New-Object System.Drawing.Rectangle(60, 60, 904, 904)
        $g.DrawImage($src, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    } else {
        $g.DrawImage($src, $destRect, 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel)
    }

    $g.Dispose()
    $src.Dispose()

    $dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Output "Created Adaptive: $outPath"
}

# 4. Splash Screen (1284x2778)
function Create-SplashScreen([string]$srcPath, [string]$outPath, [string]$subtitle, [System.Drawing.Color]$topColor, [System.Drawing.Color]$bottomColor, [bool]$isUser) {
    $dest = New-Object System.Drawing.Bitmap(1284, 2778, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, 1284, 2778)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $topColor, $bottomColor, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillRectangle($gradBrush, $rect)
    $gradBrush.Dispose()

    # Emblem centered in middle 40%
    $src = [System.Drawing.Bitmap]::FromFile($srcPath)
    $emblemSize = 860
    $emblemX = [int]((1284 - $emblemSize) / 2)
    $emblemY = [int](2778 * 0.32)
    $destRect = New-Object System.Drawing.Rectangle($emblemX, $emblemY, $emblemSize, $emblemSize)

    if ($isUser) {
        $cropRect = New-Object System.Drawing.Rectangle(60, 60, 904, 904)
        $g.DrawImage($src, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    } else {
        $g.DrawImage($src, $destRect, 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel)
    }
    $src.Dispose()

    # Bottom subtitle
    try {
        $font = New-Object System.Drawing.Font("Arial", 30, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(215, 250, 235))
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $g.DrawString($subtitle, $font, $textBrush, 642, 2400, $sf)
        $font.Dispose()
        $textBrush.Dispose()
        $sf.Dispose()
    } catch {
        Write-Warning "Font render: $_"
    }

    $g.Dispose()
    $dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    Write-Output "Created Splash: $outPath"
}

$userBgColor = [System.Drawing.Color]::FromArgb(7, 98, 65)
$userSplashTop = [System.Drawing.Color]::FromArgb(6, 78, 59)
$userSplashBottom = [System.Drawing.Color]::FromArgb(5, 150, 105)

$driverBgColor = [System.Drawing.Color]::FromArgb(7, 112, 79)
$driverSplashTop = [System.Drawing.Color]::FromArgb(4, 85, 60)
$driverSplashBottom = [System.Drawing.Color]::FromArgb(16, 185, 129)

# 1. USER-SIDE ASSETS
Write-Output "--- Exporting user-side assets ---"
Create-FullBleedIcon $userMasterPath "user-side/assets/icon.png" 1024 1024
Create-AdaptiveIcon $userMasterPath "user-side/assets/adaptive-icon.png" $userBgColor $true
Create-SplashScreen $userMasterPath "user-side/assets/splash.png" "Cuisine Maison - Produits Sains & Frais" $userSplashTop $userSplashBottom $true
Create-FullBleedIcon $userMasterPath "user-side/assets/logo.png" 500 500
Create-FullBleedIcon $userMasterPath "user-side/assets/favicon.png" 48 48

# 2. DRIVER-APP ASSETS
Write-Output "--- Exporting driver-app assets ---"
Create-DriverIcon $driverMasterPath "driver-app/assets/icon.png" 1024 1024
Create-AdaptiveIcon $driverMasterPath "driver-app/assets/adaptive-icon.png" $driverBgColor $false
Create-SplashScreen $driverMasterPath "driver-app/assets/splash.png" "Livraison Rapide & Securisee" $driverSplashTop $driverSplashBottom $false
Create-DriverIcon $driverMasterPath "driver-app/assets/favicon.png" 48 48

# 3. RESTAURANT-DASHBOARD ASSETS
Write-Output "--- Exporting restaurant-dashboard assets ---"
Create-FullBleedIcon $userMasterPath "restaurant-dashboard/public/logo.png" 500 500
Create-FullBleedIcon $userMasterPath "restaurant-dashboard/public/favicon.png" 48 48
Create-FullBleedIcon $userMasterPath "restaurant-dashboard/public/favicon.ico" 48 48

Write-Output "Done generating all assets!"


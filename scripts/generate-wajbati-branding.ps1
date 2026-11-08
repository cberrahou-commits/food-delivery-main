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

# 4. Splash Screen (1284x2778) - Seamless feathered embedding (no square outline)
function Create-SplashScreen([string]$srcPath, [string]$outPath, [string]$subtitle, [System.Drawing.Color]$bgColor, [bool]$isUser) {
    $src = [System.Drawing.Bitmap]::FromFile($srcPath)
    $dest = New-Object System.Drawing.Bitmap(1284, 2778, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Fill entire background with solid color matching app.json
    $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($bgBrush, 0, 0, 1284, 2778)
    $bgBrush.Dispose()

    # Extract emblem with smooth radial alpha feathering so NO square border exists
    $cropW = 900
    $cropH = 900
    $cropX = [int]((1024 - $cropW) / 2)
    $cropY = [int]((1024 - $cropH) / 2)

    $emblemBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $centerX = $cropW / 2.0
    $centerY = $cropH / 2.0
    $innerR = 360.0
    $outerR = 435.0

    for ($y = 0; $y -lt $cropH; $y++) {
        for ($x = 0; $x -lt $cropW; $x++) {
            $srcPixel = $src.GetPixel($cropX + $x, $cropY + $y)
            $dx = $x - $centerX
            $dy = $y - $centerY
            $dist = [Math]::Sqrt($dx * $dx + $dy * $dy)

            if ($dist -le $innerR) {
                $alpha = 255
            } elseif ($dist -ge $outerR) {
                $alpha = 0
            } else {
                $t = ($dist - $innerR) / ($outerR - $innerR)
                $smooth = (1.0 + [Math]::Cos($t * [Math]::PI)) / 2.0
                $alpha = [int]($smooth * 255)
            }

            if ($alpha -gt 0) {
                $pixColor = [System.Drawing.Color]::FromArgb($alpha, $srcPixel.R, $srcPixel.G, $srcPixel.B)
                $emblemBmp.SetPixel($x, $y, $pixColor)
            }
        }
    }

    $emblemDrawSize = 880
    $emblemDrawX = [int]((1284 - $emblemDrawSize) / 2)
    $emblemDrawY = [int](2778 * 0.33)
    $destRect = New-Object System.Drawing.Rectangle($emblemDrawX, $emblemDrawY, $emblemDrawSize, $emblemDrawSize)
    $g.DrawImage($emblemBmp, $destRect, 0, 0, $cropW, $cropH, [System.Drawing.GraphicsUnit]::Pixel)

    $emblemBmp.Dispose()
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
$driverBgColor = [System.Drawing.Color]::FromArgb(7, 112, 79)

# 1. USER-SIDE ASSETS
Write-Output "--- Exporting user-side assets ---"
Create-FullBleedIcon $userMasterPath "user-side/assets/icon.png" 1024 1024
Create-AdaptiveIcon $userMasterPath "user-side/assets/adaptive-icon.png" $userBgColor $true
Create-SplashScreen $userMasterPath "user-side/assets/splash.png" "Cuisine Maison - Produits Sains & Frais" $userBgColor $true
Create-FullBleedIcon $userMasterPath "user-side/assets/logo.png" 500 500
Create-FullBleedIcon $userMasterPath "user-side/assets/favicon.png" 48 48

# 2. DRIVER-APP ASSETS
Write-Output "--- Exporting driver-app assets ---"
Create-DriverIcon $driverMasterPath "driver-app/assets/icon.png" 1024 1024
Create-AdaptiveIcon $driverMasterPath "driver-app/assets/adaptive-icon.png" $driverBgColor $false
Create-SplashScreen $driverMasterPath "driver-app/assets/splash.png" "Livraison Rapide & Securisee" $driverBgColor $false
Create-DriverIcon $driverMasterPath "driver-app/assets/favicon.png" 48 48

# 3. RESTAURANT-DASHBOARD ASSETS
Write-Output "--- Exporting restaurant-dashboard assets ---"
Create-FullBleedIcon $userMasterPath "restaurant-dashboard/public/logo.png" 500 500
Create-FullBleedIcon $userMasterPath "restaurant-dashboard/public/favicon.png" 48 48
Create-FullBleedIcon $userMasterPath "restaurant-dashboard/public/favicon.ico" 48 48

Write-Output "Done generating all assets!"


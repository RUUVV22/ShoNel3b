Add-Type -AssemblyName System.Drawing
$sourcePath = Join-Path (Get-Location) 'assets/Warm retro Arabic-only game logo.png'
$source = [System.Drawing.Image]::FromFile($sourcePath)
try {
  foreach ($size in @(192,512)) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#351326'))
      $g.DrawImage($source, 0, 0, $size, $size)
      $dest = Join-Path (Get-Location) "assets/pwa-icon-$size.png"
      $bitmap.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
      Write-Output "Generated $dest"
    } finally {
      $g.Dispose()
      $bitmap.Dispose()
    }
  }
} finally { $source.Dispose() }

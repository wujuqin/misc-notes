param([Parameter(Mandatory=$true)][string]$InputFile, [string[]]$Images = @())
$ErrorActionPreference = 'Stop'
$repoDir = Split-Path $PSScriptRoot -Parent
$passwordFile = Join-Path $repoDir '.local\password.dpapi'
if (-not (Test-Path -LiteralPath $passwordFile)) { throw '请先运行 tools\Set-Password.ps1。' }
$protectedPassword = (Get-Content -LiteralPath $passwordFile -Raw -Encoding UTF8).Trim()
$secure = ConvertTo-SecureString -String $protectedPassword
$saved = [Environment]::GetEnvironmentVariable('MISC_NOTES_PASSWORD','Process')
try {
  $env:MISC_NOTES_PASSWORD = [System.Net.NetworkCredential]::new('', $secure).Password
  $nodePath = 'C:\Users\Wu\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  if (-not (Test-Path -LiteralPath $nodePath)) { $nodePath = (Get-Command node -ErrorAction Stop).Source }
  $resolvedImages = @($Images | ForEach-Object { (Resolve-Path -LiteralPath $_).Path })
  & $nodePath (Join-Path $PSScriptRoot 'encrypt.mjs') (Resolve-Path -LiteralPath $InputFile).Path (Join-Path $repoDir 'docs\payload.json') @resolvedImages
  if ($LASTEXITCODE -ne 0) { throw '加密失败。' }
} finally { [Environment]::SetEnvironmentVariable('MISC_NOTES_PASSWORD',$saved,'Process') }

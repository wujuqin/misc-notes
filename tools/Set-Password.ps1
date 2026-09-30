$ErrorActionPreference = 'Stop'
$localDir = Join-Path (Split-Path $PSScriptRoot -Parent) '.local'
New-Item -ItemType Directory -Path $localDir -Force | Out-Null
$first = Read-Host '输入专用密码（至少 8 个字符）' -AsSecureString
$second = Read-Host '再次输入密码' -AsSecureString
$a = [System.Net.NetworkCredential]::new('', $first).Password
$b = [System.Net.NetworkCredential]::new('', $second).Password
if ($a.Length -lt 8) { throw '密码至少需要 8 个字符。' }
if ($a -cne $b) { throw '两次密码不一致，未保存。' }
$first | ConvertFrom-SecureString | Set-Content -LiteralPath (Join-Path $localDir 'password.dpapi') -Encoding utf8
$a = $null
$b = $null
Write-Output '密码已用 Windows DPAPI 保存，仅用于此电脑的当前 Windows 用户。'

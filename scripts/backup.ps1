# Backup important public files to backups folder with timestamp
$timestamp = (Get-Date).ToString('yyyy-MM-dd_HH-mm-ss')
$backupDir = Join-Path -Path (Join-Path $PSScriptRoot '..') -ChildPath "backups\backup_$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$filesToCopy = @("public\lernplattform.html","public\css\style.css","public\index.html")
foreach($f in $filesToCopy){
    $src = Join-Path -Path (Join-Path $PSScriptRoot '..') -ChildPath $f
    if(Test-Path $src){
        Copy-Item -Path $src -Destination $backupDir -Force
    }
}
Write-Output "Backup completed: $backupDir"

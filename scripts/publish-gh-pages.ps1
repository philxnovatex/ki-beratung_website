<#
Publish `public/` to the `gh-pages` branch using git worktree.
Usage (PowerShell, run from repo root):
  .\scripts\publish-gh-pages.ps1

Preconditions:
- git must be installed and repo must be clean (commit or stash changes first).
- You must have push access to origin.

This script is a quick workaround to publish static files to GitHub Pages without relying
on GitHub Actions. It is safe for local use and will create/update the `gh-pages` branch.
#>
Set-StrictMode -Version Latest
cd (Resolve-Path "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)\..")

function Exec([string]$cmd){
  Write-Host "> $cmd"
  & cmd /c $cmd
  if($LASTEXITCODE -ne 0){ throw "Command failed: $cmd" }
}

# ensure repo clean
$status = git status --porcelain
if($status){ Write-Host "Please commit or stash changes before publishing."; exit 1 }

$worktree = Join-Path (Get-Location) '.gh-pages-worktree'
if(Test-Path $worktree){ Write-Host "Removing existing worktree at $worktree"; Exec "git worktree remove -f $worktree" }

# create or reuse gh-pages branch in a worktree
try{
  Exec "git worktree add $worktree gh-pages"
}catch{
  # branch may not exist yet
  Exec "git worktree add -b gh-pages $worktree origin/HEAD"
}

Write-Host "Copying public/ -> $worktree"
Remove-Item -Recurse -Force (Join-Path $worktree '*') -ErrorAction SilentlyContinue
Copy-Item -Recurse -Force -Path .\public\* -Destination $worktree

Push-Location $worktree
try{
  Exec "git add --all"
  Exec "git commit -m \"Update gh-pages\" || echo 'no changes to commit'"
  Exec "git push origin gh-pages --force"
}finally{ Pop-Location }

Write-Host "Published to gh-pages branch. Clean up: removing worktree."
Exec "git worktree remove -f $worktree"
Write-Host "Done. Your site should be visible at https://<username>.github.io/<repo> in a few minutes."

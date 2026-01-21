Set-Location -Path "${PSScriptRoot}\.."

npx hexo clean
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx hexo generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

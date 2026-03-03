@echo off
echo ============================================
echo   UPLOADING TALENTSHUB TO GITHUB
echo   Repository: neweragit/talent-tek-backend
echo ============================================
echo.

cd /d "D:\abla\TALENTSHUB"
if errorlevel 1 (
    echo ERROR: Could not navigate to TALENTSHUB directory
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

echo Checking if git repository exists...
if not exist ".git" (
    echo Initializing git repository...
    git init
    echo.
)

echo Checking git status...
git status
echo.

echo Adding all files to git...
git add .
echo.

echo Committing changes...
git commit -m "Update frontend - TALENTSHUB React TypeScript project" -m "Latest updates:" -m "- Enhanced signup forms with loading states" -m "- Improved employer interview management" -m "- Added talent acquisition interview interface" -m "- Database migrations and schema updates" -m "- Complete UI with shadcn components" -m "- Authentication and role-based access control"
echo.

echo Pushing to GitHub repository...
git push -u origin main
echo.

if errorlevel 0 (
    echo.
    echo ========================================
    echo   SUCCESS: Project uploaded to GitHub!
    echo   URL: https://github.com/neweragit/talent-tek-backend
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   Upload failed. Check your credentials.
    echo ========================================
)

echo.
echo Press any key to close...
pause >nul
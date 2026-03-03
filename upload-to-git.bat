@echo off
echo Uploading TALENTSHUB project to GitHub...
echo Repository: https://github.com/neweragit/talent-tek-backend.git
echo.

cd /d "D:\abla\TALENTSHUB"

echo Current directory:
cd
echo.

echo Checking git status...
git status
echo.

echo Adding all files (excluding node_modules via .gitignore)...
git add .
echo.

echo Committing changes...
git commit -m "Initial commit - TALENTSHUB React TypeScript project" -m "Features:" -m "- React TypeScript frontend with Vite" -m "- Supabase backend integration" -m "- Complete UI with shadcn/ui components" -m "- Employer and talent management" -m "- Interview scheduling system" -m "- Authentication and role-based access" -m "- Database migrations included"
echo.

echo Pushing to GitHub...
git push -u origin main
echo.

if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Project uploaded to GitHub successfully!
    echo Repository URL: https://github.com/neweragit/talent-tek-backend.git
) else (
    echo ERROR: Failed to upload. Check your GitHub credentials and internet connection.
)

echo.
echo Press any key to continue...
pause > nul
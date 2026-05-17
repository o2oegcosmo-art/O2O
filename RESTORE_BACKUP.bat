@echo off
color 4f
echo ========================================================
echo       O2OEG SYSTEM RESTORE - EMERGENCY ROLLBACK
echo ========================================================
echo.
echo WARNING: This will erase all recent code changes and revert
echo the project exactly to the "v1.0.0-stable-launch" state.
echo.
echo Press CTRL+C to cancel, or press any key to start restore.
pause

echo.
echo Reverting Git repository to the stable tag...
git reset --hard v1.0.0-stable-launch
git clean -fd

echo.
echo Rebuilding frontend...
cd frontend
call npm run build

echo.
echo RESTORE COMPLETE! 
echo The project has been safely rolled back to the pre-launch state.
pause

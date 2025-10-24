@echo off
setlocal EnableExtensions EnableDelayedExpansion

if exist "frames" rd /s /q "frames"
mkdir "frames"

set i=0

for /f "delims=" %%h in ('git log --reverse --follow --format^=%%H -- example.png') do (
  set "idx=0000!i!"
  set "idx=!idx:~-4!"
  
  echo Processing commit: %%h -> frames/!idx!.png
  
  git show "%%h:./example.png" > "frames/!idx!.png"
  set /a i+=1
)

ffmpeg -framerate 6 -i "frames/%%04d.png" ^
  -vf "palettegen=reserve_transparent=1" -y palette.png

ffmpeg -framerate 6 -i "frames/%%04d.png" -i palette.png ^
  -lavfi "paletteuse=dither=bayer:diff_mode=rectangle" ^
  -gifflags -transdiff -y timelapse.gif

endlocal
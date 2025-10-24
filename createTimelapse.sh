#!/bin/bash

# This script gathers the full history of the example.png from repository, and create git animation as timelapse.gif

mkdir -p frames

rm -f frames/*.png

i=0
for h in $(git log --follow --format=%H -- example.png | tac); do
    git show "$h:./example.png" > "frames/$(printf "%04d" $i).png"
    i=$((i + 1))
done

ffmpeg -framerate 6 -i 'frames/%04d.png' \
  -vf "palettegen=reserve_transparent=1" -y palette.png

ffmpeg -framerate 6 -i 'frames/%04d.png' -i palette.png \
  -lavfi "paletteuse=dither=bayer:diff_mode=rectangle" \
  -gifflags -transdiff -y timelapse.gif
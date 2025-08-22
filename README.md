# Wplace Downloader

Simple tool to download specified canvas from [wplace.live](https://wplace.live).

Example output from src/index.ts:
![Example output](./example.png)

You can modify example index.ts file to download different canvas.

Simple API:

```ts
// Types
export type Chunk = { col: number; row: number };
export type ChunkResult = { chunk: Chunk; blob: Blob | undefined };

// Class (see `src/lib/WPlace.ts`)
export class WPlace {
    constructor(forceDownload?: boolean);

    // Build URL of a single tile
    getChunkUrl(chunk: Chunk): string;

    // Fetch a single tile (uses ./cache unless forceDownload=true)
    fetchChunk(
        chunk: Chunk
    ): Promise<
        { cached: true; image: Blob } | { cached: false; image: Blob | undefined }
    >;

    // Fetch multiple tiles
    fetchChunks(chunks: Chunk[]): Promise<(Blob | undefined)[]>;

    // Fetch tiles in an inclusive [start..end] grid
    fetchChunksInRange(start: Chunk, end: Chunk): Promise<ChunkResult[]>;

    // Compose fetched tiles into a single Sharp image (PNG by default)
    // Returns a Sharp instance (use .toFile, .toBuffer, ...)
    constructImage(results: ChunkResult[]): Promise<import('sharp').Sharp>;
}

// Notes
// - Each tile is 1000x1000 px; output size scales with selected grid.
// - Tiles are cached under ./cache as <col>_<row>.png.
// - Passing forceDownload=true forces re-download, ignoring cache.
```

Example:

```ts
import { WPlace } from './src/lib/WPlace';

async function main() {
    // Create client (uses cache by default)
    const w = new WPlace(/* forceDownload? = */ false);

    // Choose an inclusive range of tiles (columns and rows)
    const start = { col: 1126, row: 664 };
    const end = { col: 1129, row: 697 };

    // 1) Fetch tiles
    const results = await w.fetchChunksInRange(start, end);

    // 2) Compose into a single image using sharp
    const image = await w.constructImage(results);

    // 3) Save as PNG
    await image.toFile('output.png');
}

main().catch(console.error);
```

If you want to find the chunk coordinates, open DevTools in browser, when on wplace.live and look into network tab, here you have an example request to https://backend.wplace.live/files/s0/tiles/COLUMN/ROW.png Look into the preview of image, to see if its the right chunk you want. By this way you can find the coordinates of the chunks you want to download.

## Installation

```bash
git clone https://github.com/patrick115/WPlaceDownloader.git
cd WPlaceDownloader
npm install
```

## Usage

Modify `index.ts` to select the desired canvas area, then run:

```bash
npm run dev
```

## Or by building and running the compiled code

```bash
npm run build
npm start
```

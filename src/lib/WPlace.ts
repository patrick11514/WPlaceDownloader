import fs from 'fs/promises';
import sharp from 'sharp';
import Logger from './logger';
import { asyncExists } from './pollyfil';

export type Chunk = {
    row: number;
    col: number;
};

type Image = Blob | undefined;

type FetchResult =
    | {
          cached: true;
          image: Blob;
      }
    | {
          cached: false;
          image: Image;
      };

type ChunkResult = {
    chunk: Chunk;
    blob: Image;
};

export class WPlace {
    private static BACKEND_URL = 'https://backend.wplace.live';
    private static IMAGE_SIZE = 1000;
    private static CACHE_DIR = './cache';
    private l: Logger;

    constructor(private forceDownload = false) {
        this.l = new Logger('WPlace', 'magenta');
    }

    getChunkUrl(chunk: Chunk) {
        return `${WPlace.BACKEND_URL}/files/s0/tiles/${chunk.col}/${chunk.row}.png`;
    }

    async fetchChunk(chunk: Chunk) {
        const url = this.getChunkUrl(chunk);
        if (
            !this.forceDownload &&
            (await asyncExists(`${WPlace.CACHE_DIR}/${chunk.col}_${chunk.row}.png`))
        ) {
            this.l.log(`Chunk ${chunk.col},${chunk.row} found in cache.`);
            const buffer = await fs.readFile(
                `${WPlace.CACHE_DIR}/${chunk.col}_${chunk.row}.png`
            );
            const blob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });
            return {
                cached: true,
                image: blob
            } as FetchResult;
        }

        this.l.start(`Fetching chunk ${chunk.col},${chunk.row} from ${url}`);

        for (let attempt = 0; attempt < 10; attempt++) {
            try {
                const timeout = new Promise<void>((resolve) => setTimeout(resolve, 5000));
                const response = fetch(url);
                const raced = await Promise.race([timeout, response]);
                if (raced === undefined) {
                    this.l.error(
                        `Timeout fetching chunk ${chunk.col},${chunk.row}, retrying... (${attempt + 1}/10)`
                    );
                    continue;
                }

                if (!raced.ok) {
                    this.l.error(
                        `Error fetching chunk ${chunk.col},${chunk.row}: ${raced.status} - ${raced.statusText}, retrying... (${attempt + 1}/10)`
                    );
                    if (raced.status === 429) {
                        //wait for rate limited
                        await new Promise((r) => setTimeout(r, 30000));
                    }
                    continue;
                }

                const blob = await raced.blob();

                this.l.stop(
                    `Fetched chunk ${chunk.col},${chunk.row} (${blob.size} bytes)`
                );

                if (!(await asyncExists(WPlace.CACHE_DIR))) {
                    await fs.mkdir(WPlace.CACHE_DIR);
                }
                await fs.writeFile(
                    `${WPlace.CACHE_DIR}/${chunk.col}_${chunk.row}.png`,
                    Buffer.from(await blob.arrayBuffer())
                );

                return {
                    cached: false,
                    image: blob
                } as FetchResult;
            } catch (error) {
                this.l.error(
                    `Error fetching chunk ${chunk.col},${chunk.row}: ${error}, retrying... (${attempt + 1}/10)`
                );
                continue;
            }
        }

        this.l.stopError(
            `Failed to fetch chunk ${chunk.col},${chunk.row} after 10 attempts`
        );

        return {
            cached: false,
            image: undefined
        } as FetchResult;
    }

    async fetchChunks(chunks: Chunk[]) {
        const results = [] as (Blob | undefined)[];

        this.l.start(`Fetching ${chunks.length} chunks...`);
        for (const chunk of chunks) {
            const fetched = await new WPlace(this.forceDownload).fetchChunk(chunk);
            results.push(fetched.image);
            //wait only if we didn't get it from cache
            if (!fetched.cached) await new Promise((r) => setTimeout(r, 500));
            this.l.log(`Progress: ${results.length}/${chunks.length}`);
        }
        this.l.stop(`Fetched ${results.length} chunks.`);

        return results;
    }

    async fetchChunksInRange(start: Chunk, end: Chunk) {
        const chunks: Chunk[] = [];
        for (let col = start.col; col <= end.col; col++) {
            for (let row = start.row; row <= end.row; row++) {
                chunks.push({ col, row });
            }
        }

        const fetched = await this.fetchChunks(chunks);

        return fetched.map(
            (blob, index) =>
                ({
                    chunk: chunks[index],
                    blob
                }) as ChunkResult
        );
    }

    async constructImage(results: ChunkResult[]) {
        const canvas = sharp({
            create: {
                width:
                    (Math.max(...results.map((r) => r.chunk.col)) -
                        Math.min(...results.map((r) => r.chunk.col)) +
                        1) *
                    WPlace.IMAGE_SIZE,
                height:
                    (Math.max(...results.map((r) => r.chunk.row)) -
                        Math.min(...results.map((r) => r.chunk.row)) +
                        1) *
                    WPlace.IMAGE_SIZE,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        }).png();

        const composites = (
            await results.asyncMap(async (result) => {
                if (!result.blob) {
                    return null;
                }
                const buffer = Buffer.from(await result.blob.arrayBuffer());
                return {
                    input: buffer,
                    top:
                        (result.chunk.row -
                            Math.min(...results.map((r) => r.chunk.row))) *
                        WPlace.IMAGE_SIZE,
                    left:
                        (result.chunk.col -
                            Math.min(...results.map((r) => r.chunk.col))) *
                        WPlace.IMAGE_SIZE
                };
            })
        ).filter((c) => c !== null) as sharp.OverlayOptions[];
        return canvas.composite(composites);
    }
}

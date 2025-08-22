import fs from 'fs/promises';
import { Chunk, WPlace } from './lib/WPlace';
import Logger from './lib/logger';
import './lib/pollyfil';

const wPlace = new WPlace(true);

const start = {
    col: 1126,
    row: 695
} satisfies Chunk;

const end = {
    col: 1129,
    row: 697
} satisfies Chunk;

(async () => {
    const FILE_NAME = 'output.png';

    const cwd = process.cwd();

    const l = new Logger('Main', 'cyan');
    l.start('Starting download...');
    const chunks = await wPlace.fetchChunksInRange(start, end);
    const image = await wPlace.constructImage(chunks);
    await fs.writeFile(FILE_NAME, await image.toBuffer());
    l.stop(`Download complete! ${cwd}/${FILE_NAME}`);
})();

import fs from 'fs/promises';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Predicate<$ReturnValue> = (
    value: any,
    index: number,
    array: any[]
) => Promise<$ReturnValue>;

Object.defineProperty(Array.prototype, 'asyncFind', {
    value: async function (predicate: Predicate<boolean>) {
        for (let i = 0; i < this.length; i++) {
            if (await predicate(this[i], i, this)) {
                return this[i];
            }
        }
        return undefined;
    },
    enumerable: false
});

Object.defineProperty(Array.prototype, 'asyncFindIndex', {
    value: async function (predicate: Predicate<boolean>) {
        for (let i = 0; i < this.length; i++) {
            if (await predicate(this[i], i, this)) {
                return i;
            }
        }
        return -1;
    },
    enumerable: false
});

Object.defineProperty(Array.prototype, 'asyncMap', {
    value: async function (callback: Predicate<unknown>) {
        const promises = [];
        for (let i = 0; i < this.length; i++) {
            promises.push(callback(this[i], i, this));
        }
        return await Promise.all(promises);
    },
    enumerable: false
});

export const asyncExists = async (path: string) => {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
};

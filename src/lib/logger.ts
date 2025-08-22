import clc from 'cli-color';
import fs from 'node:fs';
import path from 'node:path';
import strip from 'strip-color';

/* eslint-disable no-console */

type color =
    | 'blackBright'
    | 'redBright'
    | 'greenBright'
    | 'yellowBright'
    | 'blueBright'
    | 'magentaBright'
    | 'cyanBright'
    | 'whiteBright'
    | 'black'
    | 'red'
    | 'green'
    | 'yellow'
    | 'blue'
    | 'magenta'
    | 'cyan'
    | 'white';

class Logger {
    name: string;
    color: color;
    time: number = 0;
    static loggingDirectory = './logs';
    private sensitive: boolean;

    constructor(name: string, color: color = 'yellow', sensitive = false) {
        this.name = name;
        this.color = color;
        this.sensitive = sensitive;
    }

    getTime() {
        const date = new Date();

        //HH:MM:SS:MS
        const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
        const minutes =
            date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
        const seconds =
            date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
        const milliseconds =
            date.getMilliseconds() < 10
                ? `00${date.getMilliseconds()}`
                : date.getMilliseconds() < 100
                  ? `0${date.getMilliseconds()}`
                  : date.getMilliseconds();

        return `${hours}:${minutes}:${seconds}:${milliseconds}`;
    }

    log(message: unknown) {
        this.logToFile('INFO', message);
    }

    start(message: unknown) {
        this.time = Date.now();
        this.logToFile('INFO', message);
    }

    stop(message: unknown) {
        const ms = Date.now() - this.time;
        this.time = 0;

        this.logToFile('INFO', message, ms);
    }

    stopError(message: unknown) {
        const ms = Date.now() - this.time;
        this.time = 0;

        this.logToFile('ERROR', message, ms);
    }

    error(message: unknown) {
        this.logToFile('ERROR', message);
    }

    logToFile(type: 'INFO' | 'ERROR', data: unknown, ms?: number) {
        const textType = type == 'INFO' ? clc.blue('INFO') : clc.red('ERROR');
        const textColor = type == 'INFO' ? clc.white : clc.red;

        if (!fs.existsSync(Logger.loggingDirectory)) {
            fs.mkdirSync(Logger.loggingDirectory);
        }

        if (this.sensitive) {
            console.log(
                `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white('[')}${textType}${clc.white(
                    ']'
                )} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')}`,
                data,
                ms ? `${clc.white(`(${ms} ms)`)}` : ''
            );
        } else {
            const formattedMessage = `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white(
                '['
            )}${textType}${clc.white(']')} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')} ${textColor(data)} ${ms ? `${clc.white(`(${ms} ms)`)}` : ''}`;

            console.log(formattedMessage);

            //strip formatting of message and save it to file named by current date YYYY-MM-DD.log if date is only one digit add 0 in front and at the end console log the formatted message
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();

            //filename
            const filename = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}.log`;

            //strip formatting
            const message = strip(formattedMessage);

            //add it to new line of file
            fs.appendFileSync(
                path.join('./', Logger.loggingDirectory, filename),
                message + '\n'
            );
        }
    }
}

export default Logger;

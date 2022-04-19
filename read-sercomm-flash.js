import {autoDetect} from "@serialport/bindings-cpp";

import { SerialPortStream } from "@serialport/stream";

import fs from 'fs';

import fsPromises from 'fs/promises';

const binding = autoDetect();

// const list = await binding.list();
// console.log(list);

/** @type {import("@serialport/stream").OpenOptions} */
const opts = {
    binding,
    path: '/dev/tty.usbserial-0001',
    baudRate: 57600,
    autoOpen: true,
};



const ending = 'MT7621 #';

/**
 * @typedef ReadNandPageCb
 * @type {function}
 * @param {Error} err stream error
 * @param {Buffer} [buf] buffer with data
 */

/**
 * 
 * @param {SerialPortStream} uartStream stream from serial port
 * @param {number} offset offset
 * @param {ReadNandPageCb} cb 
 */
function readingNandPage (uartStream, offset) {
    let buf = Buffer.alloc(0);
    // let timeoutCb = () => cb(new Error('Timeout: end marker waiting'));
    // let closeTimer = setTimeout(timeoutCb, 1000);
    
    return new Promise((resolve, reject) => {
        /**
         * @param {Buffer} chunk chunk of data
         * @returns 
         */
        function read (chunk) {
            buf = Buffer.concat([buf, chunk]);
            // should not start with ending
            const output = buf.toString();
            
            // TODO: set timeout for transmission error?
            if (buf.indexOf(ending) === -1) {
                // clearTimeout(timeoutCb);
                // closeTimer = setTimeout(timeoutCb, 100);
                return;
            }

            if (buf.indexOf('Unknown command') >= 0) {
                // clearTimeout(timeoutCb);
                const err = new Error('Received `Unknown command`');
                err.buf = buf;
                reject(err);
                return;
            }

            // clearTimeout(timeoutCb);
            uartStream.off('data', read);

            resolve(buf);
            
        }

        uartStream.on('data', read);

        uartStream.write(`sc_nand r 0x${offset.toString(16)}\n`);

    });

}

/**
 * 
 * @param {Buffer} buf buffer
 * @param {number} pageSize page size
 */
function parsePage (buf) {
    const pageOutput = buf.toString();
    const lines = pageOutput.split(/[\r\n]+/);

    let parsed = Buffer.alloc(0);

    let pageOffset = -1;

    // console.log(lines);

    for (const line of lines) {
        if (pageOffset < 0) {
            const pageOffsetMatch = line.match(/^Nand Read Page[^\(]+\(0x([0-9a-f]+)/);
            if (pageOffsetMatch) {
                pageOffset = parseInt(pageOffsetMatch[1], 16);
                // console.log({pageOffset});
            }
        } else {

            if (line.match(/^OOB:/)) {
                break;
            }

            const hexMatch = line.match(/^0x([0-9a-f]+):((?:\s+[0-9a-f]{2}){16})/);
            if (hexMatch) {
                const lineOffset = pageOffset + parseInt(hexMatch[1], 16);
                const valuesFromHex = hexMatch[2].trim().split(/\s+/).map(v => parseInt(v, 16));

                parsed = Buffer.concat([parsed, Buffer.from(valuesFromHex)]);

                // console.log(lineOffset.toString(16), ':', valuesFromHex.map(v => v.toString(16)).join(' '));
            }
        }
    }

    return parsed;
}

const uartStream = new SerialPortStream(opts, async (err) => {
    if (err) {
        console.error(err);
        process.exit();
    }

    const partStart = 0x420000;
    const nextPart  = 0x420800;
    const pageSize  = 0x800;

    const writableStream = fs.createWriteStream(`dump/data-0x${partStart.toString(16)}`);

    for (let offset = partStart; offset < nextPart; offset += pageSize) {
        try {
            const buf = await readingNandPage(uartStream, offset);
            
            const parsed = parsePage(buf);

            writableStream.write(parsed);

            const dumpWritten = await fsPromises.writeFile(`dump/${'0x' + offset.toString(16)}.txt`, buf);

        } catch(err) {
            console.error(err);
            if (err.buf) console.error(err.buf.toString());
            return;
        }
    }

    writableStream.close();

    uartStream.close();

});

// const port = await binding.open(opts);


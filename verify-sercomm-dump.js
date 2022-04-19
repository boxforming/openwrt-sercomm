import fs from 'fs/promises';
import { parsePartitions, formatMacAddr, getCString } from './parsing.js';

const partMapPath = process.argv[2];

const partitionData = await fs.readFile(partMapPath);

showPartitions(partitionData);

const factoryPartPath = process.argv[3];

const factoryData = await fs.readFile(factoryPartPath);

showFactory(factoryData);

/**
 * 
 * @param {Buffer} partsData 
 * @returns 
 */
function showPartitions (partsData) {
    
    const partitions1 = parsePartitions(partsData);
    
    for (let part of partitions1) {
        console.log(`partition #${
            part.index.toString(16)
        } start: 0x${
            part.start.toString(16).padStart(7, '0')
        } length: 0x${
            part.size.toString(16).padStart(7, '0')
        }`);
    }
}


function showFactory (fileContents) {
    // calibration24        0000      1000        
    // calibration58        8000      1000        
    // mac                 21000      6           
    // CSN                 21010      c           
    // language ID         21040      4           
    // Domain ID           21050      4           
    // PCBASN              21060      c           
    // PIN                 21070      8           
    // SSID                21080      20          
    // Passphrase          210a0      40

    // 0x130 bytes have data, then 0xff
    const calibration24 = fileContents.slice(0, 0x1000);

    const calibration58 = fileContents.slice(0x8000, 0x8000 + 0x1000);
    // data block larger, 0x2200 bytes long, following 0x400 zero bytes
    // data between 0xA200 and 0xA600 should be zero
    // (0x2200 and 0x2600 in calibration58 buffer)

    const device = fileContents.slice(0x21000, 0x21000 + 0x100);

    console.log('LAN    MAC', formatMacAddr(device.slice(0, 6)));
    console.log('2.4GHz MAC', formatMacAddr(calibration24.slice(4, 10)));
    console.log('5.8GHz MAC', formatMacAddr(calibration58.slice(4, 10)));

    console.log('Vendor  ID', device.slice(0x60, 0x6c).toString());
    console.log('WiFi  SSID', getCString(device.slice(0x80, 0xA0)).toString());
    console.log('WiFi   PSK', getCString(device.slice(0xA0, 0x100)).toString());
}


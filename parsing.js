/**
 * 
 * @param {Buffer} partsData 
 * @returns 
 */
export function parsePartitions (partsData) {
    const magic = partsData.slice(0, 0x9);
    if (magic.toString() !== 'SCFLMAPOK') {
        console.log('Corrupt partition data');
        return;
    }

    const partitions = [];

    const base = 0x800;
    let partBuf = partsData.slice(base);
    let offset = 0;
    do {
        if (partBuf[0] === 0xff) break;
        const partNum   = partBuf.readUInt32LE(0);
        const partStart = partBuf.readUInt32LE(4);
        const partSize  = partBuf.readUInt32LE(8);
        
        partitions.push({
            index: partNum,
            start: partStart,
            size:  partSize,
        });

        partBuf = partBuf.slice(12);
        offset += 12;
    
    // because partition data can be corrupt
    } while (offset < 240);

    return partitions;
}

/**
 * Format MAC address as xx:xx:xx:xx:xx:xx
 * @param {Buffer} buf buffer containing MAC address
 * @returns {string}
 */
export function formatMacAddr (buf) {
    return [...buf].map(v => v.toString(16)).join(':');
}

/**
 * Find C String in buffer and return new slice with that string
 * @description no errors check!
 * @param {Buffer} buf buffer with C string (zero ended)
 * @returns {Buffer}
 */
export function getCString (buf) {
    return buf.slice(0, buf.indexOf(0));
}
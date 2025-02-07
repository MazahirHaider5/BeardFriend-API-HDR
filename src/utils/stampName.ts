require('dotenv').config();

function generateRandomStampName() {
    const stampChars = process.env.STAMP_CHARS ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'Stamp_';
    for (let i = 0; i < 6; i++) {
        result += stampChars.charAt(Math.floor(Math.random() * stampChars.length));
    }
    return result;
}
export default generateRandomStampName;
const crypto = require('crypto'); // Importera 'crypto'-modulen
const secret = crypto.randomBytes(64).toString('hex'); // Generera en slumpmässig hemlighet
console.log(secret); // Skriv ut hemligheten

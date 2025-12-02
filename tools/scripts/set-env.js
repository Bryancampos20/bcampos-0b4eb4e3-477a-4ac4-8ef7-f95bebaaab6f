const fs = require('fs');
require('dotenv').config({ path: '.env' });

const targetPath = './apps/dashboard/src/environments/environment.ts';

const envFile = `
export const environment = {
  production: false,
  apiUrl: "${process.env.API_URL || 'http://localhost:3000/api'}",
};
`;

fs.writeFileSync(targetPath, envFile);
console.log(`✅ environment.ts generado en ${targetPath}`);

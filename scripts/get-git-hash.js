// Script to get the current git hash and save it to a file
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Get the current git hash
  const gitHash = execSync('git rev-parse HEAD').toString().trim();
  
  // Create the content to be written to the file
  const content = `// This file is auto-generated. Do not edit.
export const GIT_HASH = '${gitHash}';
export const GIT_HASH_SHORT = '${gitHash.substring(0, 7)}';
`;

  // Write the content to a file
  const outputPath = path.resolve(__dirname, '../src/gitHash.ts');
  fs.writeFileSync(outputPath, content);

  console.log(`Git hash ${gitHash.substring(0, 7)} saved to ${outputPath}`);
} catch (error) {
  console.error('Error getting git hash:', error.message);
  
  // Create a fallback file if git command fails
  const content = `// This file is auto-generated. Do not edit.
export const GIT_HASH = 'unknown';
export const GIT_HASH_SHORT = 'unknown';
`;
  
  const outputPath = path.resolve(__dirname, '../src/gitHash.ts');
  fs.writeFileSync(outputPath, content);
  
  console.log('Created fallback git hash file');
}
import { depositToDAO } from '../src/blockchain/daoScripts';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function main() {
  try {
    console.log("Starting test deposit...");
    const res = await depositToDAO(105);
    console.log("Success:", res);
  } catch (err) {
    console.error("Failed:", err);
  }
}
main();

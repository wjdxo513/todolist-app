import bcrypt from 'bcrypt';
import { loadEnv } from '../config/env.js';

const dummyHash = bcrypt.hashSync('dummy-password', loadEnv().BCRYPT_COST);

export const hashPassword = (plain) => bcrypt.hash(plain, loadEnv().BCRYPT_COST);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// 없는 이메일도 bcrypt 비교 시간을 소비해 타이밍 차이를 없앤다(SP-04)
export async function verifyDummy(plain) {
  await bcrypt.compare(plain, dummyHash);
  return false;
}

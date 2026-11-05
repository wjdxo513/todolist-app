import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 프록시 없음: API는 VITE_API_BASE_URL로 CORS 직접 호출(PP-03, PP-12)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});

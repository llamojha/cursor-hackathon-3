import { defineConfig } from 'vite';

export default defineConfig({
  // onnxruntime-web ships large prebuilt wasm/jsep assets; don't pre-bundle.
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  server: {
    // WebGPU + getUserMedia need a secure context. localhost counts as secure,
    // but set these so LAN testing from a phone over https works if you proxy.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});

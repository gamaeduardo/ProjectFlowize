/**
 * Redireciona o binding nativo do compilador do Astro para a versão WASM.
 *
 * O binding nativo (`@astrojs/compiler-binding-linux-x64-gnu`) usa instruções
 * AVX2 e morre com SIGILL em CPUs antigas. A versão WASM funciona em qualquer
 * x64, ao custo de um build um pouco mais lento.
 *
 * Uso: NODE_OPTIONS="--import ./scripts/register-wasi.mjs" astro build
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@astrojs/compiler-binding') {
    return {
      url: new URL('./compiler-binding-wasi.mjs', import.meta.url).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}

import autoExternal from 'rollup-plugin-auto-external';
// import typescript from '@rollup/plugin-typescript';
import typescript from 'rollup-plugin-typescript2';
// import esbuild from 'rollup-plugin-esbuild';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import builtinModules from 'builtin-modules';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import path from 'path';
import glob from 'glob';

const outDir = 'dist';
const isProd = process.env.NODE_ENV === 'production';

function getOutputFile(file) {
  const f = path.basename(file, '.ts');
  const fout = `${f}.js`;
  let dir = outDir;
  if (file.includes('/services/')) {
    dir = path.join(dir, 'services');
  }
  return path.join(dir, fout);
}

function getConfig(file) {
  const resolveOptions = {
    mainFields: ['jsnext:main', 'es2020', 'es2018', 'es2017', 'es2015', 'module', 'main'],
    preferBuiltins: true,
    extensions: ['.ts', '.js', '.mjs', '.node'],
    modulesOnly: false,
    browser: false
  };
  return {
    input: file,
    treeshake: true,
    output: {
      sourcemap: !isProd,
      format: 'cjs',
      file: getOutputFile(file)
    },
    external: [...builtinModules],
    plugins: [
      json(),
      autoExternal({
        builtins: true,
        peerDependencies: true,
        dependencies: true
      }),
      nodeResolve(resolveOptions),
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            module: 'ESNext'
          }
        }
      }),
      commonjs(),
      // esbuild({
      //   include: /.ts$/,
      //   exclude: /node_modules/,
      //   target: 'esnext'
      // }),
      isProd && terser()
    ]
  };
}

export default () => {
  const files = glob.sync('src/services/**/*.service.ts');
  return [...files, 'moleculer.config.ts'].map(getConfig);
}

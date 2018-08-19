import babel from 'rollup-plugin-babel';

export default {
  input: 'src/Presto.js',
  output: {
    file: 'dist/presto.js',
    format: 'umd',
    name: 'Presto',
    sourcemap: true
  },
  watch: {},
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
};

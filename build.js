import { build } from "esbuild";
import path from "pathe";

const entryPoint = path.resolve(import.meta.dirname, "src", "index.ts");
const outdir = path.resolve(import.meta.dirname, "dist");

await build({
	entryPoints: [entryPoint],
	format: "esm",
	outdir,
	target: "es2022",
	sourcemap: false,
	minify: false,
	bundle: false,
	platform: "node",
	plugins: [
		{
			name: "aerofoil-build:ignore-node-imports",
			setup(build) {
				build.onResolve({ filter: /^node:/ }, (args) => ({
					path: args.path,
					external: true,
				}));
			},
		},
	],
});

const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
	entry: {
		'content' : "./src/content.ts",
		'popup' : "./src/popup.ts"
	},
	mode: "production",
	module: {
	rules: [
			{
				test: /\.tsx?$/,
				use: [
					{
					loader: "ts-loader",
					options: {
						compilerOptions: { noEmit: false },
					},
					},
				],
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	optimization: {
		minimize: false
	},
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "..", "extension"),
	},
	// devtool: 'source-map',
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: "public", to: path.resolve(__dirname, "..", "extension") }
			],
		}),
	]
};
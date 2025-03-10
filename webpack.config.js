const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    content: "./src/content.ts",
    background: "./src/background.ts",
    popup: "./src/popup.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/manifest.json", to: "." },
        { from: "src/popup.html", to: "." },
        { from: "src/style.css", to: "." },
      ],
    }),
  ],
  devtool: "inline-cheap-source-map"
};

import { fileURLToPath } from "url";
import path from "path";
import CopyPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ensure existing plugins are not overwritten
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, "node_modules/tinymce"),
            to: path.join(__dirname, "public/assets/libs/tinymce"),
          },
        ],
      })
    );

    // Add additional rule for handling .node files
    config.module.rules.push({
      test: /\.node$/,
      use: "raw-loader",
    });

    return config;
  },
};

export default nextConfig;

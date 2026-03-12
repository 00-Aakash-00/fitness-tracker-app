import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	async redirects() {
		return [
			{
				source: "/blog",
				destination: "https://www.iam360.ai/blog",
				permanent: true,
			},
		];
	},
};

export default nextConfig;

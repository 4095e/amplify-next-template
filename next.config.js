/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@aws-amplify/ui-react', '@aws-amplify/ui-react-core', 'react-hook-form'],
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig

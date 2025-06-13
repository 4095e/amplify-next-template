# AWS Amplify Gen2 with Next.js 15 - Complete Setup Guide

**Last Updated:** 2025-06-13  
**Next.js Version:** 15.3.3  
**Amplify Version:** Gen2  
**Author:** shuvam_4095e

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Why This Guide Exists](#-why-this-guide-exists)
3. [Prerequisites](#-prerequisites)
4. [Understanding the Architecture](#-understanding-the-architecture)
5. [Step-by-Step Setup](#-step-by-step-setup)
6. [Common Issues & Solutions](#-common-issues--solutions)
7. [Project Structure](#-project-structure)
8. [Key Configuration Files](#-key-configuration-files)
9. [Testing & Verification](#-testing--verification)
10. [Deployment](#-deployment)
11. [Troubleshooting](#-troubleshooting)
12. [Best Practices](#-best-practices)

---

## 🎯 Overview

This guide provides a complete walkthrough for setting up AWS Amplify Gen2 with Next.js 15, including authentication using Amplify UI React components. This combination creates a modern, scalable full-stack application with serverless backend capabilities.

### What You'll Build
- **Frontend**: Next.js 15 with App Router
- **Backend**: AWS Amplify Gen2 (serverless)
- **Database**: DynamoDB (via Amplify Data)
- **Authentication**: AWS Cognito (via Amplify Auth)
- **API**: GraphQL with real-time subscriptions

### Key Features
- ✅ Server-side rendering (SSR) support
- ✅ Real-time data synchronization
- ✅ Built-in authentication UI
- ✅ Type-safe database operations
- ✅ Serverless architecture
- ✅ Auto-scaling capabilities

---

## 🤔 Why This Guide Exists

### The Challenge
Setting up AWS Amplify Gen2 with Next.js 15 involves several compatibility challenges:

1. **Next.js 15 App Router**: Uses Server Components by default
2. **Amplify UI Components**: Are client-side only
3. **Module Resolution**: ES modules vs CommonJS conflicts
4. **SSR Compatibility**: Server vs client environment differences

### Common Errors You'll Encounter (And We'll Fix)
- `useForm is not exported from 'react-hook-form'`
- `metadata export from client component`
- `Invalid project directory provided`
- `Region is missing` AWS credential errors

### Our Solution Strategy
We'll use a **hybrid architecture** that combines:
- **Server Components** for SEO and performance
- **Client Components** for interactivity
- **Proper module configuration** for compatibility

---

## 📋 Prerequisites

### Required Software
```bash
# Check your versions
node --version    # Should be v18+ 
npm --version     # Should be 8+
```

### Required Accounts & Setup
1. **AWS Account** with admin permissions
2. **AWS CLI** configured (recommended)
3. **Basic knowledge** of React/Next.js

### Optional but Recommended
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

---

## 🏗 Understanding the Architecture

### Traditional vs Our Hybrid Approach

**❌ Traditional Approach (Doesn't Work with Next.js 15):**
```
Layout (Client) → Authenticator → Pages
```
*Problem: Client components can't export metadata*

**✅ Our Hybrid Approach (Works Perfectly):**
```
Layout (Server) → AuthProvider (Client) → Pages (Can be either)
```

### Why This Architecture Works

1. **Server Layout**: 
   - Handles metadata for SEO
   - Manages global styles
   - Provides performance benefits

2. **Client Wrapper**: 
   - Handles interactive components
   - Manages authentication state
   - Provides real-time data

3. **Flexible Pages**: 
   - Can be server or client components
   - Choose based on specific needs

---

## 🚀 Step-by-Step Setup

### Step 1: Project Initialization

```bash
# Create new Next.js project
npx create-next-app@latest amplify-next-template --typescript --tailwind --eslint --app

# Navigate to project
cd amplify-next-template
```

**Why we do this:**
- Gets us the latest Next.js 15 with App Router
- Includes TypeScript for type safety
- Sets up ESLint for code quality

### Step 2: Install Amplify Dependencies

```bash
# Install Amplify packages
npm install aws-amplify @aws-amplify/ui-react

# Install Amplify CLI tools
npm install -D @aws-amplify/backend-cli
```

**What each package does:**
- `aws-amplify`: Core Amplify library for API calls
- `@aws-amplify/ui-react`: Pre-built React components
- `@aws-amplify/backend-cli`: Development tools

### Step 3: Configure Next.js for Amplify

Create `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@aws-amplify/ui-react', 
    '@aws-amplify/ui-react-core', 
    'react-hook-form'
  ],
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig
```

**Why this configuration is necessary:**

1. **`transpilePackages`**: 
   - Forces Next.js to process these packages during build
   - Resolves ES module compatibility issues
   - Ensures server-side rendering works

2. **`esmExternals: 'loose'`**: 
   - Relaxes strict ES module handling
   - Allows mixed CommonJS/ES module usage
   - Prevents build-time errors

### Step 4: Set Up Amplify Backend

Create the backend configuration:

```bash
# Create amplify directory
mkdir amplify

# Create data schema
touch amplify/data/resource.ts
```

**Define your data schema** (`amplify/data/resource.ts`):

```typescript
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      isDone: a.boolean(),
    })
    .authorization((allow) => [allow.publicApiKey(), allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
```

**Why this schema design:**
- **`publicApiKey()`**: Allows unauthenticated access for testing
- **`owner()`**: Restricts data to authenticated users
- **Dual authorization**: Flexible access control

### Step 5: Create Authentication Wrapper

Create `components/AuthenticatorProvider.tsx`:

```typescript
"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

export default function AuthenticatorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Authenticator>
      {children}
    </Authenticator>
  );
}
```

**Why separate component:**
- **`"use client"`**: Marks this as a client component
- **Encapsulation**: Isolates client-side logic
- **Reusability**: Can be used in multiple layouts

### Step 6: Update Layout (Server Component)

Update `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthenticatorProvider from "@/components/AuthenticatorProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Amplify + Next.js 15",
  description: "AWS Amplify Gen2 with Next.js 15 App Router",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthenticatorProvider>
          {children}
        </AuthenticatorProvider>
      </body>
    </html>
  );
}
```

**Why this pattern works:**
- **Server Component**: Can export metadata
- **Client Wrapper**: Handles Amplify authentication
- **Clean Separation**: Server and client concerns separated

### Step 7: Create Main Application Page

Update `app/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  useEffect(() => {
    listTodos();
  }, []);

  function createTodo() {
    const content = window.prompt("Todo content");
    if (content) {
      client.models.Todo.create({
        content,
        isDone: false,
      });
    }
  }
  
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  function toggleTodo(id: string, currentIsDone: boolean) {
    client.models.Todo.update({
      id,
      isDone: !currentIsDone,
    });
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          {user?.signInDetails?.loginId}'s Todos
        </h1>
        
        <button 
          onClick={createTodo}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          + Add Todo
        </button>

        <ul className="space-y-2">
          {todos.map((todo) => (
            <li 
              key={todo.id} 
              className={`p-2 border rounded ${
                todo.isDone ? 'bg-gray-100 line-through' : 'bg-white'
              }`}
            >
              <span 
                onClick={() => toggleTodo(todo.id, todo.isDone || false)}
                className="cursor-pointer flex-1"
              >
                {todo.content} {todo.isDone ? '✓' : '○'}
              </span>
              <button 
                onClick={() => deleteTodo(todo.id)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        <button 
          onClick={signOut}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}
```

**Key features explained:**
- **`observeQuery()`**: Real-time data synchronization
- **`generateClient<Schema>()`**: Type-safe database operations
- **Authentication integration**: Uses Amplify auth state

### Step 8: Configure AWS Credentials

```bash
# Configure AWS profile
npx ampx configure profile

# Follow prompts to enter:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region (e.g., us-east-1)
```

**Why credentials are needed:**
- Deploy backend resources to AWS
- Create DynamoDB tables
- Set up Cognito authentication
- Configure API Gateway

### Step 9: Start Development Environment

**Terminal 1 - Start Amplify Sandbox:**
```bash
npx ampx sandbox

# Expected output:
# ✔ Backend synthesized
# ✔ Deployment completed
# AppSync API endpoint = https://...
# File written: amplify_outputs.json
```

**Terminal 2 - Start Next.js:**
```bash
npm run dev

# Expected output:
# ▲ Next.js 15.3.3
# Local: http://localhost:3000
```

**What happens during sandbox startup:**
1. **Backend Synthesis**: Converts your schema to CloudFormation
2. **Resource Deployment**: Creates AWS resources
3. **API Generation**: Sets up GraphQL endpoint
4. **Configuration Export**: Creates `amplify_outputs.json`

---

## 🚨 Common Issues & Solutions

### Issue 1: "useForm is not exported"

**Error Message:**
```
Attempted import error: 'useForm' is not exported from 'react-hook-form'
```

**Root Cause:** Server-side rendering trying to resolve client-side dependencies.

**Solution:** Already implemented in our setup:
- Client component wrapper with `"use client"`
- Proper Next.js configuration
- Module transpilation

### Issue 2: "metadata export from client component"

**Error Message:**
```
You are attempting to export "metadata" from a component marked with "use client"
```

**Root Cause:** Client components cannot export metadata in Next.js App Router.

**Solution:** Our hybrid architecture separates concerns:
- Server layout handles metadata
- Client wrapper handles authentication

### Issue 3: "Region is missing"

**Error Message:**
```
[InvalidCredentialError] Failed to load default AWS region
```

**Root Cause:** AWS credentials not configured.

**Solution:**
```bash
npx ampx configure profile
# Enter your AWS credentials and region
```

### Issue 4: Build/Runtime Errors

**Common Causes:**
- Missing `amplify_outputs.json`
- Incorrect file paths
- Module resolution issues

**Debugging Steps:**
```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install

# Restart Amplify sandbox
npx ampx sandbox

# Restart Next.js
npm run dev
```

---

## 📁 Project Structure

```
amplify-next-template/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout (Server Component)
│   ├── page.tsx                 # Home page (Client Component)
│   └── favicon.ico              # App icon
├── components/                   # React components
│   └── AuthenticatorProvider.tsx # Client auth wrapper
├── amplify/                      # Amplify backend config
│   ├── auth/                    # Authentication config
│   ├── data/                    # Database schema
│   │   └── resource.ts          # Data model definitions
│   └── backend.ts               # Backend entry point
├── amplify_outputs.json         # Generated by Amplify (don't edit)
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── tailwind.config.js           # Styling config
```

### File Responsibilities

| File | Purpose | Component Type |
|------|---------|----------------|
| `app/layout.tsx` | Root layout, metadata, global styles | Server |
| `app/page.tsx` | Main application logic | Client |
| `components/AuthenticatorProvider.tsx` | Authentication wrapper | Client |
| `amplify/data/resource.ts` | Database schema | Configuration |
| `next.config.js` | Build configuration | Configuration |

---

## ⚙️ Key Configuration Files

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile Amplify packages for compatibility
  transpilePackages: [
    '@aws-amplify/ui-react', 
    '@aws-amplify/ui-react-core', 
    'react-hook-form'
  ],
  // Relax ES module handling
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig
```

### amplify/backend.ts

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

defineBackend({
  auth,
  data,
});
```

### amplify/auth/resource.ts

```typescript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
```

---

## 🧪 Testing & Verification

### Step 1: Verify Backend is Running

```bash
# Check Amplify sandbox status
npx ampx sandbox

# Look for:
# ✔ Deployment completed
# AppSync API endpoint = https://...
```

### Step 2: Test Authentication Flow

1. **Open browser**: `http://localhost:3000`
2. **Sign up**: Create new account with email
3. **Verify email**: Check your email for verification code
4. **Sign in**: Use your credentials

### Step 3: Test Database Operations

1. **Create Todo**: Click "+ Add Todo"
2. **Toggle Todo**: Click on todo item to mark complete
3. **Delete Todo**: Click delete button
4. **Verify Real-time**: Open multiple browser tabs, changes should sync

### Step 4: Verify AWS Resources

```bash
# List created resources
aws dynamodb list-tables
aws cognito-idp list-user-pools
```

---

## 🚀 Deployment

### Development Deployment (Sandbox)

Already covered in setup - your sandbox is your development environment.

### Production Deployment

```bash
# Deploy to production
npx ampx deploy --branch main

# Deploy specific branch
npx ampx deploy --branch production
```

### CI/CD Pipeline

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS Amplify

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Deploy to Amplify
        run: npx ampx deploy --branch main
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## 🔧 Troubleshooting

### Debug Checklist

When something isn't working, check these in order:

1. **✅ AWS Credentials**
   ```bash
   aws configure list
   ```

2. **✅ Amplify Sandbox Running**
   ```bash
   # Should show deployment status
   npx ampx sandbox
   ```

3. **✅ amplify_outputs.json Exists**
   ```bash
   ls amplify_outputs.json
   ```

4. **✅ Next.js Development Server**
   ```bash
   npm run dev
   ```

5. **✅ Browser Console**
   - Open Developer Tools
   - Check for JavaScript errors
   - Look for network request failures

### Common Error Patterns

| Error Pattern | Likely Cause | Solution |
|---------------|--------------|----------|
| `Module not found` | Missing dependency | `npm install` |
| `useForm is not exported` | SSR/Module issue | Check `next.config.js` |
| `Region is missing` | AWS config | `npx ampx configure profile` |
| `Cannot read property of undefined` | Missing auth context | Check AuthenticatorProvider |
| `GraphQL error` | Backend not deployed | Restart `npx ampx sandbox` |

### Getting Help

1. **Check AWS Amplify Docs**: https://docs.amplify.aws/
2. **Next.js Documentation**: https://nextjs.org/docs
3. **GitHub Issues**: Search for similar problems
4. **AWS Support**: For account-specific issues

---

## 🎯 Best Practices

### Code Organization

```typescript
// ✅ Good: Separate client and server concerns
// app/layout.tsx (Server Component)
export const metadata = { title: "My App" };

// components/ClientWrapper.tsx (Client Component)  
"use client";
export default function ClientWrapper({ children }) {
  return <div>{children}</div>;
}
```

```typescript
// ❌ Bad: Mixing server and client
"use client";
export const metadata = { title: "My App" }; // Error!
```

### Security

```typescript
// ✅ Good: Proper authorization
.authorization((allow) => [
  allow.owner(), // Only data owner can access
  allow.groups(["admin"]) // Admin group access
])

// ❌ Bad: Too permissive
.authorization((allow) => [
  allow.publicApiKey() // Anyone can access
])
```

### Performance

```typescript
// ✅ Good: Use observeQuery for real-time data
client.models.Todo.observeQuery().subscribe({
  next: (data) => setTodos([...data.items]),
});

// ❌ Bad: Polling with regular queries
setInterval(() => {
  client.models.Todo.list().then(setTodos);
}, 1000);
```

### Error Handling

```typescript
// ✅ Good: Proper error handling
try {
  await client.models.Todo.create({ content });
} catch (error) {
  console.error('Failed to create todo:', error);
  setErrorMessage('Failed to create todo');
}

// ❌ Bad: No error handling
client.models.Todo.create({ content }); // May fail silently
```

---

## 📚 Additional Resources

### Documentation
- [AWS Amplify Gen2 Docs](https://docs.amplify.aws/gen2/)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Amplify UI React](https://ui.docs.amplify.aws/react)

### Examples
- [Amplify Gen2 Examples](https://github.com/aws-samples/amplify-next-template)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)

### Community
- [Amplify Discord](https://discord.gg/amplify)
- [Next.js Discussions](https://github.com/vercel/next.js/discussions)

---

## 🏁 Conclusion

You now have a fully functional AWS Amplify Gen2 application with Next.js 15! This setup provides:

- **🔐 Authentication**: Built-in user management
- **📊 Database**: Real-time data synchronization  
- **🚀 Scalability**: Serverless architecture
- **🔧 Developer Experience**: Type-safe operations
- **🎨 Modern UI**: Next.js 15 with App Router

### Next Steps

1. **Customize Authentication**: Add social logins, MFA
2. **Expand Data Model**: Add more complex relationships
3. **Add File Storage**: Implement image/file uploads
4. **Set Up Analytics**: Track user behavior
5. **Deploy to Production**: Use Amplify hosting

### Contributing

Found an issue or want to improve this guide? 
- Open an issue on GitHub
- Submit a pull request
- Share your experience

---

**Happy coding! 🎉**
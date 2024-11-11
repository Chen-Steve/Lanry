# Lanry

A modern web platform for reading translated light novels.

## Project Overview

Lanry is a platform where readers can:
- Read translated light novels for free
- Track their reading progress
- Get notifications for new chapter releases
- Discuss chapters with other readers
- Support translators through donations

## Technology Stack

- Frontend: Next.js with TypeScript
- Styling: Tailwind CSS
- Backend: Next.js API routes
- Database: PostgreSQL with Prisma ORM
- Authentication: Supabase Auth
- Content Delivery: Supabase Storage

## Features

### For Readers
- Clean, distraction-free reading interface
- Bookmark system to track reading progress
- Dark/Light mode for comfortable reading
- Mobile-responsive design
- Chapter comments and discussions
- Search functionality

### For Content Management
- Efficient chapter upload system
- Content scheduling capabilities
- Translation progress tracking
- Built-in markdown editor
- Image optimization for novel covers
- Automated backup system

## Development Roadmap

### Phase 1: Core Platform (Current)
1. ✅ Basic project structure
2. ✅ Database schema setup
3. 🏗️ Novel/Chapter management system
4. Authentication system

### Phase 2: Reading Experience
1. Reading interface
2. Progress tracking
3. Bookmarking system
4. Dark/Light mode

### Phase 3: Community Features
1. Comment system
2. User profiles
3. Reading lists
4. Chapter notifications

### Phase 4: Creator Tools
1. Translation dashboard
2. Markdown editor
3. Schedule manager
4. Analytics dashboard

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   DATABASE_URL="your-database-url"
   DIRECT_URL="your-direct-url"
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-key"
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Contributing

While this is primarily a personal project, bug reports and suggestions are welcome through GitHub issues.

## Legal Notice

All translations are either:
1. Original works translated with permission
2. Works in the public domain
3. Works translated under fair use guidelines

## License

This project's source code is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

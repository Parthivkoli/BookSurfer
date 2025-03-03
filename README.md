# BookSurfer - AI-Enhanced Reading Platform

BookSurfer is a modern web application that combines the joy of reading with AI-powered features to enhance the reading experience. The platform provides access to thousands of free books from multiple sources, along with AI-generated summaries, insights, and audio narration capabilities.

## Features

### 📚 Extensive Book Collection
- Integration with multiple free book sources:
  - Open Library
  - Project Gutenberg
  - Google Books (free books only)
- Thousands of books across various genres and languages

### 🔍 Advanced Search & Discovery
- Full-text search functionality
- Filter by genre, author, language
- Sort by relevance, title, publication date, and rating
- Category-based browsing

### 📖 Reader Experience
- Clean, distraction-free reading interface
- Adjustable font size and reading modes (light, dark, sepia)
- Progress tracking
- Bookmarking capability

### 🤖 AI-Powered Features
- Book summaries and chapter insights
- Context-aware Q&A about book content
- Reading recommendations based on preferences
- Text-to-speech narration

### 👤 User Features
- Personal library management
- Reading history and statistics
- Customizable reading preferences
- Cross-device synchronization

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **UI Components**: Tailwind CSS, shadcn/ui
- **State Management**: React Hooks
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Parthivkoli/BookSurfer.git
   cd booksurfer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
booksurfer/
├── app/                  # Next.js app directory
│   ├── discover/         # Book discovery page
│   ├── library/          # User's library page
│   ├── reader/           # Book reader page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Homepage
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── main-nav.tsx      # Main navigation component
│   └── theme-*.tsx       # Theme-related components
├── lib/                  # Utility functions and API clients
│   ├── api/              # API integration
│   └── utils.ts          # Helper functions
├── types/                # TypeScript type definitions
├── public/               # Static assets
└── ...                   # Configuration files
```

## API Integration

BookSurfer integrates with the following APIs:

1. **Open Library API** - For accessing a vast collection of books and metadata
2. **Project Gutenberg API** - For public domain books
3. **Google Books API** - For additional book information and previews

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Open Library](https://openlibrary.org/) for their extensive book database
- [Project Gutenberg](https://www.gutenberg.org/) for providing free ebooks
- [Google Books](https://books.google.com/) for their book information API
- All the open-source libraries and tools that made this project possible
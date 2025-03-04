# BookSurfer📚 🌊  - Your AI-Enhanced Reading Adventure 🤖 

Welcome to **BookSurfer🌊**, a cutting-edge web platform created by **Parthiv Koli** to revolutionize your reading experience!  

BookSurfer blends the timeless joy of reading with powerful AI features, providing access to thousands of free books from diverse open-source libraries, along with AI-generated summaries, insightful Q&A, immersive audio narration, and enhanced readability options. Whether you're a bookworm, a researcher, or a casual reader, **BookSurfer** is your gateway to a smarter, more engaging reading journey.  

---

## ✨ Key Features  

### 📚 Vast Book Collection  
Dive into a treasure trove of free books from multiple open-source libraries:  
- **Open Library**: Access millions of book metadata and full texts.  
- **Project Gutenberg**: Explore thousands of public domain classics.  
- **Google Books (Free)**: Discover additional free books and previews.  
- Books span genres like fiction, non-fiction, science, history, and more, available in various languages.  

### 🔍 Smart Search & Discovery  
- **Full-Text Search**: Find books by title, author, or keyword effortlessly.  
- **Advanced Filters**: Narrow results by genre, author, language, and source.  
- **Sorting Options**: Organize by relevance, title, publication date, or rating.  
- **Category Browsing**: Explore curated categories for a personalized experience.  

### 📖 Immersive Reader Experience  
- **Distraction-Free Interface**: Clean, focused reading environment.  
- **Customizable Settings**: Adjust font size, themes (light, dark, sepia), and more.  
- **Progress Tracking & Bookmarking**: Save and track your reading seamlessly.  
- **Text-to-Speech (TTS)**: High-quality AI narration with word highlighting.  

### 🤖 AI-Powered Magic  
- **AI Summaries**: Get concise, intelligent summaries of chapters or entire books.  
- **Context-Aware Q&A**: Ask questions and receive AI-driven answers.  
- **Reading Recommendations**: Discover new books based on your interests.  

### 👤 Personalized User Features  
- **Personal Library**: Manage your books, notes, and highlights.  
- **Reading History & Stats**: Track your reading habits.  
- **Cross-Device Sync**: Access your library across all devices.  

---
# Screenshots
![BookSurfer Homepage](https://github.com/Parthivkoli/BookSurfer/blob/e16c67fb7e7b632b5a026ed521d3b9a97bcb7262/public/screenshots/homepage.gif) 

## 🚀 Getting Started  

### Prerequisites  
- **Node.js**: Version 18.x or higher  
- **Package Manager**: npm or Yarn  

### Installation  

Clone the repository:  
```bash
git clone https://github.com/Parthivkoli/BookSurfer.git
cd BookSurfer
```

Install dependencies:  
```bash
npm install  # or yarn install
```

Run the development server:  
```bash
npm run dev  # or yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore **BookSurfer**!  

---

## 🛠️ Project Structure  
```
BookSurfer/
├── app/                  # Next.js app directory
│   ├── discover/         # Book discovery and search page
│   ├── library/          # User’s personal library page
│   ├── reader/           # Interactive book reader page
│   ├── globals.css       # Global styles with Tailwind CSS
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Homepage
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui components (e.g., buttons, menus)
│   ├── main-nav.tsx      # Main navigation bar
│   └── theme-*.tsx       # Theme-related components (toggle, provider)
├── lib/                  # Utility functions and API clients
│   ├── api/              # API integrations (Open Library, Gutenberg, etc.)
│   └── utils.ts          # Helper functions (e.g., AI summarization)
├── types/                # TypeScript type definitions for books and data
├── public/               # Static assets (logos, screenshots)
│   └── screenshots/      # Screenshots for README
└── ...                   # Configuration files (e.g., package.json, .gitignore)
```

---

## 🌐 API Integration  
**BookSurfer** leverages powerful open-source APIs to provide a vast book collection:  
- **Open Library API** - Metadata and full texts for millions of books.  
- **Project Gutenberg API** - Free access to public domain classics.  
- **Google Books API** - Additional free book previews and information.  
- **Research & Light Novel APIs** - Includes arXiv, CORE, Semantic Scholar, LNMTL, Royal Road, and Webnovel.  

---

## 🤝 Contributing  
We’d love your help in making **BookSurfer** even better! Here’s how you can contribute:  

1. **Fork the Repository**: Click the “Fork” button on GitHub.  
2. **Create a Feature Branch**:  
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make Your Changes**: Update code, add features, or fix bugs.  
4. **Commit Your Changes**:  
   ```bash
   git commit -m "Add some amazing feature"
   ```
5. **Push to Your Branch**:  
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**: Submit your changes for review on GitHub.  

Feel free to reach out via **GitHub Issues** or email (**parthivkoli69@gmail.com**) with questions or ideas!  

---

## 📜 License  
**BookSurfer** is licensed under the **MIT License** – see the `LICENSE` file for details. This open-source project is my passion, and I’m excited to share it with the community!  

---

## 🙏 Acknowledgments  
A big thank you to the following for making **BookSurfer** possible:  
- **Open Library** for their incredible book database.  
- **Project Gutenberg** for free access to literary classics.  
- **Google Books** for additional book insights.  
- The open-source community, including contributors to **Next.js, Tailwind CSS, shadcn/ui, and framer-motion**.  
- Special thanks to my **friends and family** for their support and inspiration—I couldn’t have built this without you!  

Happy Reading! and Happy Surfing 🌊📖🚀  
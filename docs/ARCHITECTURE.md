# Architecture Overview - BookSurfer

## Project Structure

```
BookSurfer/
├── app/                           # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                # NextAuth routes
│   │   └── health/              # Health check endpoint
│   ├── (routes)/                # Main app pages
│   │   ├── library/             # Book library page
│   │   ├── reader/              # Book reader page
│   │   ├── profile/             # User profile
│   │   └── [others]/            # Other pages
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage
│   └── globals.css              # Global styles
│
├── components/                   # React Components
│   ├── ui/                      # shadcn/ui components
│   ├── ChatBot.tsx              # AI chatbot interface
│   ├── ChatBotToggle.tsx        # Chatbot widget
│   ├── providers.tsx            # Context providers
│   └── [others]/               # Other components
│
├── hooks/                        # Custom React Hooks
│   └── use-toast.ts            # Toast notifications
│
├── lib/                          # Utilities & Services
│   ├── api/                    # External API integrations
│   │   ├── ai.ts              # AI/NLP functions
│   │   ├── arxiv.ts           # ArXiv API
│   │   └── [others]/          # Other APIs
│   ├── auth.ts                 # NextAuth configuration
│   ├── env.ts                  # Environment validation
│   └── utils.ts               # Helper functions
│
├── types/                        # TypeScript Type Definitions
│   └── [types]/               # Shared types
│
├── public/                       # Static Assets
│   ├── favicon.png
│   └── [images]/
│
├── tests/                        # Test Files
│   └── [test-files]/
│
├── docs/                         # Documentation
│   ├── ENVIRONMENT.md
│   ├── DEPLOYMENT.md
│   └── [other-docs]/
│
├── .env.example                  # Environment template
├── .eslintrc.json               # ESLint config
├── next.config.js               # Next.js config
├── tsconfig.json                # TypeScript config
├── tailwind.config.ts           # Tailwind CSS config
└── package.json                 # Dependencies
```

## Key Technologies

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **Icons:** Lucide React

### Backend
- **API:** Next.js API Routes
- **Authentication:** NextAuth.js
- **Database:** (Configured via NextAuth)
- **ORM:** (Not currently used, consider Prisma)

### Development
- **Language:** TypeScript
- **Linting:** ESLint
- **Formatting:** Prettier (via ESLint)
- **Testing:** Jest + React Testing Library
- **Package Manager:** npm

### Deployment
- **Hosting:** Vercel (recommended)
- **CI/CD:** GitHub Actions
- **Containerization:** Docker

## Data Flow

### User Authentication
```
User → Login Page → NextAuth Provider → OAuth (Google/GitHub) → Session Created
```

### Reading Books
```
Library Page → Select Book → Reader Component → Render (EPUB/PDF/Text)
```

### AI Features
```
User Query → ChatBot → AI Service (lib/api/ai.ts) → LLM/NLP Processing → Response
```

## Key Features

1. **Book Library**
   - Browse 10,000+ free books
   - Search and filter
   - Track reading progress

2. **Reader**
   - Support for EPUB, PDF, and text formats
   - Adjustable fonts/themes
   - Bookmarks and highlights

3. **AI Assistant**
   - Draggable chat widget
   - Question answering about books
   - Reading recommendations

4. **User Authentication**
   - OAuth with Google/GitHub
   - User profiles
   - Progress tracking

## Component Hierarchy

```
RootLayout
├── Providers
│   ├── SessionProvider (NextAuth)
│   ├── ThemeProvider
│   └── UserAuthProvider
│       └── Toaster
└── App Routes
    ├── Header/Navigation
    ├── Page Content
    └── ChatBotToggle
```

## API Routes Structure

```
/api/
├── auth/[...nextauth]     # NextAuth magical catch-all
└── health               # Health check
```

## State Management

Currently using:
- **React Context** for authentication (UserAuthProvider)
- **NextAuth Session** for user data
- **React Hooks** (useState, useEffect) for component state

Consider adding:
- **Redux** or **Zustand** for complex state
- **React Query** for server state caching

## Performance Considerations

1. **Bundle Size:** ~84.2 kB (shared JS)
2. **Image Optimization:** Currently unoptimized
3. **Code Splitting:** Can be improved
4. **Caching:** Limited, should implement ISR

## Error Handling

- **Error Boundary:** New error.tsx in app/
- **API Errors:** lib/api functions should validate
- **User Feedback:** Sonner for toast notifications

## Security

- **Headers:** Content-Security-Policy, X-Frame-Options, etc.
- **Authentication:** NextAuth secure sessions
- **Environment:** Variables validated with Zod
- **Input:** Should validate with Zod schemas

## Future Improvements

1. **Database Integration:** Prisma + PostgreSQL
2. **Real-time Features:** WebSockets for collaboration
3. **Social Features:** Sharing, recommendations
4. **Advanced Analytics:** User behavior tracking
5. **Mobile App:** React Native version
6. **Accessibility:** WCAG 2.1 AA compliance

---

See [IMPROVEMENT_ANALYSIS.md](../IMPROVEMENT_ANALYSIS.md) for detailed improvement suggestions.

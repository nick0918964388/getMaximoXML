# Maximo XML Generator - Web App

A Next.js web application for visually creating and editing Maximo Presentation XML.

## Features

- Visual field editor with drag-and-drop support
- Real-time XML preview
- Dialog template editor with header fields and detail tables
- Project save/load with IndexedDB storage
- Chinese-to-English field name translation
- Copy fields between tabs
- Download XML and SQL files

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test           # Watch mode
npm run test:run   # Single run
```

## Build

```bash
npm run build
npm start
```

## Tech Stack

- Next.js 14.2.35
- React 18
- shadcn/ui (Radix UI + Tailwind CSS)
- Lucide React icons
- React Hook Form + Zod
- sql.js (IndexedDB storage)
- Vitest + Testing Library

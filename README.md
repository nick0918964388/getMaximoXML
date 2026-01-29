# Maximo XML Generator

A tool for generating IBM Maximo Presentation XML from field definitions. Includes both a TypeScript library and a web-based visual editor.

## Features

- **Visual Field Editor** - Define fields with full support for Maximo field types (textbox, checkbox, tablecol, multiparttextbox, etc.)
- **XML Generation** - Generate complete Maximo Presentation XML with list tabs, form tabs, and dialogs
- **SQL Generation** - Auto-generate SQL scripts for MAXATTRIBUTE definitions
- **Dialog Template Editor** - Create and manage dialog templates with header fields and detail tables
- **Chinese Label Translation** - Auto-translate Chinese labels to English field names
- **Project Management** - Save and load projects with browser storage (IndexedDB)
- **Copy Field Between Tabs** - Quickly duplicate field definitions across tabs

## Tech Stack

- **Core Library**: TypeScript (ES2022)
- **Web App**: Next.js 14.2.35 + React 18
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Icons**: Lucide React
- **Testing**: Vitest
- **Deployment**: PM2

## Project Structure

```
genMaximoXML/
├── src/                    # Core TypeScript library
│   ├── generators/         # XML element generators
│   ├── assemblers/         # Tab and application assemblers
│   ├── parsers/            # SA document parser
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── web/                    # Next.js web application
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Library code (generators, storage)
│   │   └── hooks/          # Custom React hooks
│   └── tests/              # Web app tests
├── deploy.sh               # Deployment script
└── ecosystem.config.cjs    # PM2 configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install core library dependencies
npm install

# Install web app dependencies
cd web && npm install
```

### Development

```bash
# Run web app in development mode
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
# Test core library
npm test

# Test web app
cd web
npm test
```

### Production Deployment

```bash
# Run the deployment script
./deploy.sh
```

The application will be available at `http://localhost:3002`.

## Usage

1. **Configure Application Metadata** - Set application ID, MBO name, key attribute, etc.
2. **Define Fields** - Add fields with properties like type, input mode, lookup, and relationship
3. **Organize by Tabs** - Group fields into tabs (List, Header, Detail areas)
4. **Configure Detail Tables** - Set up detail table relationships and bean classes
5. **Create Dialogs** - Design dialog templates with their own fields
6. **Generate XML** - Download the complete Maximo Presentation XML
7. **Generate SQL** - Download SQL scripts for database attribute definitions

## Supported Field Types

| Type | Description |
|------|-------------|
| textbox | Standard text input |
| checkbox | Boolean checkbox (YORN) |
| tablecol | Table column |
| multiparttextbox | Two-part textbox (code + description) |
| multilinetextbox | Multi-line text area |
| statictext | Read-only text display |
| pushbutton | Button element |
| attachments | Attachment field |

## Supported Data Types

ALN, UPPER, LOWER, INTEGER, SMALLINT, DECIMAL, FLOAT, DATE, DATETIME, TIME, YORN, CLOB, LONGALN, GL

## License

ISC

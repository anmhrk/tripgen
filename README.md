# TripGen

an app that allows users to create detailed and personalized itineraries for their trips using AI. easily iterate and get suggestions by chatting with the AI. itineraries are created in a spreadsheet and can be shared with others.

## tech stack

- nextjs 15 app router
- trpc/react-query
- shadcn/ui + tailwindcss
- nextauth
- vercel ai sdk + openai api for tools and llm
- neon postgres + drizzle orm
- react-data-grid, papaparse for handling csv and spreadsheets

## how to run locally

1. clone the repo

```bash
git clone https://github.com/anmhrk/tripgen.git
cd tripgen
```

2. copy .env.example file to .env and set the env variables

```bash
cp .env.example .env
```

3. install dependencies

```bash
bun install
```

4. start development server

```bash
bun dev
```

5. go to http://localhost:3000 and see the app live in your browser

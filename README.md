# TripGen

an app that allows users to create detailed and personalized itineraries for their trips using AI. easily iterate and get suggestions by chatting with the AI. itineraries are created as a spreadsheet and trips can be shared with others.

## tech stack

- nextjs 15 app router
- trpc/react-query
- shadcn/ui + tailwindcss
- nextauth
- vercel ai sdk + openai api for tools and llm
- tavily api for websearch
- neon postgres + drizzle orm
- react-data-grid, papaparse for handling csv and spreadsheets

## how to run locally

1. clone the repo

```
git clone https://github.com/anmhrk/tripgen.git
cd tripgen
```

2. copy .env.example file to .env and set the env variables

```
cp .env.example .env
```

3. install dependencies

```
bun install
```

4. start development server

```
bun dev
```

5. navigate to http://localhost:3000 in your browser and see the app live

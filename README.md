# TripGen

an app that allows users to create detailed and personalized itineraries for their trips using AI. easily iterate and get suggestions by chatting with the AI. itineraries are created as a spreadsheet and trips can be shared with others.

## tech stack

- [nextjs 15 app router](https://nextjs.org)
- [trpc](https://trpc.io)
- [shadcn/ui](https://ui.shadcn.com/) + [tailwindcss](https://tailwindcss.com/)
- [nextauth](https://authjs.dev/)
- [vercel ai sdk](https://sdk.vercel.ai/) + [openai api](https://platform.openai.com/docs/overview) for tools and llm
- [tavily api](https://tavily.com) for websearch
- [neon postgres](https://neon.tech/) + [drizzle orm](https://orm.drizzle.team/)
- [react-data-grid](https://github.com/adazzle/react-data-grid) + [papaparse](https://www.papaparse.com/) for handling csv and spreadsheets

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

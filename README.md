# Rasikh

Rasikh is an early-stage hackathon concept for making an employer-led move to Abu Dhabi easier and quicker. The proposed product would help an employer and a new hire coordinate the steps for employment and residence, housing, banking, family needs, and, when relevant, setting up a company. Landlords and banks are proposed participants in the same workflow. Its effect on elapsed time and effort still needs to be tested.

## Hackathon materials

1. [Problem evidence](docs/problem-evidence.md): Abu Dhabi and UAE proof, counterevidence, source limits and open questions
2. [Fact check](docs/fact-check.md): stage-safe process claims and sources
3. [Validation interviews](docs/validation-interviews.md): three short scripts and an evidence template
4. [Market and competitors](docs/market-and-competitors.md): published counts, calculation limits and alternatives
5. [Three-minute pitch](docs/pitch-script.md): spoken script and exact demo cues
6. [Deck outline](docs/deck-outline.md): nine visual slides
7. [Judge Q&A](docs/judge-qa.md): fifteen difficult questions and honest answers
8. [Demo rehearsal](docs/demo-rehearsal.md): timing, roles and failure switches

## Status

The local homepage is an interactive relocation dashboard. Visitors can choose a sample route for a new hire, a family move, or a team; check off steps and checklist items; add their own steps and notes; track document names; and save Abu Dhabi places. These changes persist in this browser on this device. The photo-led introduction is available at `/welcome`. The sample journeys do not submit applications, upload files, or read live status. Separate mock TAMM MCP and Rasikh Guard services exist under `packages`, but the website does not connect to them. Real government and partner actions and a production integration remain proposed. The Abu Dhabi imagery is generated and illustrative.

## Local preview

Run `npm install` if dependencies are not already installed, then `npm run dev` and open [http://127.0.0.1:3000](http://127.0.0.1:3000). Use the dashboard to explore and edit a sample plan. Open [http://127.0.0.1:3000/welcome](http://127.0.0.1:3000/welcome) for the visual introduction.

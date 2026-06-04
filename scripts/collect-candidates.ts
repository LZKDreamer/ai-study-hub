import { collectCandidates } from "./content-sources";

async function main() {
  const { candidates, failures } = await collectCandidates();

  console.log(
    JSON.stringify(
      {
        candidateCount: candidates.length,
        failures,
        topCandidates: candidates.slice(0, 10).map((candidate) => ({
          source: candidate.source,
          title: candidate.title,
          url: candidate.url,
          publishedAt: candidate.publishedAt,
          tags: candidate.tags
        }))
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

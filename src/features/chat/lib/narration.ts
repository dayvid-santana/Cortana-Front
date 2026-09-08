/**
 * The API returns structured sources for the citation chips, but some providers
 * also append a conventional reference section to the prose. That section is
 * useful on screen and noisy in speech, so omit it from card narration.
 */
const REFERENCES_SECTION =
  /\n\s*\n(?:#{1,6}\s*)?(?:fontes|referências|referencias|sources)\s*:\s*[\s\S]*$/i;

export function cardNarrationText(content: string): string {
  return content.replace(REFERENCES_SECTION, "").trim();
}

export const PLANTUML_THEME_NONE = "__none__";

export const PLANTUML_THEMES = [
  PLANTUML_THEME_NONE,
  "amiga",
  "aws-orange",
  "black-knight",
  "bluegray",
  "blueprint",
  "carbon-gray",
  "cerulean",
  "cerulean-outline",
  "cloudscape-design",
  "crt-amber",
  "crt-green",
  "cyborg",
  "cyborg-outline",
  "hacker",
  "lightgray",
  "mars",
  "materia",
  "materia-outline",
  "metal",
  "mimeograph",
  "minty",
  "mono",
  "plain",
  "reddress-darkblue",
  "reddress-darkgreen",
  "reddress-darkorange",
  "reddress-darkred",
  "reddress-lightblue",
  "reddress-lightgreen",
  "reddress-lightorange",
  "reddress-lightred",
  "sandstone",
  "silver",
  "sketchy",
  "sketchy-outline",
  "spacelab",
  "spacelab-white",
  "sunlust",
  "superhero",
  "superhero-outline",
  "toy",
  "united",
  "vibrant",
] as const;

export type PlantUmlTheme = (typeof PLANTUML_THEMES)[number];

const plantUmlStartPattern = /^\s*@startuml\b/i;
const plantUmlThemePattern = /^\s*!theme\b.*$/i;
const plantUmlThemeValuePattern = /^\s*!theme\s+([a-z0-9_-]+)\s*$/i;

export function getPlantUmlThemeFromSource(source: string): PlantUmlTheme {
  const themeLine = source
    .split(/\r\n|\r|\n/)
    .find((line) => plantUmlThemeValuePattern.test(line));
  const theme = themeLine?.match(plantUmlThemeValuePattern)?.[1].toLowerCase();

  return isPlantUmlTheme(theme) ? theme : PLANTUML_THEME_NONE;
}

export function applyPlantUmlTheme(
  source: string,
  theme: PlantUmlTheme,
): string {
  const lineBreak = source.match(/\r\n|\r|\n/)?.[0] ?? "\n";
  const lines = source.length > 0 ? source.split(/\r\n|\r|\n/) : [""];
  const linesWithoutThemes = lines.filter(
    (line) => !plantUmlThemePattern.test(line),
  );

  if (theme === PLANTUML_THEME_NONE) {
    return linesWithoutThemes.join(lineBreak);
  }

  const startIndex = linesWithoutThemes.findIndex((line) =>
    plantUmlStartPattern.test(line),
  );
  const insertIndex = startIndex >= 0 ? startIndex + 1 : 0;

  linesWithoutThemes.splice(insertIndex, 0, `!theme ${theme}`);

  return linesWithoutThemes.join(lineBreak);
}

function isPlantUmlTheme(theme: string | undefined): theme is PlantUmlTheme {
  return Boolean(
    theme && PLANTUML_THEMES.includes(theme.toLowerCase() as PlantUmlTheme),
  );
}

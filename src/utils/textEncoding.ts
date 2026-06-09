import { EmbedBuilder } from 'discord.js';

const WINDOWS_1252_BYTES = new Map<number, number>([
  [0x20AC, 0x80],
  [0x201A, 0x82],
  [0x0192, 0x83],
  [0x201E, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02C6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8A],
  [0x2039, 0x8B],
  [0x0152, 0x8C],
  [0x017D, 0x8E],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201C, 0x93],
  [0x201D, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02DC, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9A],
  [0x203A, 0x9B],
  [0x0153, 0x9C],
  [0x017E, 0x9E],
  [0x0178, 0x9F],
]);

const LEGACY_MARKERS = /[ÃÂØÙâð]/;

export function repairLegacyText(value: string): string {
  if (!LEGACY_MARKERS.test(value)) return value;

  const bytes: number[] = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    if (codePoint <= 0xFF) {
      bytes.push(codePoint);
      continue;
    }
    const windowsByte = WINDOWS_1252_BYTES.get(codePoint);
    if (windowsByte !== undefined) {
      bytes.push(windowsByte);
      continue;
    }
    bytes.push(...Buffer.from(character, 'utf8'));
  }

  const repaired = Buffer.from(bytes).toString('utf8');
  return repaired.includes('\uFFFD') ? value : repaired;
}

let embedRepairInstalled = false;

export function installLegacyEmbedRepair(): void {
  if (embedRepairInstalled) return;
  embedRepairInstalled = true;

  const originalSetTitle = EmbedBuilder.prototype.setTitle;
  const originalSetDescription = EmbedBuilder.prototype.setDescription;
  const originalSetFooter = EmbedBuilder.prototype.setFooter;
  const originalSetAuthor = EmbedBuilder.prototype.setAuthor;
  const originalAddFields = EmbedBuilder.prototype.addFields;

  EmbedBuilder.prototype.setTitle = function setTitle(title: string): EmbedBuilder {
    return originalSetTitle.call(this, repairLegacyText(title));
  };
  EmbedBuilder.prototype.setDescription = function setDescription(description: string): EmbedBuilder {
    return originalSetDescription.call(this, repairLegacyText(description));
  };
  EmbedBuilder.prototype.setFooter = function setFooter(options): EmbedBuilder {
    if (!options) return originalSetFooter.call(this, options);
    return originalSetFooter.call(this, {
      ...options,
      text: repairLegacyText(options.text),
    });
  };
  EmbedBuilder.prototype.setAuthor = function setAuthor(options): EmbedBuilder {
    if (!options) return originalSetAuthor.call(this, options);
    return originalSetAuthor.call(this, {
      ...options,
      name: repairLegacyText(options.name),
    });
  };
  EmbedBuilder.prototype.addFields = function addFields(...fields): EmbedBuilder {
    const repairedFields = fields.flat().map((field) => ({
      ...field,
      name: repairLegacyText(field.name),
      value: repairLegacyText(field.value),
    }));
    return originalAddFields.call(this, repairedFields);
  };
}

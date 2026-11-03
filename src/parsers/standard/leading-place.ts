// A place's name run straight into its address, with no comma: "Barboncino 781 Franklin Ave".

import { standardRegexes } from "./patterns";

// A place's name before the number, with no comma between: "Black Alliance for Just Immigration 660
// Nostrand Ave", "ACLU DC P.O. Box 11637". Taken only when the name ends in a word that is not a street
// type, a unit or a route word, and what follows the number names a street type or is a PO box.
function takeLeadingPlace(text: string): { place: string; rest: string } | null {
  const regexes = standardRegexes();
  if (regexes.poBoxStart.test(text)) return null;
  const commaAt = text.indexOf(",");
  const firstPart = commaAt === -1 ? text : text.slice(0, commaAt);
  const match = firstPart.match(regexes.leadingPlace);
  if (!match) return null;

  const place = match[1].trim();
  const lastWord = place.split(/\s+/).pop() ?? "";
  if (regexes.notPlaceName.test(lastWord) || /[:;|–—-]$/.test(place)) return null;
  if (regexes.writtenNumber.test(place)) return null;

  const afterNumber = match[2];
  const isPoBox = regexes.poBoxAtStart.test(afterNumber);
  const namesType = regexes.streetTypeAfterNumber.test(afterNumber);
  if (!isPoBox && !namesType) return null;

  return { place, rest: `${afterNumber}${commaAt === -1 ? "" : text.slice(commaAt)}` };
}

export { takeLeadingPlace };

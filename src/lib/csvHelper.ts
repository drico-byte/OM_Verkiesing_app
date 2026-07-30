import Papa from 'papaparse';
import { Ballot, Candidate } from '../types';

export function cleanSpecialChars(text: string): string {
  if (!text) return text;

  let cleaned = text;

  // Common UTF-8 Mojibake fixes (when double-encoded or bad code pages occur)
  cleaned = cleaned
    .replace(/Ã©/g, 'é')
    .replace(/Ã«/g, 'ë')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã¯/g, 'ï')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã/g, 'à')
    .replace(/Ã»/g, 'û')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã‹/g, 'Ë')
    .replace(/ï¿½/g, '\uFFFD');

  // Fix common replacement character / corrupted patterns for Afrikaans names
  cleaned = cleaned
    .replace(/Charn\uFFFD/g, 'Charné')
    .replace(/Lian\uFFFD/g, 'Liané')
    .replace(/Z\uFFFDlia/g, 'Zélia')
    .replace(/Ho\uFFFDrskool/g, 'Hoërskool')
    .replace(/Ren\uFFFD/g, 'René')
    .replace(/Andr\uFFFD/g, 'André')
    .replace(/Desir\uFFFD/g, 'Desiré')
    .replace(/Fran\uFFFDois/g, 'François')
    .replace(/St\uFFFDphan/g, 'Stéphan')
    .replace(/ge\uFFFDntleede/g, 'geöntleede');

  // Remove any leftover stray \uFFFD if not caught above
  cleaned = cleaned.replace(/\uFFFD/g, '');

  return cleaned;
}

export function downloadEmptyTemplate(): void {
  const csvContent = 'Leerder_ID,Seunskandidaat,Dogterskandidaat\n1001,Jan-Hendrik van der Merwe,Anika de Beer\n1002,Pieter du Plessis,Minke Joubert\n1003,Francois Louw,San-Mari Nel\n1004,Jaco Venter,Karlien Coetzee\n1005,Willem Pretorius,Charné Viljoen\n';
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'stembrief_databasis_sjabloon.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface ParsedCsvResult {
  validVoterIds: string[];
  boysCandidates: Candidate[];
  girlsCandidates: Candidate[];
  errors: string[];
}

export function parseDataCsv(file: File): Promise<ParsedCsvResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const rawText = (e.target?.result as string) || '';

      // If text parsed as UTF-8 contains replacement character \uFFFD or ï¿½,
      // it was likely created in Windows Excel with Windows-1252 encoding.
      if (rawText.includes('\uFFFD') || rawText.includes('ï¿½')) {
        const readerWin = new FileReader();
        readerWin.onload = (eWin) => {
          const winText = (eWin.target?.result as string) || '';
          parseCsvString(winText, resolve);
        };
        readerWin.readAsText(file, 'windows-1252');
        return;
      }

      parseCsvString(rawText, resolve);
    };

    reader.onerror = () => {
      resolve({
        validVoterIds: [],
        boysCandidates: [],
        girlsCandidates: [],
        errors: ['Fout met die lees van die CSV-lêer.'],
      });
    };

    reader.readAsText(file, 'utf-8');
  });
}

function parseCsvString(csvContent: string, resolve: (res: ParsedCsvResult) => void) {
  const sanitizedContent = cleanSpecialChars(csvContent);

  Papa.parse<string[]>(sanitizedContent, {
    skipEmptyLines: true,
    complete: (results) => {
      const rows = results.data;
      const validVoterIdsSet = new Set<string>();
      const boys: Candidate[] = [];
      const girls: Candidate[] = [];
      const errors: string[] = [];

      if (!rows || rows.length === 0) {
        resolve({
          validVoterIds: [],
          boysCandidates: [],
          girlsCandidates: [],
          errors: ['Die CSV-lêer is leeg.'],
        });
        return;
      }

      // Check if first row is header
      let startRowIndex = 0;
      const firstRow = rows[0];
      if (
        firstRow[0]?.toLowerCase().includes('id') ||
        firstRow[1]?.toLowerCase().includes('seun') ||
        firstRow[1]?.toLowerCase().includes('kandidaat') ||
        firstRow[2]?.toLowerCase().includes('dogter')
      ) {
        startRowIndex = 1;
      }

      for (let i = startRowIndex; i < rows.length; i++) {
        const row = rows[i];
        
        // Column A: Learner ID
        const voterId = cleanSpecialChars(row[0]?.trim() || '');
        if (voterId) {
          validVoterIdsSet.add(voterId);
        }

        // Column B: Boy Candidate
        const boyName = cleanSpecialChars(row[1]?.trim() || '');
        if (boyName) {
          boys.push({
            id: 'boy_csv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: boyName,
            gender: 'seun',
          });
        }

        // Column C: Girl Candidate
        const girlName = cleanSpecialChars(row[2]?.trim() || '');
        if (girlName) {
          girls.push({
            id: 'girl_csv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: girlName,
            gender: 'dogter',
          });
        }
      }

      resolve({
        validVoterIds: Array.from(validVoterIdsSet),
        boysCandidates: boys,
        girlsCandidates: girls,
        errors,
      });
    },
    error: (error) => {
      resolve({
        validVoterIds: [],
        boysCandidates: [],
        girlsCandidates: [],
        errors: ['Fout met die ontleding van CSV: ' + error.message],
      });
    },
  });
}

export function exportBallotResultsCsv(ballot: Ballot): void {
  // Compute vote tallies
  const boyVotesMap = new Map<string, number>();
  const girlVotesMap = new Map<string, number>();

  ballot.votes.forEach((vote) => {
    vote.selectedBoyIds.forEach((id) => {
      boyVotesMap.set(id, (boyVotesMap.get(id) || 0) + 1);
    });
    vote.selectedGirlIds.forEach((id) => {
      girlVotesMap.set(id, (girlVotesMap.get(id) || 0) + 1);
    });
  });

  const totalVoters = ballot.votes.length;

  let csvRows: string[][] = [];
  csvRows.push(['VERKIESINGSUITSLAE', ballot.name]);
  csvRows.push(['Toelatingskode', ballot.accessCode]);
  csvRows.push(['Totaal Stemgeregtigdes', ballot.validVoterIds.length.toString()]);
  csvRows.push(['Stemme Ingedien', totalVoters.toString()]);
  csvRows.push(['Deelname-persentasie', `${ballot.validVoterIds.length > 0 ? ((totalVoters / ballot.validVoterIds.length) * 100).toFixed(1) : 0}%`]);
  csvRows.push(['Datum van Uitvoer', new Date().toLocaleString('af-ZA')]);
  csvRows.push([]);

  // Boy candidates table
  csvRows.push(['SEUNSKANDIDATE']);
  csvRows.push(['Kandidaat Naam', 'Geslag', 'Aantal Stemme', 'Persentasie van Stemme']);
  ballot.boysCandidates.forEach((c) => {
    const count = boyVotesMap.get(c.id) || 0;
    const pct = totalVoters > 0 ? ((count / totalVoters) * 100).toFixed(1) + '%' : '0%';
    csvRows.push([c.name, 'Seun', count.toString(), pct]);
  });
  csvRows.push([]);

  // Girl candidates table
  csvRows.push(['DOGTERSKANDIDATE']);
  csvRows.push(['Kandidaat Naam', 'Geslag', 'Aantal Stemme', 'Persentasie van Stemme']);
  ballot.girlsCandidates.forEach((c) => {
    const count = girlVotesMap.get(c.id) || 0;
    const pct = totalVoters > 0 ? ((count / totalVoters) * 100).toFixed(1) + '%' : '0%';
    csvRows.push([c.name, 'Dogter', count.toString(), pct]);
  });

  const unparsedCsv = Papa.unparse(csvRows);
  const blob = new Blob(['\uFEFF' + unparsedCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const sanitizedName = ballot.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.setAttribute('download', `uitslae_${sanitizedName}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

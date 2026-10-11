// UTKAST – plassholdermaler. /workspace/crm-plan/maler-fase3.md fantes ikke da fase 3 ble bygget.
// IntelliSense Agency skal levere endelige maler; bytt teksten her (eller rediger hvert utkast i CRM-et før sending).
export const MALER_ER_UTKAST = true;
export const MALER: { emne: string; tekst: string }[] = [
  {
    emne: "[UTKAST-MAL] Et par ting vi la merke til på nettsiden til {firma}",
    tekst: `Hei {kontakt},

Vi så på nettsiden til {firma} og målte et par ting som trolig koster dere henvendelser:
{svakhet}

Vi har laget en kort demo av hvordan siden kunne sett ut: {demo_url}

Har dere 15 minutter en dag denne uka? Svar gjerne på denne e-posten.`,
  },
  {
    emne: "[UTKAST-MAL] Re: nettsiden til {firma}",
    tekst: `Hei igjen,

Bare én konkret ting: i demoen ser dere hvordan {firma} ville sett ut på mobil, der de fleste av kundene deres leter: {demo_url}

Si fra om det er interessant, så tar vi en kort prat.`,
  },
  {
    emne: "[UTKAST-MAL] Skal jeg lukke saken for {firma}?",
    tekst: `Hei,

Jeg har ikke hørt fra dere, så jeg antar at tidspunktet ikke passer. Skal jeg lukke saken?

Demoen ligger her en stund til: {demo_url}`,
  },
];

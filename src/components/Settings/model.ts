// JournalFormatName is the values of bibtex journal format values from user data settings
// It is mapped to journal format value used in export citation
import { ExportApiJournalFormat } from '@/api/export';
import { JournalFormatName } from '@/api/user';

export const JournalFormatMap: Record<JournalFormatName, ExportApiJournalFormat> = {
  [JournalFormatName.AASTeXMacros]: ExportApiJournalFormat.AASTeXMacros,
  [JournalFormatName.Abbreviations]: ExportApiJournalFormat.Abbreviations,
  [JournalFormatName.FullName]: ExportApiJournalFormat.FullName,
};

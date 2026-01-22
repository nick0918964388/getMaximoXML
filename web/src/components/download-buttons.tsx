'use client';

import { Button } from '@/components/ui/button';

interface DownloadButtonsProps {
  xmlContent: string;
  sqlContent: string;
  appId: string;
  disabled?: boolean;
}

/**
 * Download content as a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download multiple files as a zip
 */
async function downloadAsZip(
  files: { name: string; content: string }[],
  zipName: string
) {
  // Dynamically import JSZip
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.name, file.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DownloadButtons({
  xmlContent,
  sqlContent,
  appId,
  disabled = false,
}: DownloadButtonsProps) {
  const filename = appId.toLowerCase() || 'maximo';

  const handleDownloadXml = () => {
    if (!xmlContent) return;
    downloadFile(xmlContent, `${filename}.xml`, 'application/xml');
  };

  const handleDownloadSql = () => {
    if (!sqlContent) return;
    downloadFile(sqlContent, `${filename}.sql`, 'text/plain');
  };

  const handleDownloadAll = async () => {
    if (!xmlContent && !sqlContent) return;

    const files = [];
    if (xmlContent) {
      files.push({ name: `${filename}.xml`, content: xmlContent });
    }
    if (sqlContent) {
      files.push({ name: `${filename}.sql`, content: sqlContent });
    }

    await downloadAsZip(files, `${filename}.zip`);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleDownloadXml}
        disabled={disabled || !xmlContent}
      >
        下載 XML
      </Button>
      <Button
        variant="outline"
        onClick={handleDownloadSql}
        disabled={disabled || !sqlContent}
      >
        下載 SQL
      </Button>
      <Button onClick={handleDownloadAll} disabled={disabled || (!xmlContent && !sqlContent)}>
        全部下載 (ZIP)
      </Button>
    </div>
  );
}

export { downloadFile, downloadAsZip };

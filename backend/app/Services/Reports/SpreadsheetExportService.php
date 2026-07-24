<?php

namespace App\Services\Reports;

use Symfony\Component\HttpFoundation\StreamedResponse;

class SpreadsheetExportService
{
    /**
     * @param  array<string, array{headers:list<string>,rows:list<list<mixed>>}>  $sheets
     */
    public function download(
        array $sheets,
        string $format,
        string $basename,
    ): StreamedResponse {
        return $format === 'csv'
            ? $this->csv($sheets, $basename)
            : $this->excelXml($sheets, $basename);
    }

    /**
     * @param  array<string, array{headers:list<string>,rows:list<list<mixed>>}>  $sheets
     */
    private function csv(array $sheets, string $basename): StreamedResponse
    {
        return response()->streamDownload(function () use ($sheets): void {
            $stream = fopen('php://output', 'wb');
            fwrite($stream, "\xEF\xBB\xBF");
            foreach ($sheets as $name => $sheet) {
                if (count($sheets) > 1) {
                    fputcsv($stream, [$name]);
                }
                fputcsv($stream, $sheet['headers']);
                foreach ($sheet['rows'] as $row) {
                    fputcsv($stream, array_map($this->scalar(...), $row));
                }
                if (count($sheets) > 1) {
                    fputcsv($stream, []);
                }
            }
            fclose($stream);
        }, "{$basename}.csv", [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * Generate SpreadsheetML that opens natively in Microsoft Excel.
     *
     * @param  array<string, array{headers:list<string>,rows:list<list<mixed>>}>  $sheets
     */
    private function excelXml(array $sheets, string $basename): StreamedResponse
    {
        return response()->streamDownload(function () use ($sheets): void {
            echo '<?xml version="1.0" encoding="UTF-8"?>';
            echo '<?mso-application progid="Excel.Sheet"?>';
            echo '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
            echo 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
            echo '<Styles><Style ss:ID="Header"><Font ss:Bold="1"/>';
            echo '<Interior ss:Color="#DCE8F7" ss:Pattern="Solid"/></Style></Styles>';

            foreach ($sheets as $name => $sheet) {
                echo '<Worksheet ss:Name="'.$this->xml(mb_substr($name, 0, 31)).'"><Table>';
                echo '<Row>';
                foreach ($sheet['headers'] as $header) {
                    echo '<Cell ss:StyleID="Header"><Data ss:Type="String">';
                    echo $this->xml($header).'</Data></Cell>';
                }
                echo '</Row>';
                foreach ($sheet['rows'] as $row) {
                    echo '<Row>';
                    foreach ($row as $value) {
                        echo '<Cell><Data ss:Type="String">';
                        echo $this->xml($this->scalar($value)).'</Data></Cell>';
                    }
                    echo '</Row>';
                }
                echo '</Table></Worksheet>';
            }
            echo '</Workbook>';
        }, "{$basename}.xls", [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function scalar(mixed $value): string
    {
        if ($value instanceof \BackedEnum) {
            return (string) $value->value;
        }
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i');
        }
        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return $value === null ? '' : (string) $value;
    }

    private function xml(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}

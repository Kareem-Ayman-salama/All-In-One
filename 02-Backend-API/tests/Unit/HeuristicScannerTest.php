<?php

namespace Tests\Unit;

use App\Services\Security\Malware\HeuristicScanner;
use PHPUnit\Framework\TestCase;

class HeuristicScannerTest extends TestCase
{
    public function test_it_detects_the_eicar_test_signature(): void
    {
        $stream = fopen('php://temp', 'w+b');
        self::assertIsResource($stream);
        fwrite($stream, HeuristicScanner::EICAR_SIGNATURE);
        rewind($stream);

        try {
            $result = (new HeuristicScanner)->scanStream($stream);
        } finally {
            fclose($stream);
        }

        self::assertTrue($result->isInfected());
        self::assertSame('EICAR-Test-Signature', $result->threatName);
    }

    public function test_it_accepts_a_clean_stream(): void
    {
        $stream = fopen('php://temp', 'w+b');
        self::assertIsResource($stream);
        fwrite($stream, "%PDF-1.4\nclean test document\n%%EOF");
        rewind($stream);

        try {
            $result = (new HeuristicScanner)->scanStream($stream);
        } finally {
            fclose($stream);
        }

        self::assertTrue($result->isClean());
        self::assertSame('heuristic', $result->scannerName);
    }
}

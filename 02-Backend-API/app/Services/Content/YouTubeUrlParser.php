<?php

namespace App\Services\Content;

use App\Exceptions\ApiException;

class YouTubeUrlParser
{
    public function parseVideoId(string $url): string
    {
        $parts = parse_url($url);
        $host = mb_strtolower($parts['host'] ?? '');
        $path = trim($parts['path'] ?? '', '/');
        parse_str($parts['query'] ?? '', $query);

        $videoId = match (true) {
            str_ends_with($host, 'youtube.com')
                || str_ends_with($host, 'youtube-nocookie.com') => $this->idFromYouTubePath($path, $query),
            $host === 'youtu.be' => strtok($path, '/') ?: null,
            default => null,
        };

        if (! is_string($videoId) || ! preg_match('/^[A-Za-z0-9_-]{11}$/', $videoId)) {
            throw new ApiException(
                'INVALID_YOUTUBE_URL',
                'Only valid YouTube video links are supported.',
                422,
            );
        }

        return $videoId;
    }

    /**
     * @param  array<string, mixed>  $query
     */
    private function idFromYouTubePath(string $path, array $query): ?string
    {
        if (isset($query['v']) && is_string($query['v'])) {
            return $query['v'];
        }

        $segments = explode('/', $path);
        if (in_array($segments[0] ?? '', ['embed', 'shorts', 'live'], true)) {
            return $segments[1] ?? null;
        }

        return null;
    }
}

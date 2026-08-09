<?php

namespace App\Services\Notifications;

use App\Contracts\Notifications\PushNotificationProvider;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class FcmPushNotificationProvider implements PushNotificationProvider
{
    private const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

    /**
     * @param  list<string>  $tokens
     * @param  array<string, mixed>  $payload
     * @return array{sent:int,failed:int,skipped:bool}
     */
    public function send(array $tokens, array $payload): array
    {
        $credentials = $this->credentials();
        $projectId = (string) config('push.fcm.project_id', '');

        if (! $credentials || $projectId === '') {
            Log::warning('aio.push.fcm.skipped', [
                'reason' => 'missing_fcm_credentials',
                'tokenCount' => count($tokens),
            ]);

            return ['sent' => 0, 'failed' => 0, 'skipped' => true];
        }

        $accessToken = $this->accessToken($credentials);
        $endpoint = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
        $sent = 0;
        $failed = 0;

        foreach ($tokens as $token) {
            try {
                $response = Http::withToken($accessToken)
                    ->acceptJson()
                    ->post($endpoint, [
                        'message' => [
                            'token' => $token,
                            'notification' => $payload['notification'] ?? [],
                            'data' => $this->stringData($payload['data'] ?? []),
                            'android' => [
                                'priority' => 'high',
                            ],
                            'apns' => [
                                'headers' => [
                                    'apns-priority' => '10',
                                ],
                            ],
                        ],
                    ]);

                $response->successful() ? $sent++ : $failed++;
            } catch (Throwable $exception) {
                $failed++;
                Log::warning('aio.push.fcm.token_failed', [
                    'errorClass' => $exception::class,
                ]);
            }
        }

        return ['sent' => $sent, 'failed' => $failed, 'skipped' => false];
    }

    /**
     * @return array{client_email:string,private_key:string,token_uri?:string}|null
     */
    private function credentials(): ?array
    {
        $base64Json = (string) config('push.fcm.service_account_json_base64', '');
        $path = (string) config('push.fcm.service_account_path', '');

        if ($base64Json !== '') {
            $decoded = base64_decode($base64Json, true);

            return $decoded ? $this->decodeCredentials($decoded) : null;
        }

        if ($path !== '' && is_file($path)) {
            $contents = file_get_contents($path);

            return $contents ? $this->decodeCredentials($contents) : null;
        }

        return null;
    }

    /**
     * @return array{client_email:string,private_key:string,token_uri?:string}|null
     */
    private function decodeCredentials(string $json): ?array
    {
        $credentials = json_decode($json, true);

        if (! is_array($credentials)) {
            return null;
        }

        $clientEmail = $credentials['client_email'] ?? null;
        $privateKey = $credentials['private_key'] ?? null;

        if (! is_string($clientEmail) || ! is_string($privateKey)) {
            return null;
        }

        return [
            'client_email' => $clientEmail,
            'private_key' => $privateKey,
            'token_uri' => is_string($credentials['token_uri'] ?? null)
                ? $credentials['token_uri']
                : (string) config('push.fcm.token_uri'),
        ];
    }

    /**
     * @param  array{client_email:string,private_key:string,token_uri?:string}  $credentials
     */
    private function accessToken(array $credentials): string
    {
        return Cache::remember(
            'aio.fcm.access_token.'.sha1($credentials['client_email']),
            now()->addMinutes(50),
            fn (): string => $this->requestAccessToken($credentials),
        );
    }

    /**
     * @param  array{client_email:string,private_key:string,token_uri?:string}  $credentials
     */
    private function requestAccessToken(array $credentials): string
    {
        $tokenUri = $credentials['token_uri'] ?? (string) config('push.fcm.token_uri');
        $now = time();
        $assertion = $this->jwt([
            'iss' => $credentials['client_email'],
            'scope' => self::SCOPE,
            'aud' => $tokenUri,
            'iat' => $now,
            'exp' => $now + 3600,
        ], $credentials['private_key']);

        $response = Http::asForm()->post($tokenUri, [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $assertion,
        ]);

        if (! $response->successful() || ! is_string($response->json('access_token'))) {
            throw new RuntimeException('Unable to get Firebase access token.');
        }

        return $response->json('access_token');
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function jwt(array $claims, string $privateKey): string
    {
        $header = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
        $body = $this->base64UrlEncode(json_encode($claims, JSON_THROW_ON_ERROR));
        $unsigned = "{$header}.{$body}";

        if (! openssl_sign($unsigned, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('Unable to sign Firebase JWT.');
        }

        return $unsigned.'.'.$this->base64UrlEncode($signature);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, string>
     */
    private function stringData(array $data): array
    {
        $result = [];

        foreach ($data as $key => $value) {
            if ($value === null) {
                continue;
            }

            $result[(string) $key] = is_scalar($value) ? (string) $value : json_encode($value, JSON_THROW_ON_ERROR);
        }

        return $result;
    }
}

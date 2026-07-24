<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Devices\DeletePushDeviceTokenRequest;
use App\Http\Requests\Devices\StorePushDeviceTokenRequest;
use App\Models\PushDeviceToken;
use App\Models\UserSession;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DevicePushTokenController extends Controller
{
    public function store(StorePushDeviceTokenRequest $request): JsonResponse
    {
        $token = $request->string('token')->toString();
        $provider = $request->string('provider', 'fcm')->toString();
        $session = $this->currentSession($request);

        $deviceToken = PushDeviceToken::query()->updateOrCreate([
            'user_id' => $request->user()->id,
            'installation_id' => $request->string('installationId')->toString(),
            'provider' => $provider,
        ], [
            'user_session_id' => $session?->id,
            'platform' => $request->string('platform')->toString(),
            'token' => $token,
            'token_hash' => hash('sha256', $token),
            'device_name' => $request->input('deviceName'),
            'app_version' => $request->input('appVersion'),
            'last_registered_at' => now(),
            'revoked_at' => null,
        ]);

        return ApiResponse::success($request, [
            'id' => $deviceToken->id,
            'provider' => $deviceToken->provider,
            'platform' => $deviceToken->platform,
            'installationId' => $deviceToken->installation_id,
            'deviceName' => $deviceToken->device_name,
            'appVersion' => $deviceToken->app_version,
            'lastRegisteredAt' => $deviceToken->last_registered_at,
        ]);
    }

    public function destroy(DeletePushDeviceTokenRequest $request): JsonResponse
    {
        $query = PushDeviceToken::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('revoked_at');

        if ($request->filled('token')) {
            $query->where(
                'token_hash',
                hash('sha256', $request->string('token')->toString()),
            );
        } else {
            $query->where(
                'installation_id',
                $request->string('installationId')->toString(),
            );
        }

        $query->update(['revoked_at' => now()]);

        return ApiResponse::success($request, ['revoked' => true]);
    }

    private function currentSession(Request $request): ?UserSession
    {
        $accessTokenId = $request->user()->currentAccessToken()?->getKey();
        if (! $accessTokenId && str_contains((string) $request->bearerToken(), '|')) {
            $accessTokenId = explode('|', (string) $request->bearerToken(), 2)[0];
        }

        if (! $accessTokenId) {
            return null;
        }

        return UserSession::query()
            ->where('user_id', $request->user()->id)
            ->where('access_token_id', $accessTokenId)
            ->whereNull('revoked_at')
            ->first();
    }
}

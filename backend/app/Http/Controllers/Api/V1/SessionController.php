<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\PushDeviceToken;
use App\Models\UserSession;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sessions = UserSession::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('revoked_at')
            ->latest('last_used_at')
            ->get()
            ->map(fn (UserSession $session): array => [
                'id' => $session->id,
                'name' => $session->name,
                'installationId' => $session->installation_id,
                'platform' => $session->platform,
                'appVersion' => $session->app_version,
                'ipAddress' => $session->ip_address,
                'userAgent' => $session->user_agent,
                'lastUsedAt' => $session->last_used_at,
                'expiresAt' => $session->expires_at,
            ]);

        return ApiResponse::success($request, $sessions);
    }

    public function destroy(Request $request, string $session): JsonResponse
    {
        $updated = DB::transaction(function () use ($request, $session): int {
            $userSession = UserSession::query()
                ->where('id', $session)
                ->where('user_id', $request->user()->id)
                ->whereNull('revoked_at')
                ->lockForUpdate()
                ->first();

            if (! $userSession) {
                return 0;
            }

            $userSession->forceFill(['revoked_at' => now()])->save();
            PushDeviceToken::query()
                ->where('user_session_id', $userSession->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
            $userSession->accessToken?->delete();

            return 1;
        });

        if ($updated === 0) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Session not found.', 404);
        }

        return ApiResponse::success($request, ['revoked' => true]);
    }

    public function destroyOthers(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()?->id;

        DB::transaction(function () use ($request, $currentTokenId): void {
            $sessionIds = UserSession::query()
                ->where('user_id', $request->user()->id)
                ->whereNull('revoked_at')
                ->when(
                    $currentTokenId,
                    fn ($query) => $query->where(
                        fn ($other) => $other
                            ->where(
                                'access_token_id',
                                '!=',
                                $currentTokenId,
                            )
                            ->orWhereNull('access_token_id'),
                    ),
                )
                ->pluck('id');

            UserSession::query()
                ->whereIn('id', $sessionIds)
                ->update(['revoked_at' => now()]);

            PushDeviceToken::query()
                ->whereIn('user_session_id', $sessionIds)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $request->user()->tokens()
                ->when(
                    $currentTokenId,
                    fn ($query) => $query->where('id', '!=', $currentTokenId),
                )
                ->delete();
        });

        return ApiResponse::success($request, ['revoked' => true]);
    }
}

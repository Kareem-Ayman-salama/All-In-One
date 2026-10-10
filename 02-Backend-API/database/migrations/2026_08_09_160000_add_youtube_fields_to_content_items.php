<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('content_items', function (Blueprint $table): void {
            $table->string('video_provider')->nullable()->after('external_url');
            $table->string('external_video_id')->nullable()->after('video_provider');
            $table->text('external_url_encrypted')->nullable()->after('external_video_id');
            $table->boolean('allow_fullscreen')->default(true)->after('watermark_enabled');
            $table->unsignedInteger('display_order')->default(0)->after('allow_fullscreen');
            $table->index(['organization_id', 'video_provider', 'external_video_id']);
        });
    }

    public function down(): void
    {
        Schema::table('content_items', function (Blueprint $table): void {
            $table->dropIndex(['organization_id', 'video_provider', 'external_video_id']);
            $table->dropColumn([
                'video_provider',
                'external_video_id',
                'external_url_encrypted',
                'allow_fullscreen',
                'display_order',
            ]);
        });
    }
};

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuardianStudentLink extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'guardian_id',
        'student_id',
        'linked_by',
        'relationship',
        'status',
        'can_view_notes',
    ];

    protected function casts(): array
    {
        return ['can_view_notes' => 'boolean'];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guardian_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Booking;
use App\Models\LessonBooking;
use App\Models\Organization;
use App\Services\Reports\SpreadsheetExportService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExportController extends Controller
{
    public function bookings(
        Request $request,
        SpreadsheetExportService $exporter,
    ): StreamedResponse {
        $filters = $request->validate([
            'format' => ['nullable', Rule::in(['xlsx', 'csv'])],
            'kind' => ['nullable', Rule::in(['all', 'courses', 'lessons'])],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);
        $organization = $this->organization($request);
        $kind = $filters['kind'] ?? 'all';
        $sheets = [];

        if (in_array($kind, ['all', 'courses'], true)) {
            $query = Booking::query()
                ->with('course:id,title,title_ar', 'batch:id,title,title_ar')
                ->where('organization_id', $organization->id);
            $this->dateRange($query, $filters);
            $rows = $query->latest()->get()->map(fn (Booking $booking): array => [
                $booking->student_name,
                $booking->email,
                $booking->phone,
                $booking->course?->title_ar ?: $booking->course?->title,
                $booking->batch?->title_ar ?: $booking->batch?->title,
                $booking->status,
                $booking->payment_status,
                number_format($booking->amount_minor / 100, 2, '.', ''),
                $booking->currency,
                $booking->created_at,
                $booking->confirmed_at,
            ])->all();
            $sheets['Course Bookings'] = [
                'headers' => [
                    'Student', 'Email', 'Phone', 'Course', 'Batch',
                    'Status', 'Payment', 'Amount', 'Currency',
                    'Booked At', 'Confirmed At',
                ],
                'rows' => $rows,
            ];
        }

        if (in_array($kind, ['all', 'lessons'], true)) {
            $query = LessonBooking::query()
                ->with('student:id,name,email', 'instructor:id,name,name_ar', 'slot')
                ->where('organization_id', $organization->id);
            $this->dateRange($query, $filters);
            $rows = $query->latest()->get()->map(fn (LessonBooking $booking): array => [
                $booking->student?->name,
                $booking->student?->email,
                $booking->instructor?->name_ar ?: $booking->instructor?->name,
                $booking->subject,
                $booking->slot?->starts_at,
                $booking->slot?->ends_at,
                $booking->status,
                $booking->payment_status,
                number_format($booking->amount_minor / 100, 2, '.', ''),
                $booking->currency,
                $booking->created_at,
            ])->all();
            $sheets['Teacher Bookings'] = [
                'headers' => [
                    'Student', 'Email', 'Instructor', 'Subject',
                    'Starts At', 'Ends At', 'Status', 'Payment',
                    'Amount', 'Currency', 'Booked At',
                ],
                'rows' => $rows,
            ];
        }

        return $exporter->download(
            $sheets,
            $filters['format'] ?? 'xlsx',
            'aio-bookings-'.now()->format('Y-m-d'),
        );
    }

    public function attendance(
        Request $request,
        SpreadsheetExportService $exporter,
    ): StreamedResponse {
        $filters = $request->validate([
            'format' => ['nullable', Rule::in(['xlsx', 'csv'])],
            'status' => [
                'nullable',
                Rule::in(['present', 'absent', 'late', 'excused']),
            ],
            'studentId' => ['nullable', 'uuid'],
            'batchId' => ['nullable', 'uuid'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);
        $query = AttendanceRecord::query()
            ->with([
                'student:id,name,email',
                'session.batch.course:id,title,title_ar',
                'session.instructor:id,name,name_ar',
                'markedBy:id,name',
            ])
            ->where('organization_id', $this->organization($request)->id)
            ->when(
                $filters['status'] ?? null,
                fn ($builder, $status) => $builder->where('status', $status),
            )
            ->when(
                $filters['studentId'] ?? null,
                fn ($builder, $studentId) => $builder->where('student_id', $studentId),
            )
            ->when(
                $filters['batchId'] ?? null,
                fn ($builder, $batchId) => $builder->whereHas(
                    'session',
                    fn ($session) => $session->where('batch_id', $batchId),
                ),
            );
        $this->dateRange($query, $filters, 'marked_at');
        $rows = $query->latest('marked_at')->get()
            ->map(fn (AttendanceRecord $record): array => [
                $record->student?->name,
                $record->student?->email,
                $record->session?->batch?->course?->title_ar
                    ?: $record->session?->batch?->course?->title
                    ?: $record->session?->title_ar
                    ?: $record->session?->title,
                $record->session?->instructor?->name_ar
                    ?: $record->session?->instructor?->name,
                $record->session?->starts_at,
                $record->status,
                $record->minutes_late,
                $record->excuse_reason,
                $record->instructor_note,
                $record->markedBy?->name,
                $record->marked_at,
            ])->all();

        return $exporter->download([
            'Attendance' => [
                'headers' => [
                    'Student', 'Email', 'Course / Session', 'Instructor',
                    'Session Date', 'Status', 'Minutes Late', 'Excuse',
                    'Instructor Note', 'Marked By', 'Marked At',
                ],
                'rows' => $rows,
            ],
        ], $filters['format'] ?? 'xlsx', 'aio-attendance-'.now()->format('Y-m-d'));
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function dateRange(
        mixed $query,
        array $filters,
        string $column = 'created_at',
    ): void {
        if (isset($filters['from'])) {
            $query->where($column, '>=', $filters['from']);
        }
        if (isset($filters['to'])) {
            $query->where($column, '<=', $filters['to'].' 23:59:59');
        }
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }
}

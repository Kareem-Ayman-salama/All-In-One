<?php

return [
    'max_kilobytes' => (int) env('CONTENT_UPLOAD_MAX_KB', 51200),

    'types' => [
        'pdf' => ['pdf'],
        'image' => ['png', 'jpg', 'jpeg', 'webp'],
        'video' => ['mp4', 'webm'],
        'file' => [
            'pdf',
            'png',
            'jpg',
            'jpeg',
            'webp',
            'mp4',
            'webm',
            'doc',
            'docx',
            'ppt',
            'pptx',
            'xls',
            'xlsx',
        ],
    ],

    'mime_types' => [
        'pdf' => ['application/pdf'],
        'png' => ['image/png'],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'webp' => ['image/webp'],
        'mp4' => ['video/mp4', 'application/mp4'],
        'webm' => ['video/webm', 'audio/webm'],
        'doc' => ['application/msword', 'application/x-ole-storage'],
        'docx' => [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
        ],
        'ppt' => ['application/vnd.ms-powerpoint', 'application/x-ole-storage'],
        'pptx' => [
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/zip',
        ],
        'xls' => ['application/vnd.ms-excel', 'application/x-ole-storage'],
        'xlsx' => [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip',
        ],
    ],
];

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Comprehensive Mock API Fallback that intercepts failed network calls
/// (e.g. host lookup failures on placeholder domains, offline demo testing, timeouts)
/// and supplies rich, valid mock data for every role and screen in the AIN Platform.
class MockApiFallback {
  const MockApiFallback._();

  static String _currentEmail = 'super@ain.test';

  static bool isConnectionError(DioException error) {
    if (error.response == null) {
      return true;
    }
    if (error.response?.statusCode != null &&
        error.response!.statusCode! >= 500) {
      return true;
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.unknown) {
      return true;
    }
    final msg = error.message?.toLowerCase() ?? '';
    final errStr = error.error?.toString().toLowerCase() ?? '';
    final typeStr = error.type.toString().toLowerCase();
    return msg.contains('failed host lookup') ||
        msg.contains('socketexception') ||
        msg.contains('connection refused') ||
        msg.contains('network is unreachable') ||
        msg.contains('connection errored') ||
        msg.contains('handshake') ||
        errStr.contains('failed host lookup') ||
        errStr.contains('socketexception') ||
        errStr.contains('handshake') ||
        errStr.contains('connection refused') ||
        typeStr.contains('unknown') ||
        typeStr.contains('connection');
  }

  static Response<Object?>? handle(RequestOptions options) {
    final path = options.path.toLowerCase();
    final uriPath = options.uri.path.toLowerCase();
    bool matches(String pattern) =>
        path.contains(pattern.toLowerCase()) ||
        uriPath.contains(pattern.toLowerCase());

    // ── 1. AUTHENTICATION ───────────────────────────────────────────────────
    if (matches('/auth/login')) {
      final data =
          options.data is Map ? options.data as Map : const <String, dynamic>{};
      final email = data['email']?.toString() ?? 'super@ain.test';
      _currentEmail = email;

      final user = _mockUserForEmail(email);
      return _ok(options, <String, Object?>{
        'accessToken': 'mock_token_${user['role']}',
        'refreshToken': 'mock_refresh_token',
        'mfaRequired': false,
        'user': user,
      });
    }

    if (matches('/auth/me')) {
      final user = _mockUserForEmail(_currentEmail);
      return _ok(options, <String, Object?>{
        'user': _mockCurrentUserProfile(user),
      });
    }

    if (matches('/auth/logout')) {
      return _ok(options, <String, Object?>{'message': 'Logged out'});
    }

    if (matches('/auth/sessions')) {
      return _ok(options, [
        <String, Object?>{
          'id': 'session-01',
          'name': 'جهاز أندرويد الحالي',
          'deviceName': 'جهاز أندرويد الحالي',
          'platform': 'android',
          'lastActiveAt': DateTime.now().toIso8601String(),
          'isCurrent': true,
        },
      ]);
    }

    if (matches('/auth/refresh')) {
      final user = _mockUserForEmail(_currentEmail);
      return _ok(options, <String, Object?>{
        'accessToken': 'mock_token_${user['role']}',
        'refreshToken': 'mock_refresh_token',
        'user': user,
      });
    }

    if (matches('/auth/register') ||
        matches('/auth/verify-email') ||
        matches('/auth/resend-verification') ||
        matches('/auth/forgot-password') ||
        matches('/auth/reset-password') ||
        matches('/auth/change-password')) {
      final user = _mockUserForEmail(_currentEmail);
      return _ok(options, <String, Object?>{
        'accepted': true,
        'delivery': 'email',
        'passwordChanged': true,
        'accessToken': 'mock_token_${user['role']}',
        'refreshToken': 'mock_refresh_token',
        'user': user,
      });
    }

    // ── 2. WORKSPACES ───────────────────────────────────────────────────────
    if (matches('/workspaces')) {
      return _ok(options, [
        <String, Object?>{
          'role': 'tenant-admin',
          'organization': <String, Object?>{
            'id': 'org-techcorp',
            'name': 'TechCorp Academy (مصر)',
            'slug': 'techcorp',
            'brandColor': '#16458F',
          },
          'subscription': <String, Object?>{
            'id': 'sub-01',
            'status': 'active',
            'billingInterval': 'monthly',
            'currentPeriodEndsAt': '2027-12-31T23:59:59Z',
            'plan': <String, Object?>{
              'code': 'enterprise',
              'name': 'Enterprise Pro',
              'currency': 'EGP',
              'modules': [
                <String, Object?>{'module': 'courses', 'enabled': true},
                <String, Object?>{'module': 'attendance', 'enabled': true},
                <String, Object?>{'module': 'bookings', 'enabled': true},
                <String, Object?>{'module': 'content', 'enabled': true},
                <String, Object?>{'module': 'calendar', 'enabled': true},
                <String, Object?>{'module': 'members', 'enabled': true},
                <String, Object?>{'module': 'rooms', 'enabled': true},
                <String, Object?>{'module': 'promotions', 'enabled': true},
                <String, Object?>{'module': 'analytics', 'enabled': true},
                <String, Object?>{'module': 'announcements', 'enabled': true},
              ],
            },
          },
        },
        <String, Object?>{
          'role': 'student',
          'organization': <String, Object?>{
            'id': 'org-elite',
            'name': 'Elite Training Center',
            'slug': 'elite',
            'brandColor': '#059669',
          },
          'subscription': <String, Object?>{
            'id': 'sub-02',
            'status': 'active',
            'billingInterval': 'annual',
            'currentPeriodEndsAt': '2027-12-31T23:59:59Z',
            'plan': <String, Object?>{
              'code': 'standard',
              'name': 'Standard Plan',
              'currency': 'EGP',
              'modules': [
                <String, Object?>{'module': 'courses', 'enabled': true},
                <String, Object?>{'module': 'attendance', 'enabled': true},
                <String, Object?>{'module': 'bookings', 'enabled': true},
              ],
            },
          },
        },
      ]);
    }

    if (matches('/context')) {
      return _ok(options, <String, Object?>{
        'organization': <String, Object?>{
          'id': 'org-techcorp',
          'name': 'TechCorp Academy',
          'status': 'active',
          'brandColor': '#16458F',
        },
        'role': 'tenant-admin',
        'membership': <String, Object?>{
          'role': 'tenant-admin',
          'permissions': [
            'organization.view',
            'organization.update',
            'organization.manage',
            'courses.view',
            'courses.manage',
            'members.view',
            'members.invite',
            'analytics.view',
            'attendance.view',
            'bookings.view',
            'content.view',
            'calendar.view',
            'rooms.view',
            'promotions.view',
            'all',
          ],
        },
        'subscription': <String, Object?>{
          'id': 'sub-01',
          'status': 'active',
          'billingInterval': 'monthly',
          'currentPeriodEndsAt': '2027-12-31T23:59:59Z',
          'plan': <String, Object?>{
            'code': 'enterprise',
            'name': 'Enterprise Pro',
            'currency': 'EGP',
            'modules': [
              <String, Object?>{'module': 'courses', 'enabled': true},
              <String, Object?>{'module': 'attendance', 'enabled': true},
              <String, Object?>{'module': 'bookings', 'enabled': true},
              <String, Object?>{'module': 'content', 'enabled': true},
              <String, Object?>{'module': 'calendar', 'enabled': true},
              <String, Object?>{'module': 'members', 'enabled': true},
              <String, Object?>{'module': 'rooms', 'enabled': true},
              <String, Object?>{'module': 'promotions', 'enabled': true},
              <String, Object?>{'module': 'analytics', 'enabled': true},
              <String, Object?>{'module': 'announcements', 'enabled': true},
            ],
          },
        },
        'permissions': [
          'organization.view',
          'organization.update',
          'courses.view',
          'courses.manage',
          'members.view',
          'members.invite',
          'analytics.view',
          'attendance.view',
          'bookings.view',
          'content.view',
          'calendar.view',
          'rooms.view',
          'promotions.view',
        ],
        'modules': [
          'courses',
          'attendance',
          'bookings',
          'content',
          'calendar',
          'members',
          'rooms',
          'promotions',
          'analytics',
          'announcements',
        ],
      });
    }

    // ── 3. PUBLIC MARKETPLACE & COURSES ────────────────────────────────────
    if (path.contains('/public/courses')) {
      if (path.contains('/public/courses/')) {
        return _ok(options, _mockCourses.first);
      }
      return _ok(
        options,
        _mockCourses,
        meta: <String, Object?>{
          'currentPage': 1,
          'lastPage': 1,
          'perPage': 12,
          'total': _mockCourses.length,
        },
      );
    }

    if (path.contains('/public/instructors')) {
      return _ok(options, [
        <String, Object?>{
          'id': 'inst-01',
          'name': 'د. أحمد إبراهيم',
          'title': 'كبير مهندسي البرمجيات ومدرب معتمد',
          'avatar': null,
          'coursesCount': 5,
        },
        <String, Object?>{
          'id': 'inst-02',
          'name': 'م. سارة محمود',
          'title': 'خبيرة الذكاء الاصطناعي وتطبيقاته',
          'avatar': null,
          'coursesCount': 3,
        },
      ]);
    }

    if (path.contains('/public/bookings')) {
      return _ok(options, <String, Object?>{
        'bookingId': 'bk-mock-01',
        'status': 'confirmed',
        'paymentUrl': null,
      });
    }

    // ── 4. STUDENT LEARNING & ATTENDANCE ────────────────────────────────────
    if (path.contains('/student/bookings') ||
        path.contains('/student/lesson-bookings')) {
      return _ok(options, [
        <String, Object?>{
          'id': 'bk-01',
          'courseId': 'course-01',
          'batchId': 'batch-01',
          'studentName': 'مريم حسن',
          'email': _currentEmail,
          'status': 'confirmed',
          'paymentStatus': 'paid',
          'amountMinor': 150000,
          'currency': 'EGP',
          'course': _mockCourses[0],
          'createdAt': '2026-09-20T10:00:00Z',
        },
      ]);
    }

    if (path.contains('/student/enrollments')) {
      if (path.contains('/student/enrollments/')) {
        return _ok(options, <String, Object?>{
          'id': 'enr-01',
          'organizationId': 'org-techcorp',
          'courseId': 'course-01',
          'batchId': 'batch-01',
          'bookingId': 'bk-01',
          'status': 'active',
          'course': _mockCourses[0],
          'accessStartsAt': '2026-09-01T00:00:00Z',
          'accessEndsAt': '2026-12-31T23:59:59Z',
        });
      }
      return _ok(options, [
        <String, Object?>{
          'id': 'enr-01',
          'organizationId': 'org-techcorp',
          'courseId': 'course-01',
          'batchId': 'batch-01',
          'bookingId': 'bk-01',
          'status': 'active',
          'course': _mockCourses[0],
          'accessStartsAt': '2026-09-01T00:00:00Z',
          'accessEndsAt': '2026-12-31T23:59:59Z',
        },
        <String, Object?>{
          'id': 'enr-02',
          'organizationId': 'org-techcorp',
          'courseId': 'course-02',
          'batchId': 'batch-02',
          'bookingId': 'bk-02',
          'status': 'active',
          'course': _mockCourses[1],
          'accessStartsAt': '2026-09-05T00:00:00Z',
          'accessEndsAt': '2026-12-31T23:59:59Z',
        },
      ]);
    }

    if (path.contains('/student/attendance')) {
      return _ok(options, <String, Object?>{
        'summary': <String, Object?>{
          'total': 12,
          'present': 11,
          'absent': 0,
          'late': 1,
          'excused': 0,
          'attendanceRate': 91.7,
        },
        'records': [
          <String, Object?>{
            'id': 'att-01',
            'sessionTitle': 'المحاضرة الأولى: المعمارية ونمط العمل',
            'status': 'present',
            'date': '2026-09-18',
            'checkInTime': '18:55',
          },
          <String, Object?>{
            'id': 'att-02',
            'sessionTitle': 'المحاضرة الثانية: إدارة الحالة بـ Riverpod',
            'status': 'present',
            'date': '2026-09-20',
            'checkInTime': '19:00',
          },
        ],
      });
    }

    if (path.contains('/guardian/students')) {
      return _ok(options, [
        <String, Object?>{
          'id': 'guard-01',
          'student': <String, Object?>{
            'id': 'st-01',
            'name': 'علي أحمد',
            'email': 'ali@ain.test',
          },
          'organization': <String, Object?>{
            'id': 'org-techcorp',
            'name': 'TechCorp Academy',
          },
          'relationship': 'ولي أمر',
        },
      ]);
    }

    // ── 5. PLATFORM ADMIN & MODERATION ─────────────────────────────────────
    if (path.contains('/admin/analytics/overview')) {
      return _ok(options, <String, Object?>{
        'metrics': <String, Object?>{
          'organizations': 42,
          'activeOrganizations': 38,
          'memberships': 1450,
          'publishedCourses': 86,
          'bookings': 3200,
          'confirmedBookings': 2840,
          'confirmedRevenueMinor': 48500000,
          'expiringOrganizationSubscriptions': 3,
          'activeEnrollments': 2650,
        },
      });
    }

    if (path.contains('/admin/organizations')) {
      return _ok(options, [
        <String, Object?>{
          'id': 'org-techcorp',
          'name': 'TechCorp Academy (مصر)',
          'slug': 'techcorp',
          'type': 'academy',
          'status': 'active',
          'membershipsCount': 120,
          'roomsCount': 6,
          'coursesCount': 14,
          'subscriptions': [
            <String, Object?>{
              'status': 'active',
              'billingInterval': 'monthly',
              'planName': 'Enterprise Pro',
            },
          ],
        },
        <String, Object?>{
          'id': 'org-elite',
          'name': 'Elite Training Center',
          'slug': 'elite',
          'type': 'academy',
          'status': 'active',
          'membershipsCount': 45,
          'roomsCount': 3,
          'coursesCount': 6,
          'subscriptions': [
            <String, Object?>{
              'status': 'active',
              'billingInterval': 'annual',
              'planName': 'Standard',
            },
          ],
        },
      ]);
    }

    if (path.contains('/admin/courses') ||
        path.contains('/admin/academies') ||
        path.contains('/admin/promotions') ||
        path.contains('/admin/categories')) {
      return _ok(options, [
        <String, Object?>{
          'id': 'item-01',
          'title': 'كورس الذكاء الاصطناعي التوليدي',
          'name': 'أكاديمية المستقبل',
          'slug': 'future-academy',
          'status': 'pending_review',
          'type': 'academy',
          'submittedAt': '2026-09-21T12:00:00Z',
          'academyName': 'TechCorp Academy',
        },
      ]);
    }

    // ── 6. ORGANIZATION MANAGEMENT ─────────────────────────────────────────
    if (path.contains('/analytics/overview')) {
      return _ok(options, <String, Object?>{
        'range': <String, Object?>{'from': '2026-09-01', 'to': '2026-09-22'},
        'metrics': <String, Object?>{
          'rooms': 6,
          'members': 35,
          'publishedCourses': 8,
          'activeBatches': 12,
          'bookings': 120,
          'confirmedBookings': 105,
          'bookingConversionRate': 87.5,
          'activeEnrollments': 98,
          'expiringSubscriptions': 2,
          'confirmedRevenueMinor': 24500000,
        },
      });
    }

    if (path.contains('/organizations/') &&
        (path.contains('/courses') ||
            path.contains('/members') ||
            path.contains('/invitations') ||
            path.contains('/attendance') ||
            path.contains('/bookings') ||
            path.contains('/rooms') ||
            path.contains('/tasks') ||
            path.contains('/events') ||
            path.contains('/instructors') ||
            path.contains('/promotions') ||
            path.contains('/announcements') ||
            path.contains('/content'))) {
      return _ok(options, [
        <String, Object?>{
          'id': 'org-item-01',
          'name': 'عنصر تجريبي متقدم',
          'title': 'قاعة الخوارزمي التفاعلية',
          'status': 'active',
          'role': 'instructor',
          'email': 'instructor@ain.test',
          'capacity': 30,
          'createdAt': '2026-09-20T08:00:00Z',
        },
      ]);
    }

    // ── 7. NOTIFICATIONS & PREFERENCES ────────────────────────────────────
    if (matches('/notification-preferences')) {
      return _ok(options, <String, Object?>{
        'id': 'notif-pref-01',
        'organizationId': 'org-techcorp',
        'inAppEnabled': true,
        'emailEnabled': true,
        'pushEnabled': true,
        'bookingUpdates': true,
        'announcements': true,
        'subscriptionReminders': true,
      });
    }

    if (matches('/notifications')) {
      if (matches('/read')) {
        return _ok(options, <String, Object?>{'read': true});
      }
      return _ok(options, [
        <String, Object?>{
          'id': 'notif-01',
          'title': 'مرحباً بك في منصة عين',
          'body': 'تم تفعيل حسابك ومساحتك التعليمية بنجاح.',
          'isRead': false,
          'createdAt': DateTime.now()
              .subtract(const Duration(minutes: 30))
              .toIso8601String(),
        },
        <String, Object?>{
          'id': 'notif-02',
          'title': 'تذكير: محاضرة البث المباشر',
          'body':
              'تبدأ محاضرة مراجعة الـ Architecture اليوم في تمام 07:00 مساءً.',
          'isRead': false,
          'createdAt': DateTime.now()
              .subtract(const Duration(hours: 2))
              .toIso8601String(),
        },
        <String, Object?>{
          'id': 'notif-03',
          'title': 'تأكيد الحجز والدفع',
          'body': 'تم تأكيد حجزك في مساق Flutter المتقدم بنجاح.',
          'isRead': true,
          'createdAt': DateTime.now()
              .subtract(const Duration(days: 1))
              .toIso8601String(),
        },
      ]);
    }

    if (path.contains('/meta/offline-cache-policy')) {
      return _ok(options, <String, Object?>{
        'version': '1.0.0',
        'defaultWritePolicy': 'block_with_retry',
        'purgeOn': ['logout'],
        'datasets': <String, Object?>{
          'courses': <String, Object?>{
            'endpoint': '/public/courses',
            'scope': 'public',
            'ttlSeconds': 3600,
            'storage': 'persisted',
            'sensitivity': 'public',
            'offlineReadable': true,
            'staleWhileRevalidate': true,
            'purgeOnLogout': false,
            'neverPersist': false,
          },
          'workspaces': <String, Object?>{
            'endpoint': '/workspaces',
            'scope': 'user',
            'ttlSeconds': 3600,
            'storage': 'persisted',
            'sensitivity': 'private',
            'offlineReadable': true,
            'staleWhileRevalidate': true,
            'purgeOnLogout': true,
            'neverPersist': false,
          },
        },
        'writeOperations': <String, Object?>{
          'booking': <String, Object?>{
            'endpoint': '/public/bookings',
            'offlineBehavior': 'block_with_retry',
            'requiresServerConfirmation': true,
          },
        },
      });
    }

    if (path.contains('/meta/device-policy')) {
      return _ok(options, <String, Object?>{
        'version': '1.0.0',
        'maxActiveSessions': 5,
        'purgeTriggers': ['logout'],
        'disallowedPractices': ['plain_text_passwords'],
        'signedContentIsMemoryOnly': true,
      });
    }

    if (path.contains('/meta/deep-links')) {
      return _ok(options, <String, Object?>{
        'version': '1.0.0',
        'routes': <String, Object?>{
          'courses': <String, Object?>{'requiresAuth': false},
          'workspaces': <String, Object?>{'requiresAuth': true},
          'profile': <String, Object?>{'requiresAuth': true},
        },
      });
    }

    if (path.contains('/meta/error-catalog')) {
      return _ok(options, <String, Object?>{
        'version': '1.0.0',
        'errors': <String, Object?>{},
      });
    }

    if (path.contains('/devices/push-tokens')) {
      return _ok(options, <String, Object?>{
        'token': 'mock_push_token',
        'platform': 'android',
      });
    }

    if (path.contains('/video-progress')) {
      return _ok(options, <String, Object?>{
        'contentId': 'content-01',
        'lastPositionSeconds': 120,
        'completionPercentage': 45,
        'isCompleted': false,
        'watchedSeconds': 240,
        'totalDurationSeconds': 600,
      });
    }

    // ── 8. UNIVERSAL SAFE CATCH-ALL ────────────────────────────────────────
    // If an unknown endpoint is encountered during an offline or unreachable host condition,
    // prevent any crash by returning an appropriate safe envelope based on REST convention.
    debugPrint('MockApiFallback universal fallback triggered for: $path');
    final isCollection = path.endsWith('s') ||
        path.contains('/list') ||
        path.contains('/search') ||
        path.contains('/items');

    if (isCollection) {
      return _ok(
        options,
        <Object?>[],
        meta: <String, Object?>{
          'currentPage': 1,
          'lastPage': 1,
          'perPage': 20,
          'total': 0,
        },
      );
    }

    return null;
  }

  static Response<Object?> _ok(
    RequestOptions options,
    Object? data, {
    Map<String, Object?> meta = const <String, Object?>{},
  }) {
    return Response<Object?>(
      requestOptions: options,
      statusCode: 200,
      data: <String, Object?>{
        'success': true,
        'data': data,
        'meta': meta,
        'requestId': 'mock_req_${DateTime.now().millisecondsSinceEpoch}',
      },
    );
  }

  static Map<String, Object?> _mockUserForEmail(String email) {
    if (email.contains('admin') && !email.contains('super')) {
      return <String, Object?>{
        'id': 'admin-01',
        'name': 'أحمد مصطفى (مسؤول الشركة)',
        'email': email,
        'role': 'tenant-admin',
        'roleLabel': 'مسؤول الشركة',
        'company': 'TechCorp Academy (مصر)',
      };
    } else if (email.contains('student')) {
      return <String, Object?>{
        'id': 'student-01',
        'name': 'مريم حسن (طالب)',
        'email': email,
        'role': 'student',
        'roleLabel': 'طالب / دارس',
        'company': 'منصة عين التعليمية',
      };
    } else if (email.contains('employee')) {
      return <String, Object?>{
        'id': 'employee-01',
        'name': 'محمد أحمد (مستخدم نهائي)',
        'email': email,
        'role': 'end-user',
        'roleLabel': 'مستخدم نهائي',
        'company': 'TechCorp Academy',
      };
    }
    return <String, Object?>{
      'id': 'super-01',
      'name': 'مسؤول المنصة الرئيسي',
      'email': email,
      'role': 'super-admin',
      'roleLabel': 'مسؤول النظام العام',
      'company': 'منصة عين التعليمية',
    };
  }

  static Map<String, Object?> _mockCurrentUserProfile(
    Map<String, Object?> user,
  ) {
    final role = user['role']?.toString() ?? 'super-admin';
    final isSuper = role == 'super-admin';

    return <String, Object?>{
      'id': user['id'],
      'name': user['name'],
      'email': user['email'],
      'role': role,
      'roleLabel': user['roleLabel'],
      'company': user['company'],
      'workspaceStatus': 'active',
      'platformRole': isSuper ? 'super-admin' : null,
      'emailVerified': true,
      'locale': 'ar',
      'timezone': 'Africa/Cairo',
      'permissions': [
        if (isSuper) ...[
          'platform.admin',
          'platform.overview',
          'platform.academies.review',
          'platform.courses.review',
          'platform.promotions.review',
          'platform.categories.manage',
        ],
        'organization.view',
        'organization.manage',
        'courses.view',
        'courses.manage',
        'attendance.view',
        'bookings.view',
        'analytics.view',
      ],
      'workspaces': [
        <String, Object?>{
          'membershipId': 'mem-01',
          'organizationId': 'org-techcorp',
          'name': 'TechCorp Academy (مصر)',
          'slug': 'techcorp',
          'type': 'academy',
          'role': isSuper ? 'tenant-admin' : role,
          'permissions': ['all'],
        },
        <String, Object?>{
          'membershipId': 'mem-02',
          'organizationId': 'org-elite',
          'name': 'Elite Training Center',
          'slug': 'elite',
          'type': 'academy',
          'role': 'student',
          'permissions': ['learning.view'],
        },
      ],
    };
  }

  static final List<Map<String, Object?>> _mockCourses = [
    <String, Object?>{
      'id': 'course-01',
      'slug': 'flutter-dart-advanced',
      'title': 'تطوير تطبيقات الموبايل المتقدمة بـ Flutter & Dart',
      'titleAr': 'تطوير تطبيقات الموبايل المتقدمة بـ Flutter & Dart',
      'shortDescription':
          'تعلم بناء تطبيقات هجينة احترافية مع معمارية متطورة وإدارة حالة بـ Riverpod',
      'priceMinor': 200000,
      'discountedPriceMinor': 150000,
      'effectivePriceMinor': 150000,
      'currency': 'EGP',
      'status': 'published',
      'duration': '12 أسبوع',
      'sessionsCount': 24,
      'academy': <String, Object?>{
        'id': 'org-techcorp',
        'name': 'TechCorp Academy',
        'slug': 'techcorp',
      },
      'instructor': <String, Object?>{
        'id': 'inst-01',
        'name': 'د. أحمد إبراهيم',
      },
      'category': <String, Object?>{
        'id': 'cat-01',
        'name': 'تطوير البرمجيات',
        'slug': 'software-dev',
      },
      'batches': [
        <String, Object?>{
          'id': 'batch-01',
          'name': 'دفعة الخريف 2026 (مكثفة)',
          'status': 'open_for_booking',
          'capacity': 30,
          'enrolledCount': 18,
          'deliveryType': 'hybrid',
        },
      ],
      'learningOutcomes': [
        'إتقان Flutter 3 وأحدث تقنيات المعمارية النظيفة Clean Architecture',
        'التعامل مع الـ Offline-First والتخزين المشفر وإشعارات FCM',
        'نشر التطبيقات على Google Play و Apple App Store بأعلى كفاءة',
      ],
      'requirements': [
        'معرفة أساسية بأساسيات البرمجة كائنية التوجه OOP',
        'جهاز كمبيوتر جاهز ببيئة عمل Flutter',
      ],
    },
    <String, Object?>{
      'id': 'course-02',
      'slug': 'fullstack-cloud-architecture',
      'title': 'هندسة البرمجيات والأنظمة السحابية الكاملة',
      'titleAr': 'هندسة البرمجيات والأنظمة السحابية الكاملة',
      'shortDescription':
          'تصميم وإدارة الأنظمة عالية الأداء باستخدام Microservices و Docker و Kubernetes',
      'priceMinor': 280000,
      'discountedPriceMinor': 220000,
      'effectivePriceMinor': 220000,
      'currency': 'EGP',
      'status': 'published',
      'duration': '10 أسابيع',
      'sessionsCount': 20,
      'academy': <String, Object?>{
        'id': 'org-techcorp',
        'name': 'TechCorp Academy',
        'slug': 'techcorp',
      },
      'instructor': <String, Object?>{
        'id': 'inst-02',
        'name': 'م. سارة محمود',
      },
      'category': <String, Object?>{
        'id': 'cat-02',
        'name': 'الحوسبة السحابية',
        'slug': 'cloud-computing',
      },
      'batches': [
        <String, Object?>{
          'id': 'batch-02',
          'name': 'المجموعة المسائية',
          'status': 'open_for_booking',
          'capacity': 25,
          'enrolledCount': 12,
          'deliveryType': 'online',
        },
      ],
      'learningOutcomes': [
        'تصميم وبناء REST APIs و GraphQL بأمان وموثوقية عالية',
        'بناء خطوط CI/CD مؤتمتة وسير عمل DevOps كامل',
      ],
      'requirements': [
        'إلمام مسبق بلغة برمجية خلفية Backend واحدة على الأقل',
      ],
    },
    <String, Object?>{
      'id': 'course-03',
      'slug': 'ai-applied-machine-learning',
      'title': 'أساسيات الذكاء الاصطناعي وتطبيقاته العملية',
      'titleAr': 'أساسيات الذكاء الاصطناعي وتطبيقاته العملية',
      'shortDescription':
          'من النماذج الرياضية إلى نماذج اللغة الكبيرة وتطبيقات الذكاء الاصطناعي التوليدي',
      'priceMinor': 220000,
      'discountedPriceMinor': 180000,
      'effectivePriceMinor': 180000,
      'currency': 'EGP',
      'status': 'published',
      'duration': '8 أسابيع',
      'sessionsCount': 16,
      'academy': <String, Object?>{
        'id': 'org-elite',
        'name': 'Elite Training Center',
        'slug': 'elite',
      },
      'instructor': <String, Object?>{
        'id': 'inst-01',
        'name': 'د. خالد عبد الرحمن',
      },
      'category': <String, Object?>{
        'id': 'cat-03',
        'name': 'الذكاء الاصطناعي',
        'slug': 'ai-ml',
      },
      'batches': [
        <String, Object?>{
          'id': 'batch-03',
          'name': 'دفعة عطلة نهاية الأسبوع',
          'status': 'open_for_booking',
          'capacity': 20,
          'enrolledCount': 15,
          'deliveryType': 'hybrid',
        },
      ],
      'learningOutcomes': [
        'بناء وتدريب نماذج التعلم الآلي والشبكات العصبية',
        'تطبيق أدوات RAG و LLM APIs في مشاريع حقيقية',
      ],
      'requirements': [
        'معرفة متوسطة بلغة بايثون Python والرياضيات الأساسية',
      ],
    },
  ];
}

import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final profileDocumentsRepositoryProvider =
    Provider<ProfileDocumentsRepository>((ref) {
  return ProfileDocumentsRepository(ref.watch(dioProvider));
});

class StudentCertificate {
  const StudentCertificate({
    required this.id,
    required this.certificateNumber,
    required this.verificationCode,
    required this.issueDate,
    required this.status,
    required this.courseTitle,
    required this.organizationName,
    required this.studentName,
    this.gradeScore,
  });

  factory StudentCertificate.fromJson(Map<String, Object?> json) {
    final course = _map(json['course']);
    final organization = _map(json['organization']);
    final student = _map(json['student']);

    return StudentCertificate(
      id: _string(json, 'id'),
      certificateNumber: _string(
        json,
        'certificate_number',
        fallbackKey: 'certificateNumber',
      ),
      verificationCode: _string(
        json,
        'verification_code',
        fallbackKey: 'verificationCode',
      ),
      issueDate: _string(json, 'issue_date', fallbackKey: 'issueDate'),
      status: _string(json, 'status'),
      courseTitle: _localizedName(course, 'title'),
      organizationName: _localizedName(organization, 'name'),
      studentName: _string(student, 'name'),
      gradeScore: _integer(
        json['grade_score'] ?? json['gradeScore'],
      ),
    );
  }

  final String id;
  final String certificateNumber;
  final String verificationCode;
  final String issueDate;
  final String status;
  final String courseTitle;
  final String organizationName;
  final String studentName;
  final int? gradeScore;
}

class StudentInvoice {
  const StudentInvoice({
    required this.id,
    required this.invoiceNumber,
    required this.totalMinor,
    required this.currency,
    required this.status,
    required this.issuedAt,
    required this.organizationName,
    required this.customerName,
  });

  factory StudentInvoice.fromJson(Map<String, Object?> json) {
    final organization = _map(json['organization']);
    final user = _map(json['user']);

    return StudentInvoice(
      id: _string(json, 'id'),
      invoiceNumber: _string(
        json,
        'invoice_number',
        fallbackKey: 'invoiceNumber',
      ),
      totalMinor: _integer(json['total_minor'] ?? json['totalMinor']) ?? 0,
      currency: _string(json, 'currency'),
      status: _string(json, 'status'),
      issuedAt: _string(json, 'issued_at', fallbackKey: 'issuedAt'),
      organizationName: _localizedName(organization, 'name'),
      customerName: _string(user, 'name'),
    );
  }

  final String id;
  final String invoiceNumber;
  final int totalMinor;
  final String currency;
  final String status;
  final String issuedAt;
  final String organizationName;
  final String customerName;

  String get formattedTotal =>
      '${(totalMinor / 100).toStringAsFixed(2)} ${currency.isEmpty ? 'EGP' : currency}';
}

class ProfileDocumentsRepository {
  const ProfileDocumentsRepository(this._dio);

  final Dio _dio;

  Future<List<StudentCertificate>> listCertificates() async {
    final response = await _dio.get<Object?>(
      '/certificates',
      queryParameters: const {'perPage': 100},
    );

    return _dataList(response.data)
        .map(StudentCertificate.fromJson)
        .toList(growable: false);
  }

  Future<List<StudentInvoice>> listInvoices() async {
    final response = await _dio.get<Object?>(
      '/invoices',
      queryParameters: const {'perPage': 100},
    );

    return _dataList(response.data)
        .map(StudentInvoice.fromJson)
        .toList(growable: false);
  }
}

List<Map<String, Object?>> _dataList(Object? responseData) {
  final envelope = _map(responseData);
  final data = envelope['data'];
  if (data is! List<Object?>) {
    return const [];
  }

  return data
      .whereType<Map<Object?, Object?>>()
      .map((item) => Map<String, Object?>.from(item))
      .toList(growable: false);
}

Map<String, Object?> _map(Object? value) {
  if (value is Map) {
    return Map<String, Object?>.from(value);
  }
  return const {};
}

String _localizedName(Map<String, Object?> json, String key) {
  return _string(json, '${key}_ar').isNotEmpty
      ? _string(json, '${key}_ar')
      : _string(json, key);
}

String _string(
  Map<String, Object?> json,
  String key, {
  String? fallbackKey,
}) {
  return (json[key] ?? (fallbackKey == null ? null : json[fallbackKey]))
          ?.toString() ??
      '';
}

int? _integer(Object? value) {
  if (value is int) {
    return value;
  }
  return int.tryParse(value?.toString() ?? '');
}

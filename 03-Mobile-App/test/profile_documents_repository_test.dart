import 'package:ain_mobile/src/features/profile/data/profile_documents_repository.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Profile document models', () {
    test('parses a certificate returned by the Laravel API', () {
      final certificate = StudentCertificate.fromJson({
        'id': 'certificate-1',
        'certificate_number': 'AIN-2026-ABC123',
        'verification_code': 'CERT-ABCD-EFGH',
        'issue_date': '2026-10-01',
        'grade_score': 91,
        'status': 'issued',
        'course': {'title': 'Physics', 'title_ar': 'الفيزياء'},
        'organization': {'name': 'AIN Academy'},
        'student': {'name': 'Mariam Hassan'},
      });

      expect(certificate.id, 'certificate-1');
      expect(certificate.certificateNumber, 'AIN-2026-ABC123');
      expect(certificate.verificationCode, 'CERT-ABCD-EFGH');
      expect(certificate.courseTitle, 'الفيزياء');
      expect(certificate.studentName, 'Mariam Hassan');
      expect(certificate.gradeScore, 91);
    });

    test('parses and formats an invoice returned by the Laravel API', () {
      final invoice = StudentInvoice.fromJson({
        'id': 'invoice-1',
        'invoice_number': 'INV-2026-001',
        'total_minor': 125000,
        'currency': 'EGP',
        'status': 'paid',
        'issued_at': '2026-10-01T12:00:00Z',
        'organization': {'name': 'AIN Academy'},
        'user': {'name': 'Mariam Hassan'},
      });

      expect(invoice.id, 'invoice-1');
      expect(invoice.invoiceNumber, 'INV-2026-001');
      expect(invoice.totalMinor, 125000);
      expect(invoice.formattedTotal, '1250.00 EGP');
      expect(invoice.organizationName, 'AIN Academy');
      expect(invoice.customerName, 'Mariam Hassan');
    });
  });
}

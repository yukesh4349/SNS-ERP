import 'package:flutter/foundation.dart';

class AppConfig {
  static const _envUrl = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (_envUrl.isNotEmpty) return _envUrl;
    
    if (kIsWeb) {
      return 'https://sns-schools.onrender.com';
    } else {
      // Production backend for mobile physical version
      return 'https://sns-schools.onrender.com';
    }
  }


  static const defaultEmail = String.fromEnvironment(
    'DEMO_USER_EMAIL',
    defaultValue: 'teacher@sns-erp.local',
  );

  static String get defaultPassword {
    const envPass = String.fromEnvironment('DEMO_USER_PASSWORD');
    if (envPass.isNotEmpty) return envPass;
    
    // Use 12345678 for local dev as requested, ChangeMe123! for live
    return kDebugMode ? '12345678' : 'ChangeMe123!';
  }
}

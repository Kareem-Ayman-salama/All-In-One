import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:flutter/material.dart';

enum PlaceholderTitleKey { explore, myCourses, schedule, profile }

class PlaceholderPage extends StatelessWidget {
  const PlaceholderPage({required this.titleKey, super.key});

  final PlaceholderTitleKey titleKey;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final title = switch (titleKey) {
      PlaceholderTitleKey.explore => strings.explore,
      PlaceholderTitleKey.myCourses => strings.myCourses,
      PlaceholderTitleKey.schedule => strings.schedule,
      PlaceholderTitleKey.profile => strings.profile,
    };

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(child: Text(strings.repositoryWiringPending(title))),
    );
  }
}

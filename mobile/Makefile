SHELL := /bin/bash

STAGING_API_URL ?= https://staging-api.example.com/api/v1
PRODUCTION_API_URL ?= https://api.example.com/api/v1

STAGING_DEFINES := --dart-define=AIN_FLAVOR=staging --dart-define=AIN_API_BASE_URL=$(STAGING_API_URL) --dart-define=AIN_ENABLE_CRASH_REPORTING=true --dart-define=AIN_ALLOW_MOCK_DATA=false
PRODUCTION_DEFINES := --dart-define=AIN_FLAVOR=production --dart-define=AIN_API_BASE_URL=$(PRODUCTION_API_URL) --dart-define=AIN_ENABLE_CRASH_REPORTING=true --dart-define=AIN_ALLOW_MOCK_DATA=false

.PHONY: bootstrap generate format analyze test integration-test ci build-staging-apk build-production-appbundle build-staging-ios build-production-ipa release-check

bootstrap:
	flutter pub get

generate:
	dart run build_runner build --delete-conflicting-outputs

format:
	dart format --set-exit-if-changed .

analyze:
	flutter analyze

test:
	flutter test

integration-test:
	flutter test integration_test

ci: bootstrap generate format analyze test

build-staging-apk:
	flutter build apk --flavor staging $(STAGING_DEFINES)

build-production-appbundle:
	flutter build appbundle --flavor production $(PRODUCTION_DEFINES)

build-staging-ios:
	flutter build ios --flavor staging --no-codesign $(STAGING_DEFINES)

build-production-ipa:
	flutter build ipa --flavor production $(PRODUCTION_DEFINES)

release-check: ci build-production-appbundle build-production-ipa

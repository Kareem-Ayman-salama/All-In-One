import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val hasGoogleServicesConfig = file("google-services.json").exists() ||
    file("src/development/google-services.json").exists() ||
    file("src/staging/google-services.json").exists() ||
    file("src/production/google-services.json").exists()

if (hasGoogleServicesConfig) {
    apply(plugin = "com.google.gms.google-services")
    apply(plugin = "com.google.firebase.crashlytics")
}

android {
    namespace = "com.ain.ain_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    defaultConfig {
        applicationId = "com.ain.ain_mobile"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        manifestPlaceholders["appLabel"] = "AIN"
    }

    flavorDimensions += "environment"

    productFlavors {
        create("development") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            manifestPlaceholders["appLabel"] = "AIN Dev"
        }

        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            manifestPlaceholders["appLabel"] = "AIN Staging"
        }

        create("production") {
            dimension = "environment"
            manifestPlaceholders["appLabel"] = "AIN"
        }
    }

    val keystorePropertiesFile = rootProject.file("key.properties")
    val keystoreProperties = Properties()
    val hasKeystoreFile = keystorePropertiesFile.exists()
    if (hasKeystoreFile) {
        keystoreProperties.load(FileInputStream(keystorePropertiesFile))
    }

    val keyAliasVal = keystoreProperties["keyAlias"] as? String
    val keyPassVal = keystoreProperties["keyPassword"] as? String
    val storeFileVal = keystoreProperties["storeFile"] as? String
    val storePassVal = keystoreProperties["storePassword"] as? String

    val hasCompleteKeystore = hasKeystoreFile &&
        !keyAliasVal.isNullOrBlank() &&
        !keyPassVal.isNullOrBlank() &&
        !storeFileVal.isNullOrBlank() &&
        !storePassVal.isNullOrBlank()

    signingConfigs {
        create("release") {
            if (hasCompleteKeystore) {
                keyAlias = keyAliasVal
                keyPassword = keyPassVal
                storeFile = file(storeFileVal!!)
                storePassword = storePassVal
            }
        }
    }

    buildTypes {
        release {
            if (hasCompleteKeystore) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                val isReleaseBuild = gradle.startParameter.taskNames.any {
                    it.endsWith("Release", ignoreCase = true) ||
                    it.contains("ProductionRelease", ignoreCase = true) ||
                    it.contains("bundleRelease", ignoreCase = true) ||
                    it.contains("assembleRelease", ignoreCase = true)
                }
                if (isReleaseBuild) {
                    throw GradleException("Production release builds must be signed with a valid keystore configured in key.properties (keyAlias, keyPassword, storeFile, storePassword). Fallback to debug signing is strictly prohibited.")
                }
                signingConfig = null
            }

            // ── APK Size Optimization ──
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
}

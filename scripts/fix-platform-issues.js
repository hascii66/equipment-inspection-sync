const fs = require('fs');
const path = require('path');

module.exports = function(context) {
  console.log('--- Custom Cordova Hook: Fixing platform compatibility issues ---');
  
  // 1. Fix Android XmlParser & BAKLAVA compile issues
  const gradlePath = path.join(context.opts.projectRoot, 'platforms/android/CordovaLib/cordova.gradle');
  if (fs.existsSync(gradlePath)) {
    let content = fs.readFileSync(gradlePath, 'utf8');
    if (!content.includes('groovy.xml.XmlParser')) {
      content = content.replace('new XmlParser(false, false)', 'new groovy.xml.XmlParser(false, false)');
      fs.writeFileSync(gradlePath, content, 'utf8');
      console.log('✔ Fixed Android cordova.gradle XmlParser issue.');
    }
  }

  const coreAndroidPath = path.join(context.opts.projectRoot, 'platforms/android/CordovaLib/src/org/apache/cordova/CoreAndroid.java');
  if (fs.existsSync(coreAndroidPath)) {
    let content = fs.readFileSync(coreAndroidPath, 'utf8');
    if (content.includes('Build.VERSION_CODES.BAKLAVA')) {
      content = content.replace('Build.VERSION_CODES.BAKLAVA', '36');
      fs.writeFileSync(coreAndroidPath, content, 'utf8');
      console.log('✔ Fixed Android CoreAndroid.java BAKLAVA reference.');
    }
  }

  // 1.1 Downgrade target/compile SDK to 35 in cdv-gradle-config.json to match user's installed SDK
  const cdvGradleConfigPath = path.join(context.opts.projectRoot, 'platforms/android/cdv-gradle-config.json');
  if (fs.existsSync(cdvGradleConfigPath)) {
    try {
      let config = JSON.parse(fs.readFileSync(cdvGradleConfigPath, 'utf8'));
      if (config.SDK_VERSION === 36 || config.MIN_BUILD_TOOLS_VERSION === '36.0.0') {
        config.SDK_VERSION = 35;
        config.MIN_BUILD_TOOLS_VERSION = '35.0.0';
        fs.writeFileSync(cdvGradleConfigPath, JSON.stringify(config, null, 2), 'utf8');
        console.log('✔ Downgraded Android SDK target to 35 in cdv-gradle-config.json');
      }
    } catch (err) {
      console.error('Failed to parse or write cdv-gradle-config.json:', err);
    }
  }

  // 2. Fix iOS macCatalyst SPM package issue
  const packageSwiftPath = path.join(context.opts.projectRoot, 'platforms/ios/packages/cordova-ios-plugins/Package.swift');
  if (fs.existsSync(packageSwiftPath)) {
    let content = fs.readFileSync(packageSwiftPath, 'utf8');
    if (content.includes('.macCatalyst("11.0")')) {
      content = content.replace('.macCatalyst("11.0")', '.macCatalyst("13.0")');
      fs.writeFileSync(packageSwiftPath, content, 'utf8');
      console.log('✔ Fixed iOS Package.swift macCatalyst version.');
    }
  }

  // 2.1 Upgrade iOS deployment target to 13.0 in project.pbxproj to support modern Xcode compilations
  const pbxprojPath = path.join(context.opts.projectRoot, 'platforms/ios/App.xcodeproj/project.pbxproj');
  if (fs.existsSync(pbxprojPath)) {
    let content = fs.readFileSync(pbxprojPath, 'utf8');
    if (content.includes('IPHONEOS_DEPLOYMENT_TARGET = 11.0;')) {
      content = content.replace(/IPHONEOS_DEPLOYMENT_TARGET = 11\.0;/g, 'IPHONEOS_DEPLOYMENT_TARGET = 13.0;');
      fs.writeFileSync(pbxprojPath, content, 'utf8');
      console.log('✔ Upgraded iOS Deployment Target to 13.0 in project.pbxproj');
    }
  }
};

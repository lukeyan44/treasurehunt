rm treasurehunt.apk
cordova build android --release
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore treasurehunt-release-key.keystore -signedjar treasurehunt.apk -storepass treasurehunt platforms/android/build/outputs/apk/android-release-unsigned.apk treasurehunt

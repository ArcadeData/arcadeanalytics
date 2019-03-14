# Git Changelog Maven plugin changelog

Changelog of Git Changelog Maven plugin.

## v1.0.0-RC1
### GitHub [#16](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/16) Force layout config coefficients are unreadable 

**#16: css styles fixed for firefox.**


[8e56d467122a3b7](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/8e56d467122a3b7) G4br13l3 *2019-02-20 15:11:13*


### GitHub [#25](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/25) JDBC drivers not loaded at runtime

**#25**

 * updates to connectors 1.0.2

[db9da7a4930dc3f](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/db9da7a4930dc3f) robfrank *2019-02-26 13:58:00*

**#25**

 * include the JDBC drivers as dependency to solve connection problems to MySQL and Data.World

[83e555d231588fe](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/83e555d231588fe) robfrank *2019-02-25 10:49:25*


### GitHub [#27](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/27) Copy widgets to other user account

**#27**

 * enables complete copy  of env from template user

[a759e46f1cdeebd](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/a759e46f1cdeebd) robfrank *2019-03-04 10:06:22*

**#27**

 * improves documentation (WIP)

[b33643d356c6b1d](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/b33643d356c6b1d) robfrank *2019-02-26 19:06:34*


### GitHub [#29](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/29) Template user name should be configurable

**#29 configure template user**

 * adds &quot;application.templateUser&quot; property

[81fae43fc58011e](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/81fae43fc58011e) robfrank *2019-02-27 09:50:36*


### GitHub [#35](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/35) switch to maven

**#35 removes script**


[ce7e49ede8bbbd5](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/ce7e49ede8bbbd5) robfrank *2019-03-04 11:00:23*

**#35**

 * adds quiet flag to limit log length

[9da762dd8a25d9d](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/9da762dd8a25d9d) robfrank *2019-03-02 10:07:10*

**#35**

 * fixes maven build: sets fae switch, pass settings

[861e7d4236cf623](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/861e7d4236cf623) robfrank *2019-03-01 16:43:00*

**#35**

 * switches to maven instead of gradle

[2815b071eb2de6d](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/2815b071eb2de6d) robfrank *2019-03-01 16:03:37*


### GitHub [#54](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/54) Remove &quot;single&quot; profile

**#54 remove prod-single profile**

 * removes prod-single from pom
 * moves h2sql dep to prod profile
 * removes build of prod-single from travis

[f2fa0abdd2a90a4](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/f2fa0abdd2a90a4) robfrank *2019-03-13 11:09:38*


### GitHub [#7](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/7) Dependabot can&#39;t resolve your JavaScript dependency files

**#7: webpack-dev-server manually upgraded to 3.2.0.**


[c900c3d708ef802](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/c900c3d708ef802) G4br13l3 *2019-02-20 15:36:17*



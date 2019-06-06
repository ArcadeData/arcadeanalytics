# Git Changelog Maven plugin changelog

Changelog of Git Changelog Maven plugin.

## v1.0.1
### GitHub [#103](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/103) Changing contract type on managed user has no effetc

**#103 fixing contract management, WIP**


[e4f3b079b806978](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/e4f3b079b806978) robfrank *2019-05-24 14:50:11*


### GitHub [#106](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/106) Indexing infrastructure review

**#106**

 * adds support for highlighting, not yet forwarded to FR

[fb97644d0c42122](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/fb97644d0c42122) robfrank *2019-06-06 13:34:49*

**#106**

 * adds hasIndex method
 * adds watchdog on multiple indexing requests
 * reviews logs

[723146cb0d91d88](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/723146cb0d91d88) robfrank *2019-06-05 09:35:44*


### GitHub [#107](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/107) Align EE frontend base code with OS: new query templating feature

**#107: second merge.**


[679fa160fb509cf](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/679fa160fb509cf) G4br13l3 *2019-06-05 10:01:46*

**#107**

 * adds supoort for plain queries

[50a87ac646e4e8f](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/50a87ac646e4e8f) robfrank *2019-06-05 08:22:54*

**#107 first merge commit.**


[90652371de72e3c](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/90652371de72e3c) G4br13l3 *2019-06-04 13:34:35*


### GitHub [#62](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/62) Default widgets for newly created user are blank

**#62: stronger fix.**


[cdedac60fc688a0](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/cdedac60fc688a0) G4br13l3 *2019-04-29 15:46:31*


### GitHub [#82](https://github.com/ArcadeAnalytics/arcadeanalytics/issues/82) graph widget: feature to delete a snapshot

**#82 adds rest endpoint and services methods to handle deletion of a snapshot**


[73dffdee950ee5a](https://github.com/ArcadeAnalytics/arcadeanalytics/commit/73dffdee950ee5a) robfrank *2019-05-02 15:32:42*


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



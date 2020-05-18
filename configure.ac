AC_INIT([ArtNavsegda], [1.0], [artnavsegda@gmail.com],[artnavsegda],[https://github.com/artnavsegda])
AM_INIT_AUTOMAKE
AC_MSG_NOTICE([Art Navsegda])
AC_PROG_CC_STDC
AC_CHECK_LIB([jerry-port-default],[jerry_port_fatal])
AC_CHECK_LIB([jerry-libm],[jerry_init],,,[-ljerry-core -ljerry-libm])
AC_CHECK_LIB([jerry-core],[jerry_init],,,[-ljerry-libm])
AC_CHECK_LIB([jerry-ext],[jerry_init])
AC_CHECK_LIB([readline], [readline])
AC_CONFIG_HEADERS([config.h])
AC_CONFIG_FILES([Makefile src/Makefile])
AC_OUTPUT

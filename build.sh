#!/bin/sh

RELEASE=${1:-21.02.3}
ARCH=${2:-ramips}
SOC=${3:-mt7621}

# git clone https://gitlab.com/openwrt-dev-ru-smartbox/openwrt-mt7621-sercomm-smartbox.git && cd openwrt-mt7621-sercomm-smartbox
# CONFIG_TARGET_[^_]+$

# TODO: use SDK from https://downloads.openwrt.org/releases/21.02.3/targets/ramips/mt7621/openwrt-sdk-21.02.3-ramips-mt7621_gcc-8.4.0_musl.Linux-x86_64.tar.xz

git checkout "v${RELEASE}"

make distclean

./scripts/feeds update -a && ./scripts/feeds install -a

OPENWRT_DOWNLOADS_URL="https://downloads.openwrt.org/releases/${RELEASE}/targets/${ARCH}/${SOC}"
RELEASE_KMODS_URL="${OPENWRT_DOWNLOADS_URL}/kmods/"

FORCE_VERMAGIC=0e0aa31d4e07a93312bc0c08127b3950
if [ -z "$FORCE_VERMAGIC" ] ; then
        echo Downloading vermagic
        VERMAGIC_LINE=$(curl $RELEASE_KMODS_URL | grep '<tr>' | grep -v 'Date')
        VERMAGIC_TXT_TAIL="${VERMAGIC_LINE#*\/\">}"
        VERMAGIC_TXT="${VERMAGIC_TXT_TAIL%%<*}"
        VERMAGIC="${VERMAGIC_TXT##*-}"
else    
        VERMAGIC="$FORCE_VERMAGIC"
fi

BUILDINFO_URL="${OPENWRT_DOWNLOADS_URL}/config.buildinfo"

# curl https://downloads.openwrt.org/releases/21.02.2/targets/ramips/mt7621/config.buildinfo | egrep -v '^(CONFIG_REPRODUCIBLE_DEBUG_INFO|CONFIG_COLLECT_KERNEL_DEBUG|CONFIG_SDK|CONFIG_ALL_KMODS)'

curl "$BUILDINFO_URL" | egrep -v '^CONFIG_(REPRODUCIBLE_DEBUG_INFO|COLLECT_KERNEL_DEBUG|SDK|ALL_KMODS|BUILDBOT|IB)' > .config

echo "CONFIG_KERNEL_VERMAGIC=$VERMAGIC" >> .config


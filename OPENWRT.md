## Recovery

OpenWRT have quite an idea about recovery mode. It shuts down WiFi,
and allows to connect using only one wired port with static address.

If I want to use recovery, I would like to have additional wireless SSID
to perform recovery. Maybe also it will be nice to have
dedicated Ethernet port just for recovery purposes. But that can be implemented
using UART-on-Router<=>USB-on-Computer or USB<=>RNDIS-on-Android.

## DumbAP / Router switch

 * guide: https://openwrt.org/docs/guide-user/network/wifi/dumbap

## Separate SSID for gadgets with mDNS passtrough

Guest network

 * uci: https://gist.github.com/tongpu/c54d1f45a8874d28b5d4

 * LuCI: https://openwrt.org/docs/guide-user/network/wifi/guestwifi/guestwifi_dumbap
 * on forum: https://forum.openwrt.org/t/separate-all-wifi-connections-into-their-own-network/85306/8

## Radius

https://github.com/ouaibe/howto/blob/master/OpenWRT/802.1xOnOpenWRTUsingFreeRadius.md



# SERCOMM RESTORE

Various tools to fix/restore/dump data from your sercomm device

I'm using those scripts to flash/restore my Beeline Turbo+ router

## Before anything

Read https://forum.openwrt.org/t/add-support-for-beeline-smartbox-turbo/99635

<details>
<summary>Have a copy of your mtd files</summary>

Login into web interface as SuperUser, password is device serial number

Go to [SSH settings](http://192.168.1.1/mgt_admin.htm?l0=3&l1=8&l2=0&l3=-1),
click radio button on the same string with SuperUser, enable SSH for LAN,
save and apply settings

https://forum.openwrt.org/t/add-support-for-beeline-smartbox-turbo/99635/33

local machine

```sh
ssh-keygen -t rsa -f ~/.ssh/smartbox
```

add lines below to the ~/.ssh/config

```
Host smartbox
        HostName 192.168.1.1
        User SuperUser
        IdentityFile ~/.ssh/smartbox
```

```
ssh -o UserKnownHostsFile=/dev/null smartbox
```

remote machine:

```sh
sed -i 's/\/usr\/sbin\/sftp-server/internal-sftp/' /etc/ssh/sshd_config

echo 'AuthorizedKeysFile2 /etc/ssh/authorized_keys' >> /etc/ssh/sshd_config

# check configuration before restarting sshd
sshd -T

# restart sshd
kill -HUP $(ps | grep /usr/sbin/sshd | grep -v grep | awk '{print $1}')
```


Run commands in separate terminals:

on router: `( PART=0 ; nanddump -f /tmp/mtd${PART}.bin /dev/mtd${PART} )`

You can dump partitions 0-5 without transferring files, 
but device doesn't have space on flash/ram to dump last partitions

on your unix device: `{LOCAL_DIR=/tmp ; echo "lcd ${LOCAL_DIR}\nmget /tmp/mtd*.bin"} | sftp smartbox`

then remove dumped partitions on router: `rm /tmp/mtd*.bin`

run again on router: `( PART=1 ; nanddump -f /tmp/mtd${PART}.bin /dev/mtd${PART} )`

copy files again: `{LOCAL_DIR=/tmp ; echo "lcd ${LOCAL_DIR}\nmget /tmp/mtd*.bin"} | sftp smartbox`

Then replace 1 with 2, 3, ...9

Check if all files are transferred, from 0 to 9

</details>

SD1811FF1352


CSN=$(hexdump -e '/2 "%1s"' -n 12 -s 135184 /dev/mtd2)


## Scripts

### read-sercomm-flash.js

_To be used with Stock bootloader_

<details>
<summary>Read NAND flash over UART in recovery mode.</summary>
I have Beeline Turbo+ router with dead flash. When power plugged in,
after short delay leds flashing red/green. It cannot start os
and I decided to dump factory partition and then restore
to the new flash IC. To do so, I need to connect to the router using UART
and dump factory partition page by page (flash memory organized by pages,
partition size 1MB, page size is 2KB, so it's 500 pages).

After UART plugged in (some USB UART supply power to router,
not enough to start, but enough not to boot), you should press [space]
fast to enter bootloader CLI. There you can run some commands,
or disconnect from router. Take a look inside script,
adjust partitions you would like to dump. After you run script it will
log bootloader answers in dump directory and create binary file with
flash contents from your range. Don't dump entire flash,
it will take eternity.

I recommend you to dump partition table (start 0x100000, end 0x101000),
backup partition table (start 0x120000, end 0x121000),
and factory (start 0x200000, end 0x300000).

Use `verify` script to verify factory partition offset

You can browse more commands: [russian](https://4pda.to/forum/index.php?showtopic=943587&view=findpost&p=93903954) [english](https://forum.openwrt.org/t/add-support-for-beeline-smartbox-turbo/99635/15)

</details>

After dumping all important data you can try [ru: emergency recovery](https://4pda.to/forum/index.php?showtopic=943587&st=6160#entry109251225) from recovery image

Create full binary

`cat mtd0 ... mtd9 > full.bin`

Add OOB data:

`bbe -b ":512" -e "A 0000000000000000" full.bin -o full-oob.bin`

Recovery image Uboot at 0x1C560

#S1500NBN Создание Аварийного образа c OpenWRT
Как вчера и говорил @Kuzja получилось зашить OpenWRT таким методом:
Из предыдущих сообщений по OpenWRT и NBN взять образы *-kernel.img & *-rootfs.img 
Далее создать пустые файлы разделов mtd5 и mtd7 размера 4 MiB & 46 MiB соответственно:
fallocate -l 4MB mtd5.Kernel.OpenWRT.bin аналогично для rootfs.
Далее записать поверх
dd if=openwrt-21.02.2-ramips-mt7621-wifire_s1500-nbn-squashfs-kernel.bin of=mtd5.Kernel.OpenWRT.bin conv=notrunc аналогично для rootfs.
Далее как и в предыдущем сообщении объединяем через cat все разделы только с заменой mtd5 и mtd7 с OpenWRT.
Восстанавливаем через Аварийный режим образ, получаем OpenWRT на NBN.

Благодарим сердечно за испытания @Kuzja

### http server

_To be used with Breed bootloader_

<details>
<summary>Launch script, it should serve contents of the `www` directory.</summary>

Put your backup firmware files to that directory.

https://4pda.to/forum/index.php?showtopic=943587&view=findpost&p=110203725

**THINK BEFORE YOU'RE DOING NEXT STEPS**

telnet 192.168.1.1

on device

**THINK TWICE**

```
wget http://192.168.1.2/mtd1
flash write 0x100000 0x80001000 1048576
            ^ start  ^ memory   ^ size
```


flash erase 0x100000 0x6e00000

wget http://192.168.1.2/mtd_backup/mtd1
flash write 0x100000 0x80001000 1048576

wget http://192.168.1.2/mtd_backup/mtd2
flash write 0x200000 0x80001000 1048576

wget http://192.168.1.2/mtd_backup/mtd3
flash write 0x300000 0x80001000 1048576

wget http://192.168.1.2/mtd_backup/mtd4
flash write 0x400000 0x80001000 6291456

 wget http://192.168.1.2/mtd_backup/mtd5
flash write 0xa00000 0x80001000 6291456

wget http://192.168.1.2/mtd_backup/mtd6
flash write 0x1000000 0x80001000 0x2000000

wget http://192.168.1.2/mtd_backup/mtd7
flash write 0x3000000 0x80001000 0x2000000

wget http://192.168.1.2/mtd_backup/mtd8
flash write 0x5000000 0x80001000 0x1400000

wget http://192.168.1.2/mtd_backup/mtd9
flash write 0x6400000 0x80001000 0x1b80000

boot flash 0x400100

**CHECK IF EVERYTHING ALLRIGHT**

Ethernet ports will not be available, connect using WiFi
and check if web interface available on http://192.168.1.1

```
wget http://192.168.1.2:5000/mtd0      
flash erase 0x0 0x100000
flash write 0x0 0x80001000 1048576
```

http://192.168.1.1/envedit.html

autoboot.command 0x400100
kernel0 0x400100
kernel1 0xa00100

</details>


sed -i '/^(CONFIG_REPRODUCIBLE_DEBUG_INFO|CONFIG_COLLECT_KERNEL_DEBUG|CONFIG_SDK|CONFIG_ALL_KMODS)=y/d' .config
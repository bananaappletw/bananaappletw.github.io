---
title: KVM GPU passthrough Ubuntu 20.04
tags:
- kvm
- cloud-init
- vfio
- GPU
date: 2021-07-05
---

## Test environment

- Host: Ubuntu 20.04
- Guest: Ubuntu 20.04
- GPU: NVIDIA® GeForce® RTX 2080 Ti

## Enable IOMMU

### Configure GRUB

Edit `/etc/default/grub`

```grub
# Intel CPU
GRUB_CMDLINE_LINUX_DEFAULT="intel_iommu=on"
# AMD CPU
GRUB_CMDLINE_LINUX_DEFAULT="amd_iommu=on iommu=pt kvm_amd.npt=1 kvm_amd.avic=1"
```

### Update GRUB

`sudo update-grub`

### Reboot

`sudo shutdown -r now`

### Verify IOMMU is enabled

`dmesg | grep IOMMU`

Output:

```
IOMMU enabled
```

## Enable IOMMU group

### Check IOMMU group is enabled

`for a in /sys/kernel/iommu_groups/*; do find $a -type l; done | sort --version-sort`

output:

```
/sys/kernel/iommu_groups/0/devices/0000:00:00.0
/sys/kernel/iommu_groups/1/devices/0000:00:04.0
/sys/kernel/iommu_groups/2/devices/0000:00:04.1
/sys/kernel/iommu_groups/3/devices/0000:00:04.2
/sys/kernel/iommu_groups/4/devices/0000:00:04.3
```

### Edit BIOS setting is not enabled

If output is not expected, configure BIOS setting

#### VT-d

(Asus)
- Advanced => System Agent Configuration => Intel VT for Directed I/O (VT-d)

(Supermicro)
- Advanced => CPU Configuration => Intel Virtualization Technology => [enable]
- Advanced => Chipset Configuration => North Bridge => IIO Configuration => Intel VT fot Directed I/O (VT-d) => [enable]

- [https://superuser.com/questions/1112238/intel-iommu-on-but-no-iommu-groups](https://superuser.com/questions/1112238/intel-iommu-on-but-no-iommu-groups)

## Isolation of the guest GPU

import Mermaid from '@theme/Mermaid';

<Mermaid chart={`
graph LR
    subgraph C [guest]
    C1[PCI device]
    end
    subgraph B [hypervisor]
    B1[VFIO] --> C1[PCI device]
    end
    subgraph A [Host]
    A1[PCI device] --> B1[VFIO]
    end
`}/>

## Using vfio-pci to manage PCI device

### Find out vendor ID and device ID

`lspci -nn | grep -i NVIDIA`

```
01:00.0 VGA compatible controller [0300]: NVIDIA Corporation TU102 [GeForce RTX 2080 Ti] [10de:1e04] (rev a1)
01:00.1 Audio device [0403]: NVIDIA Corporation TU102 High Definition Audio Controller [10de:10f7] (rev a1)
01:00.2 USB controller [0c03]: NVIDIA Corporation TU102 USB 3.1 Host Controller [10de:1ad6] (rev a1)
01:00.3 Serial bus controller [0c80]: NVIDIA Corporation TU102 USB Type-C UCSI Controller [10de:1ad7] (rev a1)
```

GeForce RTX 2080 Ti VGA compatible controller:
PCI ID:`01:00.0`
vendor ID: `10de`
device ID: `1e04`

### Configure GRUB

`/etc/default/grub`

Apply all the related devices

```
GRUB_CMDLINE_LINUX_DEFAULT="intel_iommu=on vfio-pci.ids=10de:1e04,10de:10f7,10de:1ad6,10de:1ad7"
```

### Update GRUB

`sudo update-grub`

### Reboot

`sudo reboot`

### Verify PCI device is managed by vfio-pci

`lspci -nnv`

Find the line `Kernel driver in use`

```
0b:00.0 VGA compatible controller [0300]: NVIDIA Corporation TU102 [GeForce RTX 2080 Ti] [10de:1e04] (rev a1) (prog-if 00 [VGA controller])
...
Kernel driver in use: vfio-pci
```

## Test GPU passthrough on kvm instance

### Fresh install

Run `virt-install` with `--host-device [device_id]` and `--features kvm_hidden=on` parameters

```
virt-install ... \
--host-device 01:00.0 \
--features kvm_hidden=on \
```

### Modify existing instance

`virsh edit [domain]`

Add PCI mapping `hostdev` block

`0000:01:00.0` within the host will be mapped to `0000:04:00.0` within guest

:::warning

`bus` number should less than virtio's

Increase virtio's bus number to spare small number for new added entry

:::

```
<devices>
  ...
    <hostdev mode='subsystem' type='pci' managed='yes'>
      <source>
        <address domain='0x0000' bus='0x01' slot='0x00'function='0x0'/>
      </source>
      <address type='pci' domain='0x0000' bus='0x04'slot='0x00' function='0x0'/>
    </hostdev>
    <memballoon model='virtio'>
      <address type='pci' domain='0x0000' bus='0x05'slot='0x00' function='0x0'/>
    </memballoon>
    <rng model='virtio'>
      <backend model='random'>/dev/urandom</backend>
      <address type='pci' domain='0x0000' bus='0x06'slot='0x00' function='0x0'/>
    </rng>
</devices>
```

`kvm hidden` within `features` block

```
<features>
...
  <kvm>
    <hidden state='on'/>
  </kvm>
</features>
```

## Check GPU is working in guest

`lspci`

```
04:00.0 VGA compatible controller: NVIDIA Corporation TU102[GeForce RTX 2080 Ti] (rev a1)
```

Install NVIDIA driver

```sh
sudo apt update
sudo apt install nvidia-driver-460
sudo reboot
```

`nvidia-smi`

```
Wed Mar 10 08:19:43 2021
+---------------------------------------------------------------------------+
| NVIDIA-SMI 460.39       Driver Version: 460.39       CUDVersion: 11.2     |
|-------------------------------+--------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage GPU-Util  Compute M. |
|                               |                    |               MIG M. |
|===============================+====================+======================|
|   0  GeForce RTX 208...  Off  | 00000000:04:00.0 Of|                  N/A |
| 15%   44C    P0     1W / 250W |      0MiB / 11019Mi|      0%      Default |
|                               |                    |                  N/A |
+-------------------------------+--------------------+----------------------+
+---------------------------------------------------------------------------+
Processes:                                                                |
|  GPU   GI   CI        PID   Type   Procesname                  GPU Memory |
|        ID ID                                                 Usage      |
===========================================================================|
|  No running processefound                                                 |
+---------------------------------------------------------------------------+
```

## Reference

- [https://mathiashueber.com/pci-passthrough-ubuntu-2004-virtual-machine/](https://mathiashueber.com/pci-passthrough-ubuntu-2004-virtual-machine/)
